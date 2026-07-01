import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register, sendOtp, verifyOtp } from "../../../api/authService";
import OtpInput from "../../../components/common/OtpInput";
import "./RegisterPage.css";

function RegisterPage() {
  const navigate = useNavigate();

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

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingVerifyOtp, setLoadingVerifyOtp] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "email") {
      setOtpSent(false);
      setOtpVerified(false);
    }

    if (name === "otp") {
      setOtpVerified(false);
    }
  };

  const handleSendOtp = async () => {
    if (!formData.email.trim()) {
      setErrorMessage("Vui lòng nhập địa chỉ email trước khi gửi OTP.");
      return;
    }

    try {
      setLoadingOtp(true);
      setErrorMessage("");
      setSuccessMessage("");

      await sendOtp(formData.email);

      setOtpSent(true);
      setSuccessMessage("Mã OTP đã được gửi đến email của bạn.");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Gửi OTP thất bại. Vui lòng thử lại.";

      setErrorMessage(message);
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!formData.email.trim()) {
      setErrorMessage("Vui lòng nhập địa chỉ email.");
      return;
    }

    if (!formData.otp.trim()) {
      setErrorMessage("Vui lòng nhập mã OTP.");
      return;
    }

    try {
      setLoadingVerifyOtp(true);
      setErrorMessage("");
      setSuccessMessage("");

      await verifyOtp(formData.email, formData.otp);

      setOtpVerified(true);
      setSuccessMessage("Xác thực OTP thành công.");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Mã OTP không đúng hoặc đã hết hạn.";

      setOtpVerified(false);
      setErrorMessage(message);
    } finally {
      setLoadingVerifyOtp(false);
    }
  };

  const handleSubmit = async (event) => {
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

    if (!otpVerified) {
      setErrorMessage("Vui lòng xác thực OTP trước khi đăng ký.");
      return;
    }

    if (!formData.password.trim()) {
      setErrorMessage("Vui lòng nhập mật khẩu.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setLoadingRegister(true);
      setErrorMessage("");
      setSuccessMessage("");

      await register(
        formData.username,
        formData.password,
        formData.email,
        formData.fullName,
        formData.phone
      );

      alert("Đăng ký thành công. Vui lòng đăng nhập.");
      navigate("/auth/login");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.";

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
            <div className="register-logo">♢</div>
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
              <div className="register-form-logo-box">♢</div>
              <h1>WashFlow Pro</h1>
              <p>Trải nghiệm dịch vụ rửa xe thông minh</p>
            </div>

            <div className="register-card">
              <div className="register-card-header">
                <h2>Đăng ký tài khoản</h2>
                <p>Điền thông tin và xác thực OTP để bắt đầu.</p>
              </div>

              <form className="register-form" onSubmit={handleSubmit}>
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

                  <div className="register-otp-row">
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

                    <button
                      className="otp-send-button"
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loadingOtp || otpVerified}
                    >
                      {loadingOtp ? "Đang gửi..." : otpSent ? "Gửi lại" : "Gửi OTP"}
                    </button>
                  </div>
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

                <div className="form-group">
                  <label className="form-label" htmlFor="otp">
                    Mã OTP
                  </label>

                  <div className="register-otp-row">
                    <OtpInput
                      value={formData.otp}
                      onChange={(val) => handleChange({ target: { name: "otp", value: val } })}
                      disabled={otpVerified}
                      placeholder="Nhập mã OTP"
                      className="register-input"
                    />

                    <button
                      className={
                        otpVerified
                          ? "otp-verify-button verified"
                          : "otp-verify-button"
                      }
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={loadingVerifyOtp || otpVerified}
                    >
                      {otpVerified
                        ? "Đã xác thực"
                        : loadingVerifyOtp
                          ? "Đang xác thực..."
                          : "Xác thực"}
                    </button>
                  </div>
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
                        placeholder="Nhập mật khẩu"
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
                  <input type="checkbox" />
                  <span>
                    Tôi đồng ý với <strong>Điều khoản dịch vụ</strong> và{" "}
                    <strong>Chính sách bảo mật</strong> của WashFlow Pro.
                  </span>
                </label>

                <button
                  className="register-submit-button"
                  type="submit"
                  disabled={loadingRegister}
                >
                  {loadingRegister ? "Đang đăng ký..." : "Đăng ký ngay"}
                </button>
              </form>

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