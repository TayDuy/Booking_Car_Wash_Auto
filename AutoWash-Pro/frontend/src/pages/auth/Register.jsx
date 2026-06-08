import { useState } from "react";
import { Link } from "react-router-dom";

function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  function handleSubmit(e) {
    e.preventDefault();

    if (
      !fullName ||
      !email ||
      !username ||
      !password
    ) {
      setErrorMessage(
        "Vui lòng nhập đầy đủ thông tin."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        "Mật khẩu xác nhận không khớp."
      );
      return;
    }

    setErrorMessage("");

    alert(
      `Đăng ký thành công cho ${username}`
    );

    // Sau này gọi API Register ở đây
  }

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        minHeight: "100vh",
        background:
            "linear-gradient(135deg,#667eea 0%,#764ba2 50%,#6B73FF 100%)",
      }}
    >
      <div
        className="card shadow-lg"
        style={{
            width: "750px",
            maxWidth: "92%",
            borderRadius: "25px",
            background: "rgba(255,255,255,0.97)",
        }}
      >
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <div style={{ fontSize: "70px" }}>
                🚗
            </div>

            <h1
                className="fw-bold"
                style={{
                    color: "#2a5298",
                }}
            >
                AutoWash Pro
            </h1>

            <p className="text-muted">
              Create Your Account
            </p>
          </div>

          {errorMessage && (
            <div className="alert alert-danger">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold d-block text-start">
                Full Name
              </label>

              <input
                type="text"
                className="form-control py-3"
                placeholder="Nhập họ tên"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold d-block text-start">
                Email
              </label>

              <input
                type="email"
                className="form-control py-3"
                placeholder="Nhập email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold d-block text-start">
                Username
              </label>

              <input
                type="text"
                className="form-control py-3"
                placeholder="Nhập username"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold d-block text-start">
                Password
              </label>

              <div className="input-group">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  className="form-control py-3"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword
                    ? "🙈"
                    : "👁"}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold d-block text-start">
                Confirm Password
              </label>

              <input
                type="password"
                className="form-control py-3"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
              />
            </div>

            <button
              type="submit"
              className="btn btn-success w-100 py-3 fw-bold"
            >
              Đăng ký
            </button>

            <div className="text-center mt-4">
              <span className="text-muted">
                Đã có tài khoản?
              </span>

              <Link
                to="/"
                className="ms-2 fw-bold text-decoration-none"
              >
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