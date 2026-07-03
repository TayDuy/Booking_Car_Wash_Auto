import React from "react";

export default function OtpInput({ 
  value, 
  onChange, 
  disabled, 
  placeholder = "Nhập mã OTP", 
  className = "auth-input" 
}) {
  const handleChange = (e) => {
    const val = e.target.value;
    // Only allow digits and limit to 6 characters
    if (/^\d*$/.test(val) && val.length <= 6) {
      onChange(val);
    }
  };

  return (
    <input
      type="text"
      className={className}
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      onChange={handleChange}
      maxLength={6}
      style={{ 
        letterSpacing: value ? "4px" : "normal", 
        fontWeight: value ? "bold" : "normal",
        textAlign: value ? "center" : "left"
      }}
    />
  );
}
