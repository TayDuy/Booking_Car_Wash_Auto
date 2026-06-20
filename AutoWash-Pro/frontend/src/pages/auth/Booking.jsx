import React, { useState } from "react";
import "./Booking.css";
import { createBooking } from "../../api/bookingService";
import { useNavigate } from "react-router-dom";
import {
  getUsername,
  getRole
} from "../../api/authService";

export default function BookingPage() {
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const [selectedService, setSelectedService] = useState("Premium Shine");
  const [selectedTime, setSelectedTime] = useState("10:00 AM");

  const [licensePlate, setLicensePlate] = useState("");
  const [vehicleType, setVehicleType] = useState("Sedan");

  const [showNotification, setShowNotification] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const previousMonth = () => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      )
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      )
    );
  };

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const services = [
    {
      name: "Basic Wash",
      price: "$15",
      duration: "~15 mins",
      description: "Exterior wash, foam bath, and spot-free rinse",
    },
    {
      name: "Premium Shine",
      price: "$30",
      duration: "~25 mins",
      description: "Basic + Triple foam, undercarriage wash, tire shine",
    },
    {
      name: "Ultimate Gold",
      price: "$50",
      duration: "~45 mins",
      description: "Premium + Ceramic wax, interior vacuum, wipe down",
    },
  ];

  const selectedServiceData = services.find(
  (service) => service.name === selectedService
);

const price = Number(
  selectedServiceData.price.replace("$", "")
);

const tax = +(price * 0.08).toFixed(2);

const total = +(price + tax).toFixed(2);

  const timeSlots = [
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "12:30 PM",
  ];

const serviceMap = {
  "Basic Wash": 1,
  "Premium Shine": 2,
  "Ultimate Gold": 3,
};

