import "./Login.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import { register, sendOtp, verifyOtp } from "../../api/authService";

function Register() {
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

  return (
    <div className="login-page register-page">
      <div className="login-main">
        <div className="login-card register-card">
          <div className="login-header">
            <h1 className="login-title">
              AutoWash Pro
            </h1>
            <p className="login-subtitle">
              Create Your Account
            </p>
          </div>

          {errorMessage && (
            <div className="alert alert-danger">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="register-grid">
              <div className="mb-3">
                <label className="form-label fw-semibold d-block text-start">
                  Full Name
                </label>
                <input
                  type="text"
                  className="login-input"
                  placeholder="Nhập họ tên"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold d-block text-start">
                  Email
                </label>
                <input
                  type="email"
                  className="login-input"
                  placeholder="Nhập email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold d-block text-start">
                  Username
                </label>
                <input
                  type="text"
                  className="login-input"
                  placeholder="Nhập username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold d-block text-start">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="login-input"
                  placeholder="Nhập phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold d-block text-start">
                  OTP Code
                </label>
                <input
                  type="text"
                  className="login-input"
                  placeholder="Nhập mã OTP"
                  value={otp}
                  disabled={!otpSent || otpVerified}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <button
                  type="button"
                  className="otp-btn"
                  onClick={otpSent ? handleVerifyOtp : handleSendOtp}
                  disabled={otpVerified}
                >
                  {otpVerified ? "Đã xác minh" : otpSent ? "Xác minh OTP" : "Gửi OTP"}
                </button>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold d-block text-start">
                  Password
                </label>
                <div className="password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="login-input password-input"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold d-block text-start">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="login-input"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="login-btn">
              Đăng ký
            </button>

            <div className="register-footer">
              <span className="register-footer-text">
                Đã có tài khoản?
              </span>
              <Link to="/" className="register-footer-link">
                Đăng nhập
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;