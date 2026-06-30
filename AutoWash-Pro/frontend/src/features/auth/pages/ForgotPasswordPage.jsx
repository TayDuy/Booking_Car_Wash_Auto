import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendOtp, verifyOtp } from "../../../api/authService";
import "./ForgotPasswordPage.css";

function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    phone: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingVerifyOtp, setLoadingVerifyOtp] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "phone") {
      setOtpSent(false);
      setOtpVerified(false);
      setSuccessMessage("");
    }

    if (name === "otp") {
      setOtpVerified(false);
      setSuccessMessage("");
    }
  };

  const handleSendOtp = async () => {
    if (!formData.phone.trim()) {
      setErrorMessage("Vui lòng nhập số điện thoại.");
      setSuccessMessage("");
      return;
    }

    try {
      setLoadingOtp(true);
      setErrorMessage("");
      setSuccessMessage("");

      await sendOtp(formData.phone.trim());

      setOtpSent(true);
      setSuccessMessage("Mã OTP đã được gửi đến số điện thoại của bạn.");
    } catch (error) {
      console.error("Send OTP error:", error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Gửi OTP thất bại. Vui lòng thử lại.";

      setErrorMessage(message);
      setSuccessMessage("");
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!formData.phone.trim()) {
      setErrorMessage("Vui lòng nhập số điện thoại.");
      setSuccessMessage("");
      return;
    }

    if (!formData.otp.trim()) {
      setErrorMessage("Vui lòng nhập mã OTP.");
      setSuccessMessage("");
      return;
    }

    try {
      setLoadingVerifyOtp(true);
      setErrorMessage("");
      setSuccessMessage("");

      await verifyOtp(formData.phone.trim(), formData.otp.trim());

      setOtpVerified(true);
      setSuccessMessage("Xác thực OTP thành công. Bạn có thể đặt mật khẩu mới.");
    } catch (error) {
      console.error("Verify OTP error:", error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Mã OTP không đúng hoặc đã hết hạn.";

      setOtpVerified(false);
      setErrorMessage(message);
      setSuccessMessage("");
    } finally {
      setLoadingVerifyOtp(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (!formData.phone.trim()) {
      setErrorMessage("Vui lòng nhập số điện thoại.");
      setSuccessMessage("");
      return;
    }

    if (!otpVerified) {
      setErrorMessage("Vui lòng xác thực OTP trước khi đổi mật khẩu.");
      setSuccessMessage("");
      return;
    }

    if (!formData.newPassword.trim()) {
      setErrorMessage("Vui lòng nhập mật khẩu mới.");
      setSuccessMessage("");
      return;
    }

    if (formData.newPassword.length < 8) {
      setErrorMessage("Mật khẩu mới phải có ít nhất 8 ký tự.");
      setSuccessMessage("");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      setSuccessMessage("");
      return;
    }

    try {
      setLoadingReset(true);
      setErrorMessage("");
      setSuccessMessage("");

      /*
        BE hiện chưa có API reset-password.
        Sau này khi BE có endpoint, mình sẽ thay đoạn này bằng:

        await resetPassword(
          formData.phone.trim(),
          formData.otp.trim(),
          formData.newPassword
        );
      */

      setSuccessMessage(
        "UI đã sẵn sàng. Backend cần thêm API reset-password để đổi mật khẩu thật."
      );
    } catch (error) {
      console.error("Reset password error:", error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Đổi mật khẩu thất bại. Vui lòng thử lại.";

      setErrorMessage(message);
      setSuccessMessage("");
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-container">
        <section className="forgot-left">
          <div className="forgot-brand">
            <div className="forgot-logo">♢</div>
            <span>WashFlow Pro</span>
          </div>

          <div className="forgot-hero-content">
            <span className="forgot-badge">Khôi phục tài khoản</span>

            <h1>
              Quên mật khẩu?
              <br />
              Đừng lo, chúng tôi hỗ trợ bạn
            </h1>

            <p>
              Xác minh số điện thoại bằng OTP để bảo vệ tài khoản và đặt lại mật
              khẩu mới một cách an toàn.
            </p>

            <div className="forgot-stats">
              <div>
                <strong>OTP</strong>
                <span>Xác thực nhanh</span>
              </div>

              <div>
                <strong>Bảo mật</strong>
                <span>Giữ an toàn tài khoản</span>
              </div>

              <div>
                <strong>24/7</strong>
                <span>Hỗ trợ online</span>
              </div>
            </div>
          </div>
        </section>

        <section className="forgot-right">
          <div className="forgot-form-wrapper">
            <div className="forgot-form-logo">
              <div className="forgot-form-logo-box">♢</div>
              <h1>WashFlow Pro</h1>
              <p>Đặt lại mật khẩu tài khoản của bạn</p>
            </div>

            <div className="forgot-card">
              <div className="forgot-card-header">
                <h2>Quên mật khẩu</h2>
                <p>Nhập số điện thoại, xác thực OTP và tạo mật khẩu mới.</p>
              </div>

              <form className="forgot-form" onSubmit={handleResetPassword}>
                {errorMessage && (
                  <div className="forgot-message error">{errorMessage}</div>
                )}

                {successMessage && (
                  <div className="forgot-message success">
                    {successMessage}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="phone">
                    Số điện thoại
                  </label>

                  <div className="forgot-otp-row">
                    <input
                      id="phone"
                      name="phone"
                      className="forgot-input"
                      type="tel"
                      placeholder="0901234567"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={handleChange}
                    />

                    <button
                      className="forgot-otp-button"
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loadingOtp}
                    >
                      {loadingOtp ? "Đang gửi..." : otpSent ? "Gửi lại" : "Gửi OTP"}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="otp">
                    Mã OTP
                  </label>

                  <div className="forgot-otp-row">
                    <input
                      id="otp"
                      name="otp"
                      className="forgot-input"
                      type="text"
                      placeholder="Nhập mã OTP"
                      value={formData.otp}
                      onChange={handleChange}
                    />

                    <button
                      className={
                        otpVerified
                          ? "forgot-verify-button verified"
                          : "forgot-verify-button"
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

                <div className="form-group">
                  <label className="form-label" htmlFor="newPassword">
                    Mật khẩu mới
                  </label>

                  <div className="forgot-password-wrap">
                    <input
                      id="newPassword"
                      name="newPassword"
                      className="forgot-input password-padding"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu mới"
                      autoComplete="new-password"
                      value={formData.newPassword}
                      onChange={handleChange}
                    />

                    <button
                      className="forgot-eye-btn"
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                    >
                      {showNewPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">
                    Xác nhận mật khẩu mới
                  </label>

                  <div className="forgot-password-wrap">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      className="forgot-input password-padding"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu mới"
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />

                    <button
                      className="forgot-eye-btn"
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>

                <button
                  className="forgot-submit-button"
                  type="submit"
                  disabled={loadingReset}
                >
                  {loadingReset ? "Đang xử lý..." : "Đổi mật khẩu"}
                </button>
              </form>

              <p className="forgot-login-text">
                Nhớ mật khẩu rồi? <Link to="/auth/login">Quay lại đăng nhập</Link>
              </p>
            </div>

            <div className="forgot-footer-links">
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

export default ForgotPasswordPage;