const handleBooking = async () => {
  try {
    const bookingData = {
      customerId: 1,
      vehicleId: 1,
      slotId: 1,
      branchId: 1,

      note: note,

      details: [
        {
          serviceId: serviceMap[selectedService],
          quantity: 1,
        },
      ],
    };

    const response = await createBooking(bookingData);

    alert("Booking thành công!");

    console.log(response.data);
  } catch (error) {
    console.log(error);

    alert(
      error.response?.data?.message ||
      "Booking thất bại"
    );
  }
};

  return (
    <div className="booking-page">

      {/* HEADER */}
      <header className="booking-header">

        <div className="logo">
          WashFlow Pro
        </div>

        <nav>
          <a href="#">Services</a>
          <a href="#" className="active">
            Booking
          </a>
          <a href="/loyalty">
            Loyalty
          </a>
        </nav>

        <div className="header-right">

          <div className="notification-wrapper">
            <button
              className="icon-btn"
              onClick={() =>
                navigate("/notifications")
              }
            >
              🔔
            </button>
          </div>

          <button
            className="icon-btn"
            onClick={() =>
              navigate("/support")
            }
          >
            ❓
          </button>

          <div
            className="avatar"
            onClick={() =>
              navigate("/profile")
            }
          >
            H
          </div>

        </div>
      </header>
      {
        showNotification && (
          <div className="notification-dropdown">

            <h4>Notifications</h4>

            <div className="notification-item">
              Appointment Reminder
            </div>

            <div className="notification-item">
              Summer Promotion
            </div>

            <div className="notification-item">
              Membership Updated
            </div>

          </div>
          )
        }
        {
          showProfile && (
          <div className="profile-dropdown">

            <p>{getUsername()}</p>

            <p>{getRole()}</p>

            <button>
              Edit Profile
            </button>

            <button>
              Logout
            </button>

          </div>
          )
          }

      <div className="booking-content">

        {/* LEFT */}
        <div className="booking-left">

          <h1>Book a Wash</h1>
          <p>Select your service, schedule a time, and provide vehicle details.</p>

          {/* SERVICE */}
          <section className="booking-card">
            <h3>1. Select Service</h3>

            <div className="service-grid">
              {services.map((service) => (
                <div
                  key={service.name}
                  className={`service-card ${
                    selectedService === service.name ? "selected" : ""
                  }`}
                  onClick={() => setSelectedService(service.name)}
                >
                  <div className="service-top">
                    <h4>{service.name}</h4>
                    <span>{service.price}</span>
                  </div>

                  <p>{service.description}</p>

                  <small>{service.duration}</small>
                </div>
              ))}
            </div>
          </section>

          {/* SCHEDULE */}
          <section className="booking-card">
            <h3>2. Schedule Time</h3>

            <div className="schedule-container">

              <div className="calendar-box">
                <div className="calendar-header">
                  <button onClick={previousMonth}>❮</button>

                  <h4>
                    {monthNames[currentDate.getMonth()]}{" "}
                    {currentDate.getFullYear()}
                  </h4>

                  <button onClick={nextMonth}>❯</button>
                </div>

                <div className="calendar-grid">

                  <div className="day-name">Su</div>
                  <div className="day-name">Mo</div>
                  <div className="day-name">Tu</div>
                  <div className="day-name">We</div>
                  <div className="day-name">Th</div>
                  <div className="day-name">Fr</div>
                  <div className="day-name">Sa</div>

                  {calendarDays.map((day, index) => (
                    <div
                      key={index}
                      className={`calendar-day ${
                        day &&
                        selectedDate.getDate() === day &&
                        selectedDate.getMonth() === currentDate.getMonth() &&
                        selectedDate.getFullYear() === currentDate.getFullYear()
                          ? "selected-day"
                          : ""
                      }`}
                      onClick={() => {
                        if (day) {
                          setSelectedDate(
                            new Date(
                              currentDate.getFullYear(),
                              currentDate.getMonth(),
                              day
                            )
                          );
                        }
                      }}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>

              <div className="time-box">
                <h4>
                  Available Slots -{" "}
                  {selectedDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </h4>

                <div className="time-grid">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      className={selectedTime === time ? "selected" : ""}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* VEHICLE */}
          <section className="booking-card">
            <h3>3. Vehicle Information</h3>

            <div className="form-row">
              <div>
                <label>License Plate *</label>
                <input
                  placeholder="e.g. ABC-1234"
                  value={licensePlate}
                  onChange={(e) =>
                    setLicensePlate(e.target.value)
                  }
                />
              </div>

              <div>
                <label>Vehicle Type *</label>
                <select
                  value={vehicleType}
                  onChange={(e) =>
                    setVehicleType(e.target.value)
                  }
                >
                  <option>Sedan</option>
                  <option>SUV</option>
                  <option>Truck</option>
                </select>
              </div>
            </div>

            <label>Special Instructions (Optional)</label>
            <textarea
              placeholder="Any areas to focus on?"
              value={note}
              onChange={(e) =>
                setNote(e.target.value)
              }
            />
          </section>
        </div>

        {/* RIGHT */}
        <div className="booking-summary">
          <h3>Booking Summary</h3>

          <div className="summary-item">
            <span>{selectedServiceData.name}</span>
            <span>{selectedServiceData.price}</span>
          </div>

          <div className="summary-info">
            <p>
              {selectedDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              {" • "}
              {selectedTime}
            </p>

            <p>
              Est. Duration: {selectedServiceData.duration}
            </p>

            <p>
              Taxes & Fees: ${tax}
            </p>
          </div>

          <hr />

          <div className="total">
            <span>Total</span>
            <span>${total}</span>
          </div>

          <button
            className="confirm-btn"
            onClick={handleBooking}
          >
            Confirm & Pay →
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="booking-footer">
        <div>
          <h3>WashFlow Pro</h3>
          <p>© 2024 WashFlow Pro Automation. All rights reserved.</p>
        </div>

        <div className="footer-links">
          <a href="#">Contact Us</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Support</a>
        </div>
      </footer>
    </div>
  );
}