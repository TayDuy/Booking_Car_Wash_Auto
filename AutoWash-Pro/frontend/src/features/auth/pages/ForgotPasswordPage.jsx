import "./ForgotPasswordPage.css";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  requestForgotPassword,
  resetForgotPassword,
  logout,
  verifyOtp,
} from "../../../api/authService";
import OtpInput from "../../../components/common/OtpInput";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingVerifyOtp, setLoadingVerifyOtp] = useState(false);
  const [timer, setTimer] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  async function handleSendOtp() {
    if (timer > 0) return;
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
      setTimer(60);
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

  async function handleVerifyOtp() {
    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập địa chỉ email.");
      return;
    }
    if (!otp.trim()) {
      setErrorMessage("Vui lòng nhập mã OTP.");
      return;
    }

    setLoadingVerifyOtp(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await verifyOtp(email.trim(), otp.trim(), "PASSWORD_RESET");
      setOtpVerified(true);
      setSuccessMessage("Xác thực OTP thành công. Vui lòng đặt mật khẩu mới.");
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn."
      );
    } finally {
      setLoadingVerifyOtp(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();

    if (!otpVerified) {
      setErrorMessage("Vui lòng xác thực OTP trước.");
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

    const hasLowercase = /[a-z]/.test(newPassword);
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasDigit = /\d/.test(newPassword);
    if (!hasLowercase || !hasUppercase || !hasDigit) {
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
              <div className="forgot-logo">
                <img src="/logo.png" alt="Logo" style={{ width: "80%", height: "auto", filter: "brightness(0) invert(1)" }} />
              </div>
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
            {!otpVerified ? (
              <>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div className="input-row">
                    <span className="input-icon">✉</span>
                    <input
                      type="email"
                      className="forgot-input"
                      placeholder="Nhập địa chỉ email"
                      value={email}
                      disabled={loadingOtp || otpSent}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="otp-send-btn"
                  disabled={loadingOtp || timer > 0}
                  onClick={handleSendOtp}
                  style={{ marginBottom: "16px" }}
                >
                  {loadingOtp
                    ? "Đang gửi..."
                    : timer > 0
                    ? `Gửi lại sau ${timer}s`
                    : otpSent
                    ? "Gửi lại mã OTP"
                    : "Gửi OTP"}
                </button>

                {otpSent && (
                  <>
                    <div className="form-group" style={{ marginTop: "12px" }}>
                      <label className="form-label">Mã OTP</label>
                      <div className="input-row">
                        <span className="input-icon">#</span>
                        <OtpInput
                          value={otp}
                          onChange={setOtp}
                          disabled={loadingVerifyOtp}
                          placeholder="Nhập mã OTP"
                          className="forgot-input"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="forgot-btn"
                      disabled={loadingVerifyOtp}
                      onClick={handleVerifyOtp}
                      style={{ marginTop: "12px" }}
                    >
                      <span>{loadingVerifyOtp ? "Đang xác thực..." : "Xác thực OTP"}</span>
                      <span>→</span>
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <div style={{
                  backgroundColor: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  color: "#065f46",
                  padding: "12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  marginBottom: "20px",
                  textAlign: "center"
                }}>
                  ✓ Email xác thực thành công: <strong>{email}</strong>
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
                      disabled={loading}
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
                      disabled={loading}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="forgot-btn"
                  disabled={loading}
                  style={{ marginTop: "12px" }}
                >
                  <span>{loading ? "Đang đặt lại..." : "Cập nhật Mật Khẩu"}</span>
                  <span>→</span>
                </button>
              </>
            )}
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