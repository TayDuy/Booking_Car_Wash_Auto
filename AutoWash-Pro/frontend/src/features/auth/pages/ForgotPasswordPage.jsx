import "./ForgotPasswordPage.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  requestForgotPassword,
  resetForgotPassword,
  logout,
} from "../../../api/authService";
import OtpInput from "../../../components/common/OtpInput";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  async function handleSendOtp() {
    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập địa chỉ email.");
      return;
    }

    setLoadingOtp(true);
    setErrorMessage("");
    setSuccessMessage("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");

    try {
      const data = await requestForgotPassword(email.trim());

      setOtpSent(true);
      setSuccessMessage(data.message || "Mã OTP phục hồi đã được gửi đến email của bạn.");
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error.response?.data?.message || "Gửi OTP thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoadingOtp(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();

    if (!otpSent) {
      setErrorMessage("Vui lòng gửi mã OTP trước.");
      return;
    }

    if (!email.trim() || !otp.trim() || !newPassword || !confirmPassword) {
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
        email.trim(),
        otp.trim(),
        newPassword
      );

      setSuccessMessage(data.message || "Đặt lại mật khẩu thành công.");

      setTimeout(() => {
        logout();
        navigate("/auth/login");
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

            <p className="forgot-subtitle">Cập Nhật Mật Khẩu</p>
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
              <label className="form-label">Email</label>

              <div className="input-row">
                <span className="input-icon">✉</span>
                <input
                  type="email"
                  className="forgot-input"
                  placeholder="Nhập địa chỉ email"
                  value={email}
                  disabled={loading || loadingOtp}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              className="otp-send-btn"
              disabled={loading || loadingOtp}
              onClick={handleSendOtp}
            >
              {loadingOtp ? "Đang xử lý..." : otpSent ? "Gửi lại OTP" : "Gửi OTP"}
            </button>

            <div className="form-group">
              <label className="form-label">Mã OTP</label>

              <div className="input-row">
                <span className="input-icon">#</span>
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  disabled={!otpSent || loading || loadingOtp}
                  placeholder="Nhập mã OTP"
                  className="forgot-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mật Khẩu Mới</label>

              <div className="input-row">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  className="forgot-input"
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  disabled={!otpSent || loading || loadingOtp}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nhập Lại Mật Khẩu</label>

              <div className="input-row">
                <span className="input-icon">🔐</span>
                <input
                  type="password"
                  className="forgot-input"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  disabled={!otpSent || loading || loadingOtp}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="forgot-btn"
              disabled={!otpSent || loading || loadingOtp}
            >
              <span>{loading ? "Đang đặt lại..." : "Cập nhật Mật Khẩu"}</span>
              <span>→</span>
            </button>
          </form>

          <div className="forgot-footer">
            <Link to="/auth/login">← Quay về trang Đăng Nhập</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ForgotPassword;