import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register, sendOtp, verifyOtp, saveAuth } from "../../../api/authService";
import OtpInput from "../../../components/common/OtpInput";
import useAuth from "../../../hooks/useAuth";
import "./RegisterPage.css";

function RegisterPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [timer, setTimer] = useState(0);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStep1Submit = async (event) => {
    event.preventDefault();

    if (!formData.fullName.trim()) {
      setErrorMessage("Vui lòng nhập họ và tên.");
      return;
    }
    if (!formData.username.trim()) {
      setErrorMessage("Vui lòng nhập username.");
      return;
    }
    if (!formData.email.trim()) {
      setErrorMessage("Vui lòng nhập email.");
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMessage("Vui lòng nhập số điện thoại.");
      return;
    }
    if (formData.password.length < 8) {
      setErrorMessage("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setErrorMessage("Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (!agreeTerms) {
      setErrorMessage("Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.");
      return;
    }

    try {
      setLoadingOtp(true);
      setErrorMessage("");
      setSuccessMessage("");

      await sendOtp(formData.email);

      setStep(2);
      setTimer(60);
      setSuccessMessage("Mã OTP đã được gửi đến email của bạn.");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Gửi OTP thất bại. Vui lòng kiểm tra lại thông tin.";
      setErrorMessage(message);
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    try {
      setLoadingOtp(true);
      setErrorMessage("");
      setSuccessMessage("");
      await sendOtp(formData.email);
      setTimer(60);
      setSuccessMessage("Mã OTP mới đã được gửi đến email của bạn.");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Gửi OTP thất bại.");
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleStep2Submit = async (event) => {
    event.preventDefault();

    if (!formData.otp.trim()) {
      setErrorMessage("Vui lòng nhập mã OTP.");
      return;
    }

    try {
      setLoadingRegister(true);
      setErrorMessage("");
      setSuccessMessage("");

      // 1. Xác thực OTP
      await verifyOtp(formData.email, formData.otp);

      // 2. Gọi api đăng ký khi OTP đúng
      const result = await register(
        formData.username,
        formData.password,
        formData.email,
        formData.fullName,
        formData.phone
      );

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

      setSuccessMessage("Đăng ký tài khoản thành công! Đang đăng nhập...");
      setTimeout(() => {
        navigate("/customer/home", { replace: true });
      }, 1000);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Xác thực OTP hoặc Đăng ký thất bại. Vui lòng kiểm tra lại.";
      setErrorMessage(message);
    } finally {
      setLoadingRegister(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <section className="register-left">
          <div className="register-brand">
            <div className="register-logo">
              <img src="/logo.png" alt="Logo" style={{ width: "85%", height: "auto" }} />
            </div>
            <span>WashFlow Pro</span>
          </div>

          <div className="register-hero-content">
            <span className="register-badge">Tài khoản khách hàng</span>

            <h1>
              Đăng ký để đặt lịch
              <br />
              nhanh hơn mỗi ngày
            </h1>

            <p>
              Tạo tài khoản để quản lý lịch rửa xe, xác thực OTP an toàn, nhận
              ưu đãi riêng và tích điểm thành viên sau mỗi lần sử dụng dịch vụ.
            </p>

            <div className="register-stats">
              <div>
                <strong>OTP</strong>
                <span>Xác thực an toàn</span>
              </div>

              <div>
                <strong>Ưu đãi</strong>
                <span>Dành riêng hội viên</span>
              </div>

              <div>
                <strong>Điểm</strong>
                <span>Tích lũy sau booking</span>
              </div>
            </div>
          </div>
        </section>

        <section className="register-right">
          <div className="register-form-wrapper">
            <div className="register-form-logo">
              <div className="register-form-logo-box">
                <img src="/logo.png" alt="Logo" style={{ width: "80%", height: "auto", filter: "brightness(0) invert(1)" }} />
              </div>
              <h1>WashFlow Pro</h1>
              <p>Trải nghiệm dịch vụ rửa xe thông minh</p>
            </div>

            <div className="register-card">
              {step === 1 ? (
                <>
                  <div className="register-card-header">
                    <h2>Đăng ký tài khoản</h2>
                    <p>Điền thông tin tài khoản của bạn bên dưới.</p>
                  </div>

                  <form className="register-form" onSubmit={handleStep1Submit}>
                    {errorMessage && (
                      <div className="register-message error">{errorMessage}</div>
                    )}

                    {successMessage && (
                      <div className="register-message success">
                        {successMessage}
                      </div>
                    )}

                    <div className="register-grid">
                      <div className="form-group">
                        <label className="form-label" htmlFor="fullName">
                          Họ và tên
                        </label>

                        <input
                          id="fullName"
                          name="fullName"
                          className="register-input"
                          type="text"
                          placeholder="Nguyễn Văn A"
                          autoComplete="name"
                          value={formData.fullName}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="username">
                          Username
                        </label>

                        <input
                          id="username"
                          name="username"
                          className="register-input"
                          type="text"
                          placeholder="vanna_washflow"
                          autoComplete="username"
                          value={formData.username}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="email">
                        Email
                      </label>

                      <input
                        id="email"
                        name="email"
                        className="register-input"
                        type="email"
                        placeholder="example@gmail.com"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="phone">
                        Số điện thoại
                      </label>

                      <input
                        id="phone"
                        name="phone"
                        className="register-input"
                        type="tel"
                        placeholder="0901234567"
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="register-grid">
                      <div className="form-group">
                        <label className="form-label" htmlFor="password">
                          Mật khẩu
                        </label>

                        <div className="register-password-wrap">
                          <input
                            id="password"
                            name="password"
                            className="register-input password-padding"
                            type={showPassword ? "text" : "password"}
                            placeholder="Mật khẩu"
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={handleChange}
                          />

                          <button
                            className="register-eye-btn"
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                          >
                            {showPassword ? "🙈" : "👁"}
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="confirmPassword">
                          Xác nhận mật khẩu
                        </label>

                        <div className="register-password-wrap">
                          <input
                            id="confirmPassword"
                            name="confirmPassword"
                            className="register-input password-padding"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Nhập lại mật khẩu"
                            autoComplete="new-password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                          />

                          <button
                            className="register-eye-btn"
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword((prev) => !prev)
                            }
                          >
                            {showConfirmPassword ? "🙈" : "👁"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <label className="register-policy">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                      />
                      <span>
                        Tôi đồng ý với <strong>Điều khoản dịch vụ</strong> và{" "}
                        <strong>Chính sách bảo mật</strong> của WashFlow Pro.
                      </span>
                    </label>

                    <button
                      className="register-submit-button"
                      type="submit"
                      disabled={loadingOtp}
                    >
                      {loadingOtp ? "Đang gửi OTP..." : "Tiếp tục & Nhận mã OTP"}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="register-card-header">
                    <h2>Xác thực tài khoản</h2>
                    <p style={{ fontSize: "12.5px", color: "#64748b", marginTop: "4px" }}>
                      Mã xác minh gồm 6 chữ số đã gửi đến email: <br />
                      <strong style={{ color: "#0046c7" }}>{formData.email}</strong>
                    </p>
                  </div>

                  <form className="register-form" onSubmit={handleStep2Submit}>
                    {errorMessage && (
                      <div className="register-message error">{errorMessage}</div>
                    )}

                    {successMessage && (
                      <div className="register-message success">
                        {successMessage}
                      </div>
                    )}

                    <div className="form-group" style={{ marginBottom: "12px" }}>
                      <label className="form-label" htmlFor="otp" style={{ textAlign: "center", display: "block", marginBottom: "8px", fontWeight: "600" }}>
                        Nhập mã OTP
                      </label>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <OtpInput
                          value={formData.otp}
                          onChange={(val) => handleChange({ target: { name: "otp", value: val } })}
                          placeholder="------"
                          className="register-input"
                        />
                      </div>
                    </div>

                    <div style={{ textAlign: "center", marginBottom: "12px", fontSize: "13px" }}>
                      {timer > 0 ? (
                        <span style={{ color: "#64748b" }}>
                          Gửi lại mã sau <strong style={{ color: "#0046c7" }}>{timer}s</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={loadingOtp}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#0046c7",
                            fontWeight: "700",
                            cursor: "pointer",
                            textDecoration: "underline",
                            padding: 0
                          }}
                        >
                          {loadingOtp ? "Đang gửi lại..." : "Gửi lại mã OTP"}
                        </button>
                      )}
                    </div>

                    <button
                      className="register-submit-button"
                      type="submit"
                      disabled={loadingRegister}
                      style={{ marginBottom: "8px" }}
                    >
                      {loadingRegister ? "Đang xử lý..." : "Xác minh & Hoàn tất"}
                    </button>

                    <button
                      type="button"
                      className="register-google-button"
                      onClick={() => {
                        setStep(1);
                        setErrorMessage("");
                        setSuccessMessage("");
                      }}
                      style={{
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        color: "#64748b",
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        fontWeight: "600",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      Quay lại chỉnh sửa thông tin
                    </button>
                  </form>
                </>
              )}

              <div className="register-divider">
                <span>Hoặc tiếp tục với</span>
              </div>

              <button className="register-google-button" type="button">
                <span>🌐</span>
                Đăng ký bằng Google
              </button>

              <p className="register-login-text">
                Đã có tài khoản? <Link to="/auth/login">Đăng nhập</Link>
              </p>
            </div>

            <div className="register-footer-links">
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

export default RegisterPage;