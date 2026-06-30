import "./ForgotPasswordPage.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  requestForgotPassword,
  resetForgotPassword,
  logout,
} from "../../../api/authService";

function ForgotPassword() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  async function handleSendOtp() {
    if (!phone.trim()) {
      setErrorMessage("Vui lòng nhập số điện thoại.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");

    try {
      const data = await requestForgotPassword(phone.trim());

      setOtpSent(true);
      setSuccessMessage(data.message || "Mã OTP phục hồi đã được gửi.");
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error.response?.data?.message || "Gửi OTP thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();

    if (!otpSent) {
      setErrorMessage("Vui lòng gửi mã OTP trước.");
      return;
    }

    if (!phone.trim() || !otp.trim() || !newPassword || !confirmPassword) {
      setErrorMessage("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setErrorMessage("Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const data = await resetForgotPassword(
        phone.trim(),
        otp.trim(),
        newPassword
      );

      setSuccessMessage(data.message || "Đặt lại mật khẩu thành công.");

      setTimeout(() => {
        logout();
        navigate("/login");
      }, 1200);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error.response?.data?.message ||
          "Đặt lại mật khẩu thất bại. Kiểm tra lại OTP."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="forgot-layout">
      <main className="forgot-page">
        <div className="forgot-card">
          <div className="forgot-header">
            <div className="brand-row">
              <div className="forgot-logo">💧</div>
              <h1 className="forgot-title">WashFlow Pro</h1>
            </div>

            <p className="forgot-subtitle">Reset your password</p>
          </div>

          {errorMessage && (
            <div className="forgot-error">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="forgot-success">
              {successMessage}
            </div>
          )}

          <form className="forgot-form" onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>

              <div className="input-row">
                <span className="input-icon">☎</span>
                <input
                  type="tel"
                  className="forgot-input"
                  placeholder="Nhập số điện thoại"
                  value={phone}
                  disabled={loading}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              className="otp-send-btn"
              disabled={loading}
              onClick={handleSendOtp}
            >
              {loading ? "Đang xử lý..." : otpSent ? "Gửi lại OTP" : "Gửi OTP"}
            </button>

            <div className="form-group">
              <label className="form-label">OTP Code</label>

              <div className="input-row">
                <span className="input-icon">#</span>
                <input
                  type="text"
                  className="forgot-input"
                  placeholder="Nhập mã OTP"
                  value={otp}
                  disabled={!otpSent || loading}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>

              <div className="input-row">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  className="forgot-input"
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  disabled={!otpSent || loading}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>

              <div className="input-row">
                <span className="input-icon">🔐</span>
                <input
                  type="password"
                  className="forgot-input"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  disabled={!otpSent || loading}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="forgot-btn"
              disabled={!otpSent || loading}
            >
              <span>{loading ? "Đang đặt lại..." : "Reset Password"}</span>
              <span>→</span>
            </button>
          </form>

          <div className="forgot-footer">
            <Link to="/login">← Back to Login</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ForgotPassword;