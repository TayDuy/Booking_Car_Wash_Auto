import { useState } from "react";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import {
  getRole,
  getUsername,
  isLoggedIn,
  logout,
} from "./api/authService";

function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [authMode, setAuthMode] = useState("login");

  function handleLoginSuccess() {
    setLoggedIn(true);
  }

  function handleLogout() {
    logout();
    setLoggedIn(false);
    setAuthMode("login");
  }

  return (
    <div className="container mt-5">
      <h1>AutoWash Pro</h1>
      <p>Smart Automated Car Wash Management System</p>

      {loggedIn ? (
        <div>
          <h3>Đăng nhập thành công</h3>
          <p>Username: {getUsername()}</p>
          <p>Role: {getRole()}</p>

          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : authMode === "login" ? (
        <>
          <Login onLoginSuccess={handleLoginSuccess} />

          <p className="mt-3">
            Chưa có tài khoản?{" "}
            <button
              className="btn btn-link p-0"
              onClick={() => setAuthMode("register")}
            >
              Đăng ký
            </button>
          </p>
        </>
      ) : (
        <>
          <Register onRegisterSuccess={() => setAuthMode("login")} />

          <p className="mt-3">
            Đã có tài khoản?{" "}
            <button
              className="btn btn-link p-0"
              onClick={() => setAuthMode("login")}
            >
              Đăng nhập
            </button>
          </p>
        </>
      )}
    </div>
  );
}

export default App;