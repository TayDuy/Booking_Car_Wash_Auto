import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./ContactPage.css";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    subject: "Hỗ trợ đặt lịch",
    message: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Yêu cầu liên hệ của bạn đã được gửi thành công!");
  };

  return (
    <div className="contact-page">
      {/* HEADER PAGE */}
      <section className="contact-header-section">
        <div className="app-container text-center">
          <h1>Liên hệ với chúng tôi</h1>
          <p>
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Đội ngũ WashFlow
            Pro cam kết mang lại trải nghiệm chăm sóc xe chuyên nghiệp và tận tâm
            nhất.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT GRID (INFO CARDS + FORM) */}
      <section className="contact-main-section">
        <div className="app-container">
          <div className="contact-grid-layout">
            {/* CỘT TRÁI: 3 THẺ THÔNG TIN LIÊN HỆ */}
            <div className="contact-info-col">
              {/* Card 1 */}
              <div className="info-card">
                <div className="info-icon-box">📍</div>
                <div className="info-details">
                  <h3>Văn phòng chính</h3>
                  <p>
                    Số 123 Đường Song Hành, Thảo Điền, Quận 2, TP. Hồ Chí Minh,
                    Việt Nam
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="info-card">
                <div className="info-icon-box">📞</div>
                <div className="info-details">
                  <h3>Hotline hỗ trợ</h3>
                  <p className="highlight-text">1900 8888 66</p>
                  <span className="sub-note">
                    Phục vụ 24/7 cho mọi yêu cầu cấp bách.
                  </span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="info-card">
                <div className="info-icon-box">✉️</div>
                <div className="info-details">
                  <h3>Email doanh nghiệp</h3>
                  <p>support@washflowpro.vn</p>
                  <p>partnership@washflowpro.vn</p>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: FORM GỬI TIN NHẮN */}
            <div className="contact-form-card">
              <h2>Gửi tin nhắn cho chúng tôi</h2>
              <p className="form-subtitle">
                Vui lòng điền thông tin bên dưới, chuyên viên của chúng tôi sẽ
                phản hồi trong vòng 24 giờ làm việc.
              </p>

              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Họ và Tên</label>
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      required
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Số điện thoại</label>
                    <input
                      type="tel"
                      placeholder="090 123 4567"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Chủ đề</label>
                    <select
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                    >
                      <option value="Hỗ trợ đặt lịch">Hỗ trợ đặt lịch</option>
                      <option value="Tư vấn dịch vụ">Tư vấn dịch vụ</option>

                      <option value="Góp ý phản hồi">Góp ý phản hồi</option>
                      <option value="Hợp tác doanh nghiệp">
                        Hợp tác doanh nghiệp
                      </option>
                    </select>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Tin nhắn của bạn</label>
                  <textarea
                    rows="4"
                    placeholder="Tôi muốn hỏi về..."
                    required
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                  ></textarea>
                </div>

                <button type="submit" className="btn-send-request">
                  Gửi yêu cầu ngay ►
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* BANNER THẮC MẮC BÊN DƯỚI (Đã thay thế vị trí Bản đồ) */}
      <section className="contact-faq-banner">
        <div className="app-container">
          <div className="faq-banner-content">
            <h3>Bạn vẫn còn thắc mắc?</h3>
            <p>
              Kiểm tra trang Câu hỏi thường gặp của chúng tôi để nhận phản hồi
              nhanh chóng cho các thắc mắc phổ biến nhất.
            </p>
            <Link to="/support" className="btn-faq-support">
              Xem Trung Tâm Hỗ Trợ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}