import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, loginWithGoogle, saveAuth } from "../../../api/authService";
import { supabase } from "../../../api/supabaseClient";
import useAuth from "../../../hooks/useAuth";
import "./LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const redirectByRole = (role, redirectOverride) => {
    // redirectOverride: dùng cho luồng Google login, vì lúc gọi hàm này
    // window.location.search đã bị xóa (xem finalizeGoogleLogin ở dưới).
    const redirectUrl =
        redirectOverride !== undefined
            ? redirectOverride
            : new URLSearchParams(window.location.search).get("redirect");
    if (redirectUrl) {
      navigate(redirectUrl, { replace: true });
      return;
    }

    const normalizedRole = String(role || "").toUpperCase();

    if (normalizedRole === "ADMIN") {
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    if (normalizedRole === "MANAGER" || normalizedRole === "STAFF") {
      navigate("/manager/dashboard", { replace: true });
      return;
    }

    navigate("/customer/home", { replace: true });
  };

  const handleLoginSuccess = (result, redirectOverride) => {
    saveAuth(result);
    if (auth) {
      auth.setToken(result.accessToken);
      auth.setUser({
        userId: result.user?.userId,
        username: result.user?.username,
        fullName: result.user?.fullName,
        role: result.user?.role,
        customerId: result.user?.customerId
      });
    }

    const savedToken = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");

    if (!savedToken) {
      setErrorMessage("Đăng nhập thành công nhưng chưa lưu được token.");
      setSuccessMessage("");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("Đăng nhập thành công. Đang chuyển vào hệ thống...");

    setTimeout(() => {
      redirectByRole(savedRole || result?.user?.role, redirectOverride);
    }, 700);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.username.trim()) {
      setErrorMessage("Vui lòng nhập email hoặc tên đăng nhập.");
      setSuccessMessage("");
      return;
    }

    if (!formData.password.trim()) {
      setErrorMessage("Vui lòng nhập mật khẩu.");
      setSuccessMessage("");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const result = await login(formData.username, formData.password);

      handleLoginSuccess(result);
    } catch (error) {
      console.error("Login error:", error);

      const message =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.response?.data?.data?.message ||
          "Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng nhập lại.";

      setErrorMessage(message);
      setSuccessMessage("");

      setFormData((prev) => ({
        ...prev,
        password: "",
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("Đang chuyển đến Google...");

      // QUAN TRỌNG: giữ lại query string hiện tại (vd "?redirect=/customer/booking")
      // trong redirectTo. Nếu không, sau khi Google xác thực xong, trình duyệt
      // quay lại đúng "/auth/login" KHÔNG có "redirect", khiến login Google luôn
      // đưa người dùng về trang mặc định theo role thay vì trang họ định vào
      // (ví dụ bấm "Đặt lịch" ở trang dịch vụ -> đăng nhập Google -> không vào
      // được trang booking).
      const currentSearch = window.location.search;

      // QUAN TRỌNG: supabase-js dùng navigator.locks (khóa DÙNG CHUNG giữa
      // các tab cùng origin) để đồng bộ việc đọc/ghi session. Nếu có 1 tab
      // khác của app này bị treo/kẹt từ trước, tab đó có thể đang giữ khóa
      // mãi mãi -> lệnh gọi signInWithOAuth() ở đây sẽ chờ khóa vô thời hạn
      // và "kẹt ngay trên trang", chưa kịp chuyển sang Google.
      // Bọc Promise.race với timeout để KHÔNG BAO GIỜ treo vô hạn nữa,
      // dù nguyên nhân gốc là gì.
      const oauthPromise = supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/login${currentSearch}`,
        },
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
            () => reject(new Error("GOOGLE_REDIRECT_TIMEOUT")),
            8000
        );
      });

      const { error } = await Promise.race([oauthPromise, timeoutPromise]);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Google login error:", error);

      if (error?.message === "GOOGLE_REDIRECT_TIMEOUT") {
        setErrorMessage(
            "Không thể chuyển sang Google (có thể do phiên đăng nhập ở tab/cửa sổ khác bị kẹt). " +
            "Hãy đóng các tab khác của trang này rồi thử lại, hoặc thử ở cửa sổ ẩn danh."
        );
      } else {
        setErrorMessage("Không thể đăng nhập bằng Google. Vui lòng thử lại.");
      }

      setSuccessMessage("");
      setLoading(false);
    }
  };

  // ============================================================
  // 🔧 Xử lý callback đăng nhập Google
  // ============================================================
  // LƯU Ý: KHÔNG dùng cờ toàn cục kiểu "đã xử lý rồi thì bỏ qua" ở đây.
  // Trước đây có 1 biến module-level (googleCallbackHandled) để chặn effect
  // chạy 2 lần, nhưng nó gây TREO VĨNH VIỄN khi bật React.StrictMode (dev):
  // StrictMode chạy effect 2 lần (mount -> cleanup -> mount lại). Ở lần 1,
  // cờ được set = true và listener/timeout được tạo; cleanup chạy gần như
  // ngay lập tức trong khi "finished" vẫn false nên cờ KHÔNG được reset,
  // đồng thời listener + timeout của lần 1 đã bị hủy. Đến lần mount thứ 2
  // (lần tồn tại thật sự), effect thấy cờ = true nên thoát sớm, không tạo
  // lại listener/timeout nào cả -> màn hình "Đang xác thực..." treo mãi mãi
  // vì không còn cơ chế nào (kể cả timeout 10s) chạy để cứu.
  //
  // Vì đang dùng implicit flow (access_token nằm trong URL hash), token này
  // KHÔNG phải one-time-use như "code" của PKCE, nên gọi loginWithGoogle()
  // 2 lần (trường hợp hiếm gặp do StrictMode) là vô hại — backend
  // (GoogleUserCreatorService) đã xử lý an toàn việc tạo/lấy user trùng lặp.
  // Mỗi lần effect chạy tự quản lý biến "finished" cục bộ của riêng nó.
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hasGoogleCode = searchParams.has("code");
    const hasAccessTokenInHash = window.location.hash.includes("access_token");

    if (!hasGoogleCode && !hasAccessTokenInHash) {
      return;
    }

    // QUAN TRỌNG: phải đọc "redirect" NGAY BÂY GIỜ, trước khi
    // window.history.replaceState() bên dưới xóa mất query string.
    // Nếu không, sau khi đăng nhập Google xong, hệ thống sẽ luôn đưa
    // người dùng về trang mặc định theo role (vd /customer/home) thay vì
    // trang họ định vào ban đầu (vd /customer/booking).
    const pendingRedirect = searchParams.get("redirect");

    let finished = false;

    const finalizeGoogleLogin = async (session) => {
      if (finished) return;
      finished = true;

      window.history.replaceState({}, document.title, "/auth/login");

      try {
        const supabaseToken = session?.access_token;

        if (!supabaseToken) {
          setErrorMessage("Không lấy được Google token. Vui lòng thử lại.");
          setSuccessMessage("");
          return;
        }

        const result = await loginWithGoogle(supabaseToken);

        handleLoginSuccess(result, pendingRedirect);
      } catch (error) {
        console.error("Google callback error:", error);
        setErrorMessage("Đăng nhập Google thất bại. Vui lòng thử lại.");
        setSuccessMessage("");
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("Đang xác thực tài khoản Google...");

    const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (event === "SIGNED_IN" && session) {
            finalizeGoogleLogin(session);
          }
        }
    );

    supabase.auth.getSession().then(({ data, error }) => {
      if (!error && data?.session) {
        finalizeGoogleLogin(data.session);
      }
    });

    const timeoutId = setTimeout(() => {
      if (!finished) {
        finished = true;
        window.history.replaceState({}, document.title, "/auth/login");
        setErrorMessage(
            "Đăng nhập Google quá thời gian chờ. Vui lòng thử lại."
        );
        setSuccessMessage("");
        setLoading(false);
      }
    }, 10000);

    return () => {
      authListener?.subscription?.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);
  // ============================================================
  // 🔧 KẾT THÚC PHẦN XỬ LÝ CALLBACK GOOGLE
  // ============================================================

  return (
      <div className="login-page">
        <div className="login-container">
          <section className="login-left">
            <div className="login-brand">
              <div className="login-logo">
                <img src="/logo.png" alt="Logo" style={{ width: "85%", height: "auto" }} />
              </div>
              <span>WashFlow Pro</span>
            </div>

            <div className="login-hero-content">
              <span className="login-badge">Rửa xe thông minh</span>

              <h1>
                Đặt lịch rửa xe
                <br />
                nhanh chóng và tiện lợi
              </h1>

              <p>
                Quản lý đặt lịch, ưu đãi, điểm thưởng và hồ sơ cá nhân của bạn
                chỉ trong một nền tảng.
              </p>

              <div className="login-stats">
                <div>
                  <strong>24/7</strong>
                  <span>Đặt lịch online</span>
                </div>

                <div>
                  <strong>50+</strong>
                  <span>Dịch vụ chăm sóc xe</span>
                </div>

                <div>
                  <strong>4.9</strong>
                  <span>Đánh giá khách hàng</span>
                </div>
              </div>
            </div>
          </section>

          <section className="login-right">
            <div className="login-form-wrapper">
              <div className="login-form-logo">
                <div className="login-form-logo-box">
                  <img src="/logo.png" alt="Logo" style={{ width: "80%", height: "auto", filter: "brightness(0) invert(1)" }} />
                </div>
                <h1>WashFlow Pro</h1>
                <p>Sạch bóng từng centimet</p>
              </div>

              <div className="login-card">
                <div className="login-card-header">
                  <h2>Đăng nhập tài khoản</h2>
                  <p>Chào mừng bạn quay trở lại với hệ thống.</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                  {errorMessage && (
                      <div className="login-error">{errorMessage}</div>
                  )}

                  {successMessage && (
                      <div className="login-success">{successMessage}</div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="username">
                      Email hoặc Tên đăng nhập
                    </label>

                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">👤</span>
                      <input
                          id="username"
                          name="username"
                          className="auth-input"
                          type="text"
                          placeholder="example@washflow.vn"
                          autoComplete="username"
                          value={formData.username}
                          onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="password">
                      Mật khẩu
                    </label>

                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">🔒</span>
                      <input
                          id="password"
                          name="password"
                          className="auth-input auth-password-input"
                          type={showPassword ? "text" : "password"}
                          placeholder="Nhập mật khẩu"
                          autoComplete="current-password"
                          value={formData.password}
                          onChange={handleChange}
                      />

                      <button
                          className="auth-eye-btn"
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {showPassword ? "🙈" : "👁"}
                      </button>
                    </div>
                  </div>

                  <div className="login-options">
                    <label className="remember-me">
                      <input type="checkbox" />
                      <span>Ghi nhớ tôi</span>
                    </label>

                    <Link to="/auth/forgot-password">Quên mật khẩu?</Link>
                  </div>

                  <button
                      className="login-submit-btn"
                      type="submit"
                      disabled={loading}
                  >
                    {loading ? "Đang đăng nhập..." : "Đăng nhập"} <span>→</span>
                  </button>
                </form>

                <div className="login-divider">
                  <span>HOẶC TIẾP TỤC VỚI</span>
                </div>

                <button
                    className="login-google-btn"
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >
                  <span>🌐</span>
                  Đăng nhập với Google
                </button>

                <p className="login-register-text">
                  Chưa có tài khoản?{" "}
                  <Link to="/auth/register">Đăng ký ngay</Link>
                </p>
              </div>

              <div className="login-footer-links">
                <Link to="/">Dịch vụ</Link>
                <Link to="/customer/support">Hỗ trợ</Link>
                <Link to="/">Điều khoản</Link>
              </div>
            </div>
          </section>
        </div>
      </div>
  );
}

export default LoginPage;