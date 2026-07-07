import "./Login.css";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  login,
  saveAuth,
  loginWithGoogle,
  isLoggedIn,
} from "../../api/authService";
import { supabase } from "../../api/supabaseClient";

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  function redirectByRole(role) {
    const normalizedRole = role?.toLowerCase();

    if (normalizedRole === "admin") {
      navigate("/admin");
    } else if (normalizedRole === "employee") {
      navigate("/employee");
    } else {
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

      if (data.status === 200 || data.data) {
        saveAuth(data.data);

        if (onLoginSuccess) {
          onLoginSuccess();
        }

        redirectByRole(data.data.user.role);
      } else {
        setErrorMessage(
          data.message || "Đăng nhập thất bại. Kiểm tra lại username/password."
        );
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
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/login",
        },
      });
    } catch (error) {
      console.log("Google login error:", error);
      setErrorMessage("Đăng nhập Google thất bại!");
    }
  }

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          if (isLoggedIn()) return;

          const isGoogleClick =
            sessionStorage.getItem("isGoogleLoginClick") === "true";

          const hasAuthParams =
            window.location.hash.includes("access_token=") ||
            window.location.search.includes("code=");

          if (!isGoogleClick && !hasAuthParams) {
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

              if (onLoginSuccess) {
                onLoginSuccess();
              }

              redirectByRole(data.data.user.role);
            } else {
              setErrorMessage(
                data.message || "Đăng nhập bằng Google thất bại trên Backend."
              );
            }
          } catch (error) {
            console.error("Lỗi khi gửi token về Backend:", error);
            setErrorMessage(
              "Đăng nhập thất bại. Không thể xác thực với máy chủ."
            );
          } finally {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="login-layout">
      <main className="login-page">
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

              <Link
                to="/forgot-password"
                className="forgot-link"
              >
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              <span>{loading ? "Signing in..." : "Sign In"}</span>
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
              disabled={loading}
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