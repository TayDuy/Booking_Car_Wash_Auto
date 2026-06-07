-- ============================================================
-- BƯỚC 1: XÓA BẢNG CŨ (nếu có)
-- ============================================================
DROP TABLE IF EXISTS loyaltytransaction CASCADE;
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS bookingdetail CASCADE;
DROP TABLE IF EXISTS booking CASCADE;
DROP TABLE IF EXISTS timeslot CASCADE;
DROP TABLE IF EXISTS promotion CASCADE;
DROP TABLE IF EXISTS reward CASCADE;
DROP TABLE IF EXISTS servicepackage CASCADE;
DROP TABLE IF EXISTS vehicle CASCADE;
DROP TABLE IF EXISTS employee CASCADE;
DROP TABLE IF EXISTS washbay CASCADE;
DROP TABLE IF EXISTS branch CASCADE;
DROP TABLE IF EXISTS customer CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS loyaltytier CASCADE;

-- ============================================================
-- BƯỚC 2: TẠO BẢNG
-- ============================================================

CREATE TABLE loyaltytier (
    tierid             INT           NOT NULL PRIMARY KEY,
    tiername           VARCHAR(20)   NOT NULL CHECK (tiername IN ('Member','Silver','Gold','Platinum')),
    minpoints          INT           NOT NULL DEFAULT 0,
    minvisits          INT           NOT NULL DEFAULT 0,
    minspending        DECIMAL(12,2) NOT NULL DEFAULT 0,
    bookingwindowdays  INT           NOT NULL DEFAULT 3,
    prioritylevel      INT           NOT NULL DEFAULT 1,
    benefitdescription VARCHAR(255),
    isactive           BOOLEAN       NOT NULL DEFAULT TRUE
);

CREATE TABLE account (
    userid       SERIAL        NOT NULL PRIMARY KEY,
    username     VARCHAR(50)   NOT NULL UNIQUE,
    passwordhash VARCHAR(255)  NOT NULL,
    email        VARCHAR(100),
    phone        VARCHAR(15)   UNIQUE,
    status       VARCHAR(10)   NOT NULL DEFAULT 'active' CHECK (status IN ('active','locked','inactive')),
    createdat    TIMESTAMP     NOT NULL DEFAULT NOW(),
    role         VARCHAR(10)   NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','employee','admin'))
);

CREATE TABLE customer (
    customerid    SERIAL         NOT NULL PRIMARY KEY,
    userid        INT            NOT NULL UNIQUE,
    brandid       INT,
    fullname      VARCHAR(100)   NOT NULL,
    dateofbirth   DATE,
    gender        VARCHAR(10)    CHECK (gender IN ('male','female','other')),
    tierid        INT            NOT NULL DEFAULT 1,
    totalpoints   INT            NOT NULL DEFAULT 0,
    totalvisits   INT            NOT NULL DEFAULT 0,
    totalspending DECIMAL(12,2)  NOT NULL DEFAULT 0,
    joinedat      TIMESTAMP      NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_customer_user FOREIGN KEY (userid)  REFERENCES account(userid),
    CONSTRAINT fk_customer_tier FOREIGN KEY (tierid)  REFERENCES loyaltytier(tierid)
);

