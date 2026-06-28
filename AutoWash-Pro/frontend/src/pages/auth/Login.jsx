import "./Login.css";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, saveAuth, loginWithGoogle, isLoggedIn, getRole } from "../../api/authService";
import { supabase } from "../../api/supabaseClient";

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function redirectByRole(role) {
    console.log("ROLE =", role);

    const normalizedRole = role?.toLowerCase();

    if (normalizedRole === "admin") {
      navigate("/admin/catalog");
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
    if (loading) return;
    setErrorMessage("");
    setLoading(true);
    try {
      const data = await login(username, password);
      console.log("LOGIN RESPONSE:", JSON.stringify(data));
      if (data.status === 200 || data.data) {
        saveAuth(data.data);
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        redirectByRole(data.data.user.role);
      } else {
        setErrorMessage(data.message || "Đăng nhập thất bại. Kiểm tra lại username/password.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Đăng nhập thất bại. Kiểm tra lại username/password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      sessionStorage.setItem("isGoogleLoginClick", "true");
      await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/login'
        }
      });
    } catch (error) {
      console.log("Google login error:", error);
      alert("Đăng nhập Google thất bại!");
    }
  }

  useEffect(() => {
    if (isLoggedIn()) {
      redirectByRole(getRole());
      return;
    }

    console.log("Login page loaded, checking Google redirect...");
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        if (isLoggedIn()) return;

        const isGoogleClick = sessionStorage.getItem("isGoogleLoginClick") === "true";
        const hasAuthParams = window.location.hash.includes("access_token=") || window.location.search.includes("code=");

        if (!isGoogleClick && !hasAuthParams) {
          console.log("Stale Supabase session detected, signing out...");
          await supabase.auth.signOut();
          return;
        }

        sessionStorage.removeItem("isGoogleLoginClick");
        setLoading(true);
        setErrorMessage("");

        try {
          const supabaseToken = session.access_token;
          const data = await loginWithGoogle(supabaseToken);
          
          if (data.status === 200 || data.data) {
            saveAuth(data.data);
            if (onLoginSuccess) onLoginSuccess();
            redirectByRole(data.data.user.role);
          } else {
            setErrorMessage(data.message || "Đăng nhập bằng Google thất bại trên Backend.");
          }
        } catch (error) {
          console.error("Lỗi khi gửi token về Backend:", error);
          setErrorMessage("Đăng nhập thất bại. Không thể xác thực với máy chủ.");
        } finally {
          setLoading(false);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="login-page">
      <main className="login-main">
        <div className="login-card">
          <div className="login-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src="/logo.png" alt="WashFlow Pro Logo" style={{ height: '80px', width: 'auto', marginBottom: '8px' }} />
            <h1>WashFlow Pro</h1>
            <p>Precision Automation Dashboard</p>
          </div>

          {errorMessage && (
            <div className="login-error">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">✉</span>
                <input
                  type="text"
                  placeholder="manager@washflow.pro"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
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
              <label className="remember-box">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <button type="button" className="forgot-btn">
                Forgot password?
              </button>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "⌛ Đang đăng nhập..." : "🚀 Sign In"}
            </button>
          </form>

          <div className="divider">
            <span></span>
            <p>OR CONTINUE WITH</p>
            <span></span>
          </div>

          <div className="social-login">
            <button
              type="button"
              onClick={handleGoogleLogin}
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
              />
              Google
            </button>

            <button type="button">
              <span>▦</span>
              Apple
            </button>
          </div>

          <p className="register-link">
            Don&apos;t have an account?{" "}
            <Link to="/register">
              Create an account
            </Link>
          </p>
        </div>
      </main>

      <footer className="login-footer">
        <div className="footer-brand">
          <h3>WashFlow Pro</h3>
          <p>© 2024 WashFlow Pro Automation.</p>
          <p>All rights reserved.</p>
        </div>

        <div className="footer-column">
          <h4>Company</h4>
          <button type="button">Contact Us</button>
          <button type="button">Privacy Policy</button>
        </div>

        <div className="footer-column">
          <h4>Legal</h4>
          <button type="button">Terms of Service</button>
          <button type="button">Support</button>
        </div>

        <div className="footer-column">
          <h4>Connect</h4>
          <div className="connect-icons">
            <button type="button">⌯</button>
            <button type="button">✤</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Login;