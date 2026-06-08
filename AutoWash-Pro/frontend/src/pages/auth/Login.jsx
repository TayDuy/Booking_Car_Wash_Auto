import { useState } from "react";
import { Link } from "react-router-dom";
import { login, saveAuth } from "../../api/authService";

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const data = await login(username, password);

      if (data.status === 200 || data.data) {
        saveAuth(data.data);
        onLoginSuccess();
      } else {
        setErrorMessage(data.message);
      }
    } catch {
      setErrorMessage(
        "Đăng nhập thất bại. Kiểm tra lại username/password."
      );
    }
  }

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#00c6ff,#0072ff,#6a11cb)",
        }}
    >
      <div
        className="card shadow-lg"
        style={{
          width: "800px",
          maxWidth: "92%",
          borderRadius: "25px",
          background: "rgba(255,255,255,0.97)",
          border: "none",
        }}
      >
        <div className="card-body p-5">

          <div className="text-center mb-4">
            <div
              style={{
                fontSize: "90px",
                filter: "drop-shadow(0 5px 10px rgba(0,0,0,0.2))"
              }}
            >
              🚗
            </div>

            <h1
              style={{
                fontWeight: "700",
                color: "#2a5298",
              }}
            >
              AutoWash Pro
            </h1>

            <p className="text-muted">
              Smart Automated Car Wash Management System
            </p>

            <p
              style={{
                color: "#6c757d",
                fontSize: "14px"
              }}
            >
              Manage bookings, customers and services easily.
            </p>
          </div>

          {errorMessage && (
            <div className="alert alert-danger">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label d-block text-start fw-bold">
                Username
              </label>

              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="Nhập username"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
              />
            </div>

            <div className="mb-3">
              <label className="form-label d-block text-start fw-bold">
                Password
              </label>

              <div className="input-group">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  className="form-control form-control-lg"
                  placeholder="Nhập password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                <input
                  type="checkbox"
                  className="form-check-input me-2"
                />
                <span>Remember me</span>
              </div>

              <a
                href="#"
                className="text-decoration-none fw-semibold"
              >
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className="btn w-100 py-3 mt-3"
              style={{
                background:
                  "linear-gradient(90deg,#00c6ff,#0072ff)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontWeight: "bold",
                fontSize: "18px",
                boxShadow:
                  "0 4px 15px rgba(0,114,255,0.4)"
              }}
            >
              🚀 Login
            </button>
          </form>

          <div className="text-center mt-4">
            <hr />

              <p
                className="text-center text-muted mb-0"
                style={{ fontSize: "13px" }}
              >
                © 2026 AutoWash Pro Team
              </p>
            <span>Chưa có tài khoản? </span>

            <Link
              to="/register"
              className="fw-bold text-decoration-none"
            >
              Đăng ký ngay
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;