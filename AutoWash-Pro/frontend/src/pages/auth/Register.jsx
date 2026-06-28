import "./Register.css";
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
    <div className="register-layout">
      <main className="register-page">
        <div className="register-card">
          <div className="register-header">
            <div className="brand-row">
              <div className="register-logo">💧</div>
              <h1 className="register-title">WashFlow Pro</h1>
            </div>

            <p className="register-subtitle">Create your account</p>
          </div>

          {errorMessage && (
            <div className="register-error">
              {errorMessage}
            </div>
          )}

          <form className="register-form" onSubmit={handleSubmit}>
            <div className="register-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-row">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    className="register-input"
                    placeholder="Nhập họ tên"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="input-row">
                  <span className="input-icon">✉</span>
                  <input
                    type="email"
                    className="register-input"
                    placeholder="Nhập email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Username</label>
                <div className="input-row">
                  <span className="input-icon">@</span>
                  <input
                    type="text"
                    className="register-input"
                    placeholder="Nhập username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div className="input-row">
                  <span className="input-icon">☎</span>
                  <input
                    type="tel"
                    className="register-input"
                    placeholder="Nhập phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">OTP Code</label>
                <div className="input-row">
                  <span className="input-icon">#</span>
                  <input
                    type="text"
                    className="register-input"
                    placeholder="Nhập mã OTP"
                    value={otp}
                    disabled={!otpSent || otpVerified}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group otp-group">
                <label className="form-label invisible-label">OTP Action</label>
                <button
                  type="button"
                  className="otp-btn"
                  onClick={otpSent ? handleVerifyOtp : handleSendOtp}
                  disabled={otpVerified}
                >
                  {otpVerified ? "Đã xác minh" : otpSent ? "Xác minh OTP" : "Gửi OTP"}
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-row">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="register-input"
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

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-row">
                  <span className="input-icon">🔐</span>
                  <input
                    type="password"
                    className="register-input"
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="register-btn">
              <span>Đăng ký</span>
              <span>→</span>
            </button>

            <div className="register-footer">
              <span>Đã có tài khoản? </span>
              <Link to="/">Đăng nhập</Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Register;