CREATE TABLE branch (
    branchid   SERIAL        NOT NULL PRIMARY KEY,
    branchname VARCHAR(100)  NOT NULL,
    address    VARCHAR(255),
    phone      VARCHAR(15),
    opentime   TIME,
    closetime  TIME,
    status     VARCHAR(10)   NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
    createdat  TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE washbay (
    bayid    SERIAL       NOT NULL PRIMARY KEY,
    branchid INT          NOT NULL,
    bayname  VARCHAR(50),
    status   VARCHAR(15)  NOT NULL DEFAULT 'available' CHECK (status IN ('available','occupied','maintenance')),
    capacity INT          NOT NULL DEFAULT 1,
    CONSTRAINT fk_washbay_branch FOREIGN KEY (branchid) REFERENCES branch(branchid)
);

CREATE TABLE employee (
    employeeid SERIAL        NOT NULL PRIMARY KEY,
    userid     INT           NOT NULL UNIQUE,
    branchid   INT           NOT NULL,
    fullname   VARCHAR(100)  NOT NULL,
    position   VARCHAR(10)   NOT NULL DEFAULT 'staff' CHECK (position IN ('staff','manager','admin')),
    shift      VARCHAR(50),
    hiredate   DATE,
    salary     DECIMAL(12,2),
    status     VARCHAR(10)   NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
    CONSTRAINT fk_employee_user   FOREIGN KEY (userid)   REFERENCES account(userid),
    CONSTRAINT fk_employee_branch FOREIGN KEY (branchid) REFERENCES branch(branchid)
);

CREATE TABLE vehicle (
    vehicleid    SERIAL       NOT NULL PRIMARY KEY,
    customerid   INT          NOT NULL,
    licenseplate VARCHAR(20)  NOT NULL UNIQUE,
    vehicletype  VARCHAR(10)  NOT NULL CHECK (vehicletype IN ('car')),
    brand        VARCHAR(50),
    model        VARCHAR(50),
    color        VARCHAR(30),
    isactive     BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_vehicle_customer FOREIGN KEY (customerid) REFERENCES customer(customerid)
);

CREATE TABLE servicepackage (
    serviceid       SERIAL        NOT NULL PRIMARY KEY,
    servicename     VARCHAR(100)  NOT NULL,
    description     VARCHAR(255),
    baseprice       DECIMAL(12,2) NOT NULL,
    durationminutes INT           NOT NULL DEFAULT 30,
    isactive        BOOLEAN       NOT NULL DEFAULT TRUE
);

CREATE TABLE timeslot (
    slotid          SERIAL       NOT NULL PRIMARY KEY,
    branchid        INT          NOT NULL,
    bayid           INT          NOT NULL,
    slotdate        DATE         NOT NULL,
    starttime       TIME         NOT NULL,
    endtime         TIME         NOT NULL,
    maxcapacity     INT          NOT NULL DEFAULT 1,
    currentbookings INT          NOT NULL DEFAULT 0,
    status          VARCHAR(10)  NOT NULL DEFAULT 'open' CHECK (status IN ('open','full','closed')),
    CONSTRAINT fk_timeslot_branch FOREIGN KEY (branchid) REFERENCES branch(branchid),
    CONSTRAINT fk_timeslot_bay    FOREIGN KEY (bayid)    REFERENCES washbay(bayid)
);

CREATE TABLE promotion (
    promotionid   SERIAL        NOT NULL PRIMARY KEY,
    promotionname VARCHAR(100)  NOT NULL,
    targettierid  INT,
    discounttype  VARCHAR(15)   NOT NULL CHECK (discounttype IN ('percent','fixed','free_service')),
    discountvalue DECIMAL(12,2) NOT NULL,
    startdate     DATE          NOT NULL,
    enddate       DATE          NOT NULL,
    usagelimit    INT,
    status        VARCHAR(10)   NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','expired')),
    createdby     INT           NOT NULL,
    CONSTRAINT fk_promo_tier    FOREIGN KEY (targettierid) REFERENCES loyaltytier(tierid),
    CONSTRAINT fk_promo_creator FOREIGN KEY (createdby)    REFERENCES account(userid)
);

CREATE TABLE reward (
    rewardid       SERIAL        NOT NULL PRIMARY KEY,
    rewardname     VARCHAR(100)  NOT NULL,
    requiredpoints INT           NOT NULL,
    rewardtype     VARCHAR(15)   NOT NULL CHECK (rewardtype IN ('discount','free_wash','addon')),
    rewardvalue    DECIMAL(12,2) NOT NULL,
    vehicletype    VARCHAR(10)   NOT NULL DEFAULT 'car' CHECK (vehicletype IN ('car')),
    status         VARCHAR(10)   NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
    createdat      TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE booking (
    bookingid     SERIAL        NOT NULL PRIMARY KEY,
    customerid    INT           NOT NULL,
    vehicleid     INT           NOT NULL,
    slotid        INT           NOT NULL,
    branchid      INT           NOT NULL,
    employeeid    INT,
    bookingcode   VARCHAR(30)   NOT NULL UNIQUE,
    bookingdate   TIMESTAMP     NOT NULL DEFAULT NOW(),
    status        VARCHAR(15)   NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled','no_show')),
    priorityscore INT           NOT NULL DEFAULT 1,
    starttime     TIMESTAMP,
    endtime       TIMESTAMP,
    note          VARCHAR(255),
    CONSTRAINT fk_booking_customer FOREIGN KEY (customerid) REFERENCES customer(customerid),
    CONSTRAINT fk_booking_vehicle  FOREIGN KEY (vehicleid)  REFERENCES vehicle(vehicleid),
    CONSTRAINT fk_booking_slot     FOREIGN KEY (slotid)     REFERENCES timeslot(slotid),
    CONSTRAINT fk_booking_branch   FOREIGN KEY (branchid)   REFERENCES branch(branchid),
    CONSTRAINT fk_booking_employee FOREIGN KEY (employeeid) REFERENCES employee(employeeid)
);

CREATE TABLE bookingdetail (
    bookingdetailid SERIAL        NOT NULL PRIMARY KEY,
    bookingid       INT           NOT NULL,
    serviceid       INT           NOT NULL,
    quantity        INT           NOT NULL DEFAULT 1,
    unitprice       DECIMAL(12,2) NOT NULL,
    subtotal        DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_bookingdetail_booking  FOREIGN KEY (bookingid)  REFERENCES booking(bookingid),
    CONSTRAINT fk_bookingdetail_service  FOREIGN KEY (serviceid)  REFERENCES servicepackage(serviceid)
);

CREATE TABLE payment (
    paymentid      SERIAL        NOT NULL PRIMARY KEY,
    bookingid      INT           NOT NULL UNIQUE,
    promotionid    INT,
    rewardid       INT,
    originalamount DECIMAL(12,2) NOT NULL,
    discountamount DECIMAL(12,2) NOT NULL DEFAULT 0,
    finalamount    DECIMAL(12,2) NOT NULL,
    paymentmethod  VARCHAR(15)   NOT NULL DEFAULT 'cash' CHECK (paymentmethod IN ('cash','bank_transfer','pos')),
    paymentstatus  VARCHAR(10)   NOT NULL DEFAULT 'unpaid' CHECK (paymentstatus IN ('unpaid','paid','failed','cancelled')),
    paidat         TIMESTAMP,
    CONSTRAINT fk_payment_booking   FOREIGN KEY (bookingid)   REFERENCES booking(bookingid),
    CONSTRAINT fk_payment_promotion FOREIGN KEY (promotionid) REFERENCES promotion(promotionid),
    CONSTRAINT fk_payment_reward    FOREIGN KEY (rewardid)    REFERENCES reward(rewardid)
);

CREATE TABLE loyaltytransaction (
    loyaltytransactionid SERIAL        NOT NULL PRIMARY KEY,
    customerid           INT           NOT NULL,
    paymentid            INT,
    transactiontype      VARCHAR(10)   NOT NULL CHECK (transactiontype IN ('earn','redeem','expire','adjust')),
    points               INT           NOT NULL,
    balancebefore        INT           NOT NULL DEFAULT 0,
    balanceafter         INT           NOT NULL DEFAULT 0,
    expiredat            TIMESTAMP,
    createdat            TIMESTAMP     NOT NULL DEFAULT NOW(),
    note                 VARCHAR(255),
    CONSTRAINT fk_loyaltytx_customer FOREIGN KEY (customerid) REFERENCES customer(customerid),
    CONSTRAINT fk_loyaltytx_payment  FOREIGN KEY (paymentid)  REFERENCES payment(paymentid)
);

-- ============================================================
-- BƯỚC 3: SEED DATA
-- ============================================================
INSERT INTO loyaltytier (tierid, tiername, minpoints, minvisits, minspending, bookingwindowdays, prioritylevel, benefitdescription, isactive)
VALUES
    (1, 'Member',   0,    0,  0,       3, 1, 'Hạng cơ bản - Đặt lịch trước 3 ngày', TRUE),
    (2, 'Silver',   500,  10, 500000,  5, 2, 'Hạng Bạc - Đặt lịch trước 5 ngày, ưu tiên trung bình', TRUE),
    (3, 'Gold',     2000, 30, 2000000, 7, 3, 'Hạng Vàng - Đặt lịch trước 7 ngày, ưu tiên cao', TRUE),
    (4, 'Platinum', 5000, 60, 5000000, 14, 4, 'Hạng Kim Cương - Đặt lịch trước 14 ngày, ưu tiên cao nhất', TRUE);
