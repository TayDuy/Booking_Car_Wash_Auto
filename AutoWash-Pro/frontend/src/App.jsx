import { useState } from "react";
import Login from "./pages/auth/Login";
import{
  getRole,
  getUsername,
  isLoggedIn,
  logout,
} from "./api/authService";

function App(){
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  
  function handleLoginSuccess(){
    setLoggedIn(true);
  }
  function handleLogout(){
    logout();
    setLoggedIn(false);
  }
  return(
    <div className="container mt-5">

    {loggedIn ? (
      <div>
        <h3> Đăng nhập thành công</h3>
        <p>username: {getUsername()}</p>
        <p>Role: {getRole()}</p>

        <button className="btn btn-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>
    ) : (
      <Login onLoginSuccess={handleLoginSuccess} />
    )}    
    </div>
  );
}
export default App;