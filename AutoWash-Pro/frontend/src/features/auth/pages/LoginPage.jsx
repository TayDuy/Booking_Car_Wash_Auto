import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, loginWithGoogle, saveAuth } from "../../../api/authService";
import { supabase } from "../../../api/supabaseClient";
import useAuth from "../../../hooks/useAuth";
import "./LoginPage.css";

// Đề phòng bất kỳ lệnh gọi async nào tới Supabase (đăng nhập, lấy session,
// đổi code lấy session...) bị treo vô thời hạn - do lock nội bộ kẹt, mạng
// chặn domain supabase.co, DNS lỗi... - luôn race với timeout để có phản hồi
// thay vì UI treo "đang tải" mãi mãi.
const withTimeout = (promise, ms, label) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
          setTimeout(
              () => reject(new Error(`TIMEOUT: ${label} không phản hồi sau ${ms}ms`)),
              ms
          )
      ),
    ]);

function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    if (auth?.token) {
      const role = (localStorage.getItem("role") || "").toUpperCase();
      const home = { ADMIN: "/admin/dashboard", EMPLOYEE: "/employee/dashboard", CUSTOMER: "/customer/home", USER: "/customer/home" }[role] || "/customer/home";
      navigate(home, { replace: true });
    }
  }, []);

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

  const redirectByRole = (role) => {
    const normalizedRole = String(role || "").toUpperCase();

    const homeByRole = {
      ADMIN: "/admin/dashboard",
      EMPLOYEE: "/employee/dashboard",
      CUSTOMER: "/customer/home",
      USER: "/customer/home",
    };

    const routePrefixByRole = {
      ADMIN: "/admin",
      EMPLOYEE: "/employee",
      CUSTOMER: "/customer",
      USER: "/customer",
    };

    const defaultPath = homeByRole[normalizedRole];

    if (!defaultPath) {
      navigate("/unauthorized", { replace: true });
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const redirectUrl = searchParams.get("redirect");
    const allowedPrefix = routePrefixByRole[normalizedRole];

    // Chỉ dùng redirect cũ khi route đó đúng với quyền của tài khoản.
    // Ví dụ Employee không bị đưa nhầm sang /manager hoặc /customer.
    if (
        redirectUrl &&
        redirectUrl.startsWith("/") &&
        redirectUrl.startsWith(allowedPrefix)
    ) {
      navigate(redirectUrl, { replace: true });
      return;
    }

    navigate(defaultPath, { replace: true });
  };

  const handleLoginSuccess = (result) => {
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
      redirectByRole(savedRole || result?.user?.role);
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
    console.log("[GoogleLogin] Bắt đầu, đã bấm nút.");
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("Đang chuyển đến Google...");

      console.log("[GoogleLogin] Gọi supabase.auth.signInWithOAuth...");
      const { data, error } = await withTimeout(
          supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: `${window.location.origin}/auth/login`,
            },
          }),
          8000,
          "signInWithOAuth"
      );

      console.log("[GoogleLogin] Kết quả signInWithOAuth:", { data, error });

      if (error) {
        throw error;
      }

      // Ở luồng redirect mặc định, supabase-js tự set window.location = data.url
      // để chuyển sang trang Google. Nếu sau khi gọi xong mà trình duyệt vẫn
      // chưa điều hướng (gặp ở một số trình duyệt/extension chặn redirect tự
      // động), fallback điều hướng thủ công bằng data.url.
      if (data?.url) {
        console.log("[GoogleLogin] Điều hướng thủ công tới:", data.url);
        window.location.assign(data.url);
      }
    } catch (error) {
      console.error("[GoogleLogin] Lỗi:", error);
      const detail = error?.message ? ` (${error.message})` : "";
      setErrorMessage(`Không thể đăng nhập bằng Google. Vui lòng thử lại.${detail}`);
      setSuccessMessage("");
      setLoading(false);
    }
  };

  const googleCallbackHandledRef = useRef(false);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hasGoogleCode = searchParams.has("code");
      const hasAccessTokenInHash = window.location.hash.includes("access_token");

      if (!hasGoogleCode && !hasAccessTokenInHash) {
        return;
      }

      if (googleCallbackHandledRef.current) {
        return;
      }
      googleCallbackHandledRef.current = true;

      try {
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("Đang xác thực tài khoản Google...");

        console.log("[GoogleCallback] Bắt đầu xử lý, url:", window.location.href);

        let supabaseToken;

        if (hasGoogleCode) {
          // Luồng PKCE: có ?code=... trên URL. Thay vì trông chờ vào cơ chế
          // tự động "detectSessionInUrl" (chạy ngầm lúc khởi tạo client, khó
          // theo dõi/log và không có timeout), gọi thẳng exchangeCodeForSession
          // để kiểm soát được lỗi + timeout rõ ràng.
          const code = searchParams.get("code");
          console.log("[GoogleCallback] Có code, gọi exchangeCodeForSession...");
          const { data, error } = await withTimeout(
              supabase.auth.exchangeCodeForSession(code),
              10000,
              "exchangeCodeForSession"
          );
          console.log("[GoogleCallback] Kết quả exchangeCodeForSession:", { data, error });
          if (error) throw error;
          supabaseToken = data?.session?.access_token;
        } else {
          // Luồng hash: token nằm sau dấu # (không phải ?). Vì đã tắt
          // detectSessionInUrl trong supabaseClient.js (để tránh race condition
          // với chính đoạn code này), ở đây phải tự parse hash rồi gọi
          // setSession() thủ công để supabase-js lưu session vào bộ nhớ/local
          // storage - getSession() sẽ KHÔNG tự có gì nếu không làm bước này.
          console.log("[GoogleCallback] Không có code (hash flow), tự parse hash...");
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const hashAccessToken = hashParams.get("access_token");
          const hashRefreshToken = hashParams.get("refresh_token");

          if (!hashAccessToken || !hashRefreshToken) {
            throw new Error("Không tìm thấy access_token/refresh_token trong hash URL.");
          }

          const { data, error } = await withTimeout(
              supabase.auth.setSession({
                access_token: hashAccessToken,
                refresh_token: hashRefreshToken,
              }),
              10000,
              "setSession"
          );
          console.log("[GoogleCallback] Kết quả setSession:", { data, error });
          if (error) throw error;
          supabaseToken = data?.session?.access_token;
        }

        if (!supabaseToken) {
          console.warn("[GoogleCallback] Không có access_token trong session.");
          setErrorMessage("Không lấy được Google token. Vui lòng thử lại.");
          setSuccessMessage("");
          return;
        }

        console.log("[GoogleCallback] Có token, gọi backend /auth/google...");
        const result = await withTimeout(
            loginWithGoogle(supabaseToken),
            10000,
            "POST /auth/google"
        );
        console.log("[GoogleCallback] Backend trả về:", result);

        handleLoginSuccess(result);

        window.history.replaceState({}, document.title, "/auth/login");
      } catch (error) {
        console.error("[GoogleCallback] Lỗi:", error);
        const detail = error?.message ? ` (${error.message})` : "";
        setErrorMessage(`Đăng nhập Google thất bại. Vui lòng thử lại.${detail}`);
        setSuccessMessage("");
      } finally {
        setLoading(false);
      }
    };

    handleGoogleCallback();
  }, []);

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
                <Link to="/services">Dịch vụ</Link>
                <Link to="/customer/support">Hỗ trợ</Link>
                <Link to="/terms-of-service">Điều khoản</Link>
              </div>
            </div>
          </section>
        </div>
      </div>
  );
}

export default LoginPage;