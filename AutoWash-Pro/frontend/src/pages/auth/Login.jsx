import "./Login.css";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, saveAuth } from "../../api/authService";
import { signInWithPopup, getRedirectResult } from "firebase/auth";
import { auth, googleProvider } from "../../firebase/firebaseConfig";

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  function redirectByRole(role) {
    console.log("ROLE =", role);

    const normalizedRole = role?.toLowerCase();

    if (normalizedRole === "admin") {
      console.log("GO ADMIN");
      navigate("/admin");
    } else if (normalizedRole === "employee") {
      console.log("GO EMPLOYEE");
      navigate("/employee");
    } else {
      console.log("GO BOOKING");
      navigate("/booking");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = await login(username, password);
      if (data.status === 200 || data.data) {
        saveAuth(data.data);
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        redirectByRole(data.data.role);
      } else {
        setErrorMessage(data.message);
      }
    } catch {
      setErrorMessage("Đăng nhập thất bại. Kiểm tra lại username/password.");
    }
  }

  async function handleGoogleLogin() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleToken = await result.user.getIdToken();
      saveAuth({
        accessToken: googleToken,
        username: result.user.email,
        role: "customer",
      });
      if (onLoginSuccess) {
        onLoginSuccess();
      }
      redirectByRole("customer");
    } catch (error) {
      console.log("Google login error:", error);
      alert("Đăng nhập Google thất bại!");
    }
  }

  useEffect(() => {
    console.log("Login page loaded, checking Google redirect...");
    async function checkGoogleRedirect() {
      try {
        const result = await getRedirectResult(auth);
        console.log("Redirect result:", result);
        if (result) {
          console.log("Google user:", result.user);
          alert("Đăng nhập Google thành công: " + result.user.email);
        }
      } catch (error) {
        console.log("Google redirect error:", error);
      }
    }
    checkGoogleRedirect();
  }, []);

  return (
    <div className="login-layout">
      <main className="login-page">
        <div className="login-card">
          <div className="login-header">
            <div className="brand-row">
              <div className="login-logo">💧</div>
              <h1 className="login-title">WashFlow Pro</h1>
            </div>
            <p className="login-subtitle">Precision Automation Dashboard</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>

              <div className="input-row">
                <span className="input-icon">✉</span>
                <input
                  type="text"
                  className="login-input"
                  placeholder="manager@washflow.pro"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>

              <div className="input-row">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="login-input"
                  placeholder="••••••••"
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

            <div className="login-options">
              <label className="remember-row">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <a href="#" className="forgot-link">
                Forgot password?
              </a>
            </div>

            <button type="submit" className="login-btn">
              <span>Sign In</span>
              <span>→</span>
            </button>

            <div className="login-divider">
              <div className="divider-line"></div>
              <span className="divider-text">OR CONTINUE WITH</span>
              <div className="divider-line"></div>
            </div>

            <button
              type="button"
              className="google-btn"
              onClick={handleGoogleLogin}
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="google-logo"                
              />              
              <span>Continue with Google</span>
            </button>
          </form>

          <div className="login-footer-link">
            <span>Don't have an account? </span>
            <Link to="/register">Create an account</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;