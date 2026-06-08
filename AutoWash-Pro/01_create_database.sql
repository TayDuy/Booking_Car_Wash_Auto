-- ============================================================
-- SWP Car Wash - Full Database Script (SQL Server / T-SQL)
-- Bao gồm: Tạo DB + Schema + Seed Data (100 Customers)
-- ============================================================

USE master;
GO
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'SWP_CarWash')
    DROP DATABASE SWP_CarWash;
GO
CREATE DATABASE SWP_CarWash
    COLLATE Vietnamese_CI_AS;
GO
USE SWP_CarWash;
GO

-- ============================================================
-- PHẦN 1: TẠO BẢNG (SCHEMA)
-- ============================================================

CREATE TABLE LoyaltyTier (
    TierID             INT           NOT NULL PRIMARY KEY,
    TierName           NVARCHAR(20)  NOT NULL CHECK (TierName IN (N'Member',N'Silver',N'Gold',N'Platinum')),
    MinPoints          INT           NOT NULL DEFAULT 0,
    MinVisits          INT           NOT NULL DEFAULT 0,
    MinSpending        DECIMAL(12,2) NOT NULL DEFAULT 0,
    BookingWindowDays  INT           NOT NULL DEFAULT 3,
    PriorityLevel      INT           NOT NULL DEFAULT 1,
    BenefitDescription NVARCHAR(255),
    IsActive           BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE Account (
    UserID       INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    Username     NVARCHAR(50)  NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Email        NVARCHAR(100),
    Phone        NVARCHAR(15)  UNIQUE,
    Status       NVARCHAR(10)  NOT NULL DEFAULT 'active' CHECK (Status IN ('active','locked','inactive')),
    CreatedAt    DATETIME      NOT NULL DEFAULT GETDATE(),
    Role         NVARCHAR(10)  NOT NULL DEFAULT 'customer' CHECK (Role IN ('customer','employee','admin'))
);
GO
CREATE TABLE Customer (
    CustomerID    INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    UserID        INT            NOT NULL UNIQUE,
    BrandID       INT,
    FullName      NVARCHAR(100)  NOT NULL,
    DateOfBirth   DATE,
    Gender        NVARCHAR(10)   CHECK (Gender IN ('male','female','other')),
    TierID        INT            NOT NULL DEFAULT 1,
    TotalPoints   INT            NOT NULL DEFAULT 0,
    TotalVisits   INT            NOT NULL DEFAULT 0,
    TotalSpending DECIMAL(12,2)  NOT NULL DEFAULT 0,
    JoinedAt      DATETIME       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Customer_User FOREIGN KEY (UserID)  REFERENCES Account(UserID),
    CONSTRAINT FK_Customer_Tier FOREIGN KEY (TierID)  REFERENCES LoyaltyTier(TierID)
);
GO

CREATE TABLE Branch (
    BranchID   INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    BranchName NVARCHAR(100) NOT NULL,
    Address    NVARCHAR(255),
    Phone      NVARCHAR(15),
    OpenTime   TIME,
    CloseTime  TIME,
    Status     NVARCHAR(10)  NOT NULL DEFAULT 'active' CHECK (Status IN ('active','inactive')),
    CreatedAt  DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE WashBay (
    BayID    INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    BranchID INT          NOT NULL,
    BayName  NVARCHAR(50),
    Status   NVARCHAR(15) NOT NULL DEFAULT 'available' CHECK (Status IN ('available','occupied','maintenance')),
    Capacity INT          NOT NULL DEFAULT 1,
    CONSTRAINT FK_WashBay_Branch FOREIGN KEY (BranchID) REFERENCES Branch(BranchID)
);
GO

CREATE TABLE Employee (
    EmployeeID INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    UserID     INT           NOT NULL UNIQUE,
    BranchID   INT           NOT NULL,
    FullName   NVARCHAR(100) NOT NULL,
    Position   NVARCHAR(10)  NOT NULL DEFAULT 'staff' CHECK (Position IN ('staff','manager','admin')),
    Shift      NVARCHAR(50),
    HireDate   DATE,
    Salary     DECIMAL(12,2),
    Status     NVARCHAR(10)  NOT NULL DEFAULT 'active' CHECK (Status IN ('active','inactive')),
    CONSTRAINT FK_Employee_User   FOREIGN KEY (UserID)   REFERENCES Account(UserID),
    CONSTRAINT FK_Employee_Branch FOREIGN KEY (BranchID) REFERENCES Branch(BranchID)
);
GO

CREATE TABLE Vehicle (
    VehicleID    INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    CustomerID   INT          NOT NULL,
    LicensePlate NVARCHAR(20) NOT NULL UNIQUE,
    VehicleType  NVARCHAR(10) NOT NULL CHECK (VehicleType IN ('car')),
    Brand        NVARCHAR(50),
    Model        NVARCHAR(50),
    Color        NVARCHAR(30),
    IsActive     BIT          NOT NULL DEFAULT 1,
    CONSTRAINT FK_Vehicle_Customer FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID)
);
GO

CREATE TABLE ServicePackage (
    ServiceID       INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    ServiceName     NVARCHAR(100) NOT NULL,
    Description     NVARCHAR(255),
    BasePrice       DECIMAL(12,2) NOT NULL,
    DurationMinutes INT           NOT NULL DEFAULT 30,
    IsActive        BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE TimeSlot (
    SlotID          INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    BranchID        INT          NOT NULL,
    BayID           INT          NOT NULL,
    SlotDate        DATE         NOT NULL,
    StartTime       TIME         NOT NULL,
    EndTime         TIME         NOT NULL,
    MaxCapacity     INT          NOT NULL DEFAULT 1,
    CurrentBookings INT          NOT NULL DEFAULT 0,
    Status          NVARCHAR(10) NOT NULL DEFAULT 'open' CHECK (Status IN ('open','full','closed')),
    CONSTRAINT FK_TimeSlot_Branch FOREIGN KEY (BranchID) REFERENCES Branch(BranchID),
    CONSTRAINT FK_TimeSlot_Bay    FOREIGN KEY (BayID)    REFERENCES WashBay(BayID)
);
GO

CREATE TABLE Promotion (
    PromotionID   INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    PromotionName NVARCHAR(100) NOT NULL,
    TargetTierID  INT,
    DiscountType  NVARCHAR(15)  NOT NULL CHECK (DiscountType IN ('percent','fixed','free_service')),
    DiscountValue DECIMAL(12,2) NOT NULL,
    StartDate     DATE          NOT NULL,
    EndDate       DATE          NOT NULL,
    UsageLimit    INT,
    Status        NVARCHAR(10)  NOT NULL DEFAULT 'active' CHECK (Status IN ('active','inactive','expired')),
    CreatedBy     INT           NOT NULL,
    CONSTRAINT FK_Promo_Tier    FOREIGN KEY (TargetTierID) REFERENCES LoyaltyTier(TierID),
    CONSTRAINT FK_Promo_Creator FOREIGN KEY (CreatedBy)    REFERENCES Account(UserID)
);
GO

CREATE TABLE Reward (
    RewardID       INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    RewardName     NVARCHAR(100) NOT NULL,
    RequiredPoints INT           NOT NULL,
    RewardType     NVARCHAR(15)  NOT NULL CHECK (RewardType IN ('discount','free_wash','addon')),
    RewardValue    DECIMAL(12,2) NOT NULL,
    VehicleType    NVARCHAR(10)  NOT NULL DEFAULT 'car' CHECK (VehicleType IN ('car')),
    Status         NVARCHAR(10)  NOT NULL DEFAULT 'active' CHECK (Status IN ('active','inactive')),
    CreatedAt      DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE Booking (
    BookingID     INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    CustomerID    INT           NOT NULL,
    VehicleID     INT           NOT NULL,
    SlotID        INT           NOT NULL,
    BranchID      INT           NOT NULL,
    EmployeeID    INT,
    BookingCode   NVARCHAR(30)  NOT NULL UNIQUE,
    BookingDate   DATETIME      NOT NULL DEFAULT GETDATE(),
    Status        NVARCHAR(15)  NOT NULL DEFAULT 'pending' CHECK (Status IN ('pending','confirmed','in_progress','completed','cancelled','no_show')),
    PriorityScore INT           NOT NULL DEFAULT 1,
    StartTime     DATETIME,
    EndTime       DATETIME,
    Note          NVARCHAR(255),
    CONSTRAINT FK_Booking_Customer FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),
    CONSTRAINT FK_Booking_Vehicle  FOREIGN KEY (VehicleID)  REFERENCES Vehicle(VehicleID),
    CONSTRAINT FK_Booking_Slot     FOREIGN KEY (SlotID)     REFERENCES TimeSlot(SlotID),
    CONSTRAINT FK_Booking_Branch   FOREIGN KEY (BranchID)   REFERENCES Branch(BranchID),
    CONSTRAINT FK_Booking_Employee FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID)
);
GO

CREATE TABLE BookingDetail (
    BookingDetailID INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    BookingID       INT           NOT NULL,
    ServiceID       INT           NOT NULL,
    Quantity        INT           NOT NULL DEFAULT 1,
    UnitPrice       DECIMAL(12,2) NOT NULL,
    SubTotal        DECIMAL(12,2) NOT NULL,
    CONSTRAINT FK_BookingDetail_Booking  FOREIGN KEY (BookingID)  REFERENCES Booking(BookingID),
    CONSTRAINT FK_BookingDetail_Service  FOREIGN KEY (ServiceID)  REFERENCES ServicePackage(ServiceID)
);
GO

CREATE TABLE Payment (
    PaymentID      INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    BookingID      INT           NOT NULL UNIQUE,
    PromotionID    INT,
    RewardID       INT,
    OriginalAmount DECIMAL(12,2) NOT NULL,
    DiscountAmount DECIMAL(12,2) NOT NULL DEFAULT 0,
    FinalAmount    DECIMAL(12,2) NOT NULL,
    PaymentMethod  NVARCHAR(15)  NOT NULL DEFAULT 'cash' CHECK (PaymentMethod IN ('cash','bank_transfer','pos')),
    PaymentStatus  NVARCHAR(10)  NOT NULL DEFAULT 'unpaid' CHECK (PaymentStatus IN ('unpaid','paid','failed','cancelled')),
    PaidAt         DATETIME,
    CONSTRAINT FK_Payment_Booking   FOREIGN KEY (BookingID)   REFERENCES Booking(BookingID),
    CONSTRAINT FK_Payment_Promotion FOREIGN KEY (PromotionID) REFERENCES Promotion(PromotionID),
    CONSTRAINT FK_Payment_Reward    FOREIGN KEY (RewardID)    REFERENCES Reward(RewardID)
);
GO

CREATE TABLE LoyaltyTransaction (
    LoyaltyTransactionID INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    CustomerID           INT           NOT NULL,
    PaymentID            INT,
    TransactionType      NVARCHAR(10)  NOT NULL CHECK (TransactionType IN ('earn','redeem','expire','adjust')),
    Points               INT           NOT NULL,
    BalanceBefore        INT           NOT NULL DEFAULT 0,
    BalanceAfter         INT           NOT NULL DEFAULT 0,
    ExpiredAt            DATETIME,
    CreatedAt            DATETIME      NOT NULL DEFAULT GETDATE(),
    Note                 NVARCHAR(255),
    CONSTRAINT FK_LoyaltyTx_Customer FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),
    CONSTRAINT FK_LoyaltyTx_Payment  FOREIGN KEY (PaymentID)  REFERENCES Payment(PaymentID)
);
GO

-- ============================================================
-- END: Tạo Database & Schema hoàn tất
-- ============================================================
