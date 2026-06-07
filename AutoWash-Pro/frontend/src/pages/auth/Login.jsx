import {useState} from "react";
import { login, saveAuth } from "../../api/authService";

function Login({ onLoginSuccess }){
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    async function handleSubmit(e){
        e.preventDefault();
        try{
            const data = await login(username, password);
            if(data.status === 200 || data.data){
                saveAuth(data.data);
                onLoginSuccess();
            }else{
                setErrorMessage(data.message);
            }
        } catch (error) {
            setErrorMessage("Đăng nhập thất bại. Kiểm trai lại username/password.");
        }
    }
    return (
        <form onSubmit = {handleSubmit}>
            {errorMessage && (
                <div className="alert alert-danger" role="alert">
                    {errorMessage}
                </div>
            )}
            <label>Username</label>
            <input
                placeholder="Nhập username"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <label>Password</label>
            <input
                placeholder="Nhập password"
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button className="btn btn-primary w-100" type="submit">
                Login
            </button>
        </form>
    );    
}
export default Login;