import React, { useRef, useEffect } from "react";

export default function OtpInput({
  value,
  onChange,
  disabled,
  placeholder = "Nhập mã OTP",
  className = "auth-input"
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    if (val !== value) {
      onChange(val);
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      className={className}
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      onChange={handleChange}
      maxLength={6}
      style={{
        letterSpacing: value ? "4px" : "normal",
        fontWeight: value ? "bold" : "normal",
        textAlign: "center",
      }}
    />
  );
}
