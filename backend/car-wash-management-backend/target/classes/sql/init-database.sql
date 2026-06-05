-- =============================================
-- TẠO DATABASE CHO DEMO LOGIN
-- Chạy file này trong SQL Server Management Studio (SSMS)
-- =============================================

-- Bước 1: Tạo Database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'demo_login_db')
BEGIN
    CREATE DATABASE demo_login_db;
END
GO

USE demo_login_db;
GO

-- Bước 2: Tạo bảng users (khớp với User.java Entity)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(50) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL,
        email NVARCHAR(100) NOT NULL UNIQUE,
        role NVARCHAR(20) NOT NULL
    );
END
GO

-- Bước 3: Thêm dữ liệu test
-- Lưu ý: Mật khẩu đã được mã hóa bằng BCrypt
-- Mật khẩu gốc (plaintext) của tất cả tài khoản đều là: 123456

INSERT INTO users (username, password, email, role) VALUES
(N'admin', N'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', N'admin@carwash.com', N'ADMIN'),
(N'user01', N'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', N'user01@carwash.com', N'USER'),
(N'user02', N'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', N'user02@carwash.com', N'USER'),
(N'tayduy', N'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', N'tayduy@carwash.com', N'ADMIN'),
(N'nhanvien01', N'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', N'nhanvien01@carwash.com', N'USER');
GO

-- Kiểm tra dữ liệu
SELECT * FROM users;
GO
