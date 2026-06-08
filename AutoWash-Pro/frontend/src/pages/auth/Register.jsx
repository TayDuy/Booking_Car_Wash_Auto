import React, { useState } from "react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    fullName: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log(formData);
  };

  return (
    <div className="auth-page">
      <h1>Đăng ký</h1>

      <form onSubmit={handleSubmit}>
        <input name="email" placeholder="Email" onChange={handleChange} />
        <input name="username" placeholder="Username" onChange={handleChange} />
        <input name="fullName" placeholder="Họ và tên" onChange={handleChange} />
        <input name="phone" placeholder="Số điện thoại" onChange={handleChange} />
        <input name="password" type="password" placeholder="Mật khẩu" onChange={handleChange} />
        <input name="confirmPassword" type="password" placeholder="Nhập lại mật khẩu" onChange={handleChange} />

        <button type="submit">Đăng ký</button>
      </form>
    </div>
  );
}