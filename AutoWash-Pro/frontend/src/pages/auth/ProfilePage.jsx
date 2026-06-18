import {
  getUsername,
  getRole
} from "../../api/authService";

export default function ProfilePage() {
  return (
    <div className="container mt-5">
      <h1>User Profile</h1>

      <p>Email: {getUsername()}</p>
      <p>Role: {getRole()}</p>
    </div>
  );
}