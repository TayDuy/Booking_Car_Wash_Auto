import "./Register.css";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  register,
  sendOtp,
  verifyOtp,
  loginWithGoogle,
  saveAuth,
} from "../../api/authService";
import { supabase } from "../../api/supabaseClient";

function Register() {
  const navigate = useNavigate();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  function redirectByRole(role) {
    const normalizedRole = role?.toLowerCase();

    if (normalizedRole === "admin") {
      navigate("/admin");
    } else if (normalizedRole === "employee") {
      navigate("/employee");
    } else {
      navigate("/");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!fullName || !email || !username || !phone || !password || !confirmPassword) {
      setErrorMessage("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (!otpVerified) {
      setErrorMessage("Vui lòng xác minh OTP trước khi đăng ký.");
      return;
    }

    setErrorMessage("");

    try {
      const data = await register(username, password, email, fullName, phone);
      alert(data.message || "Đăng ký thành công");
    } catch (error) {
      setErrorMessage("Đăng ký thất bại.");
    }
  }

  async function handleSendOtp() {
    if (!phone) {
      setErrorMessage("Vui lòng nhập số điện thoại trước.");
      return;
    }
    try {
      await sendOtp(phone);
      setOtpSent(true);
      setErrorMessage("")
      alert("Mã OTP đã được gửi.");
    } catch (error) {
      setErrorMessage("Gửi OTP thất bại.");
    }
  }

  async function handleVerifyOtp() {
    if (!otp) {
      setErrorMessage("Vui lòng nhập mã OTP.");
      return;
    }
    try {
      await verifyOtp(phone, otp);
      setOtpVerified(true);
      setErrorMessage("");
      alert("Xác minh OTP thành công.");
    } catch (error) {
      setErrorMessage("OTP không đúng hoặc đã hết hạn.");
    }
  }

  async function handleGoogleRegister() {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/register",
        },
      });
    } catch (error) {
      console.log("Google register error:", error);
      setErrorMessage("Đăng ký bằng Google thất bại.");
    }
  }

  useEffect(() => {
    console.log("Register page loaded, checking Google redirect...");

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          try {
            const supabaseToken = session.access_token;
            const data = await loginWithGoogle(supabaseToken);

            if (data.status === 200 || data.data) {
              saveAuth(data.data);
              redirectByRole(data.data.user.role);
            } else {
              setErrorMessage(
                data.message || "Đăng ký bằng Google thất bại trên Backend."
              );
            }
          } catch (error) {
            console.error("Lỗi khi gửi Google token về Backend:", error);
            setErrorMessage(
              "Đăng ký bằng Google thất bại. Không thể xác thực với máy chủ."
            );
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="register-page">
      <div className="register-shell">
        <main className="register-main">
          <div className="register-card">
            <div className="register-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img src="/logo.png" alt="WashFlow Pro Logo" style={{ height: '80px', width: 'auto', marginBottom: '8px' }} />
              <h2>WashFlow Pro</h2>
              <p>Kiến tạo tương lai vận hành rửa xe thông minh</p>
              <h1>Đăng ký tài khoản</h1>
            </div>

            {errorMessage && (
              <div className="register-error">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="register-form">
              <div className="register-field">
                <label>👤 Họ và tên</label>
                <div className="register-input-wrap">
                  <input
                    type="text"
                    placeholder="Nhập họ và tên của bạn"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div className="register-row">
                <div className="register-field">
                  <label>✉ Địa chỉ Email</label>
                  <div className="register-input-wrap">
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="register-field">
                  <label>👤 Username</label>
                  <div className="register-input-wrap">
                    <input
                      type="text"
                      placeholder="Nhập username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="register-row">
                <div className="register-field">
                  <label>📞 Số điện thoại</label>
                  <div className="register-input-wrap">
                    <input
                      type="tel"
                      placeholder="0123 456 789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="register-field">
                  <label>🔐 Mã OTP</label>
                  <div className="register-otp-wrap">
                    <input
                      type="text"
                      placeholder="Nhập mã OTP"
                      value={otp}
                      disabled={!otpSent || otpVerified}
                      onChange={(e) => setOtp(e.target.value)}
                    />

                    <button
                      type="button"
                      onClick={otpSent ? handleVerifyOtp : handleSendOtp}
                      disabled={otpVerified}
                    >
                      {otpVerified ? "Đã xác minh" : otpSent ? "Xác minh" : "Gửi OTP"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="register-row">
                <div className="register-field">
                  <label>🔒 Mật khẩu</label>
                  <div className="register-input-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="register-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>

                <div className="register-field">
                  <label>🛡 Xác nhận mật khẩu</label>
                  <div className="register-input-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="register-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>
              </div>

              <label className="register-terms">
                <input type="checkbox" />
                <span>
                  Tôi đồng ý với <a href="#">Điều khoản dịch vụ</a> và{" "}
                  <a href="#">Chính sách bảo mật</a> của WashFlow Pro.
                </span>
              </label>

              <button type="submit" className="register-submit-btn">
                Đăng ký ngay <span>→</span>
              </button>

              <div className="register-divider">
                <span></span>
                <p>Hoặc đăng ký bằng</p>
                <span></span>
              </div>

              <button type="button" className="register-google-btn" onClick={handleGoogleRegister}>
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                />
                Đăng ký bằng Google
              </button>

              <p className="register-login-link">
                Đã có tài khoản?{" "}
                <Link to="/login">
                  Đăng nhập
                </Link>
              </p>
            </form>
          </div>
        </main>

        <footer className="register-footer">
          <div className="register-footer-left">
            <span>🛡 © 2024 WashFlow Pro. Tất cả các quyền được bảo lưu.</span>
          </div>

          <div className="register-footer-right">
            <a href="#">Trung tâm hỗ trợ</a>
            <a href="#">Quy định sử dụng</a>
            <button type="button">Ngôn ngữ: Tiếng Việt</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Register;