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
        if (result){
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
    <div className="login-page login-only-page">
      <div className="login-main">    
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">           
              WashFlow Pro
            </h1>
            <p className="login-subtitle">
              PRECISION AUTOMATION DASHBOARD
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
                Email Address
              </label>
              <div className="username-wrap">
                <span className="username-icon">✉</span>
                <input
                  type="text"
                  className="login-input username-input"
                  placeholder="manager@washflowpro.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label d-block text-start fw-bold">
                Password
              </label>
              <div className="password-wrap">
                <span className="password-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="login-input password-input"
                  placeholder="Nhập password"
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

            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                <input type="checkbox" className="form-check-input me-2" />
                <span>Remember me</span>
              </div>
              <a href="#" className="text-decoration-none fw-semibold">
                Forgot Password?
              </a>
            </div>

            <button type="submit" className="login-btn">
              🚀 Sign In
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
                style={{width: "40px", height: "40px", marginRight: "8px"}}
              />
              Đăng nhập với Google
            </button>
          </form>

          <div className="text-center mt-4">          
            <span>Chưa có tài khoản? </span>
            <Link to="/register" className="fw-bold text-decoration-none">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>  
    </div>
  );
}

export default Login;