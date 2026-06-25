import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRole, getUsername, isLoggedIn, logout } from "./api/authService";

function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    setLoggedIn(false);
    navigate("/login");
  }

  if (!loggedIn) {
    navigate("/login");
    return null;
  }

  return (
      <div className="container mt-5">
        <h3>Đăng nhập thành công</h3>
        <p>Username: {getUsername()}</p>
        <p>Role: {getRole()}</p>
        <button className="btn btn-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>
  );
}

export default App;