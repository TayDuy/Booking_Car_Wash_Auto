import React, { useState } from "react";
import "./SupportPage.css";
import "./ContactPage.css";
import { useAppDialog } from "../../../contexts/DialogContext.jsx";

export default function SupportPage() {
  const { showMessage } = useAppDialog();
  const [activeFaq, setActiveFaq] = useState(null);

  const [formData, setFormData] = useState({
    fullName: localStorage.getItem("fullName") || localStorage.getItem("username") || "",
    email: localStorage.getItem("email") || "",
    phone: localStorage.getItem("phone") || "",
    subject: "Hỗ trợ đặt lịch",
    message: "",
  });

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      await showMessage({
        title: "Thông báo",
        message: "Vui lòng nhập nội dung tin nhắn cần hỗ trợ.",
        variant: "warning",
      });
      return;
    }

    await showMessage({
      title: "Gửi yêu cầu thành công",
      message: `Cảm ơn ${formData.fullName || "bạn"} đã gửi liên hệ! Đội ngũ tư vấn WashFlow Pro đã ghi nhận yêu cầu "${formData.subject}" và sẽ phản hồi qua email/SĐT của bạn trong 24h làm việc.`,
      variant: "success",
    });

    setFormData((prev) => ({ ...prev, message: "" }));
  };

  const faqList = [
    {
      q: "Làm sao để đặt lịch rửa xe?",
      a: "Bạn chỉ cần chọn gói dịch vụ phù hợp trên trang chủ hoặc ứng dụng, chọn khung giờ trống và xác nhận đặt lịch. Hệ thống sẽ tự động giữ chỗ cho bạn.",
    },
    {
      q: "Chính sách hoàn tiền như thế nào?",
      a: "WashFlow Pro cam kết hoàn tiền 100% nếu dịch vụ không đạt chất lượng hoặc bạn hủy lịch trước 30 phút so với giờ hẹn.",
    },
    {
      q: "Tôi có thể thay đổi gói dịch vụ không?",
      a: "Có, bạn hoàn toàn có thể nâng cấp hoặc thay đổi gói rửa xe trực tiếp trên ứng dụng trước khi xe bắt đầu vào khoang rửa.",
    },
    {
      q: "Quy trình bảo hành diễn ra bao lâu?",
      a: "Đối với dịch vụ Phủ Ceramic hoặc Chăm sóc nội thất, thời gian bảo hành kéo dài từ 6 tháng đến 2 năm tùy gói dịch vụ bạn đã chọn.",
    },
  ];

  return (
    <div className="support-page">
      {/* HERO BANNER SECTION */}
      <section className="support-hero-section">
        <div className="app-container">
          <div className="support-hero-card">
            <div className="support-hero-content">
              <h1>
                Trung tâm Hỗ trợ & Liên hệ <br />
                WashFlow Pro
              </h1>
              
              <div className="support-search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Chúng tôi có thể giúp gì cho bạn?"
                />
              </div>

              <div className="popular-tags">
                <span className="tag-label">Từ khóa phổ biến:</span>
                <div className="tags-list">
                  <span className="tag-item">Đặt lịch</span>
                  <span className="tag-item">Thanh toán</span>
                  <span className="tag-item">Hoàn tiền</span>
                  <span className="tag-item">Bảo hành</span>
                </div>
              </div>
            </div>

            <div className="support-hero-image">
              <img
                src="https://dauso1900.vn/wp-content/uploads/2020/06/cham-soc-khach-hang-6.png"
                alt="Đội ngũ hỗ trợ WashFlow Pro"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FORM GỬI YÊU CẦU & THÔNG TIN LIÊN HỆ */}
      <section className="contact-main-section" style={{ paddingTop: 30 }}>
        <div className="app-container">
          <div className="contact-grid-layout">
            {/* CỘT TRÁI: 3 THẺ THÔNG TIN LIÊN HỆ */}
            <div className="contact-info-col">
              <div className="info-card">
                <div className="info-icon-box">📍</div>
                <div className="info-details">
                  <h3>Văn phòng chính</h3>
                  <p>Số 123 Đường Song Hành, Thảo Điền, Quận 2, TP. Hồ Chí Minh, Việt Nam</p>
                </div>
              </div>

              <div className="info-card">
                <div className="info-icon-box">📞</div>
                <div className="info-details">
                  <h3>Hotline hỗ trợ</h3>
                  <p className="highlight-text">1900 8888 66</p>
                  <span className="sub-note">Phục vụ 24/7 cho mọi yêu cầu cấp bách.</span>
                </div>
              </div>

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
              <h2>Gửi tin nhắn liên hệ & Hỗ trợ</h2>
              <p className="form-subtitle">
                Vui lòng điền thông tin bên dưới, chuyên viên của chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.
              </p>

              <form onSubmit={handleContactSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Họ và Tên</label>
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Chủ đề cần hỗ trợ</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    >
                      <option value="Hỗ trợ đặt lịch">Hỗ trợ đặt lịch</option>
                      <option value="Tư vấn dịch vụ">Tư vấn dịch vụ</option>
                      <option value="Góp ý phản hồi">Góp ý phản hồi</option>
                      <option value="Hợp tác doanh nghiệp">Hợp tác doanh nghiệp</option>
                    </select>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Nội dung tin nhắn</label>
                  <textarea
                    rows="4"
                    placeholder="Tôi muốn câu hỏi / hỗ trợ về..."
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  ></textarea>
                </div>

                <button type="submit" className="btn-send-request">
                  Gửi yêu cầu hỗ trợ ngay ►
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CÂU HỎI THƯỜNG GẶP (FAQ) */}
      <section className="faq-section">
        <div className="app-container">
          <div className="section-header-center">
            <h2>Câu hỏi thường gặp (FAQ)</h2>
            <p>Đội ngũ chuyên viên sẵn sàng trả lời câu hỏi thường gặp</p>
          </div>

          <div className="faq-list">
            {faqList.map((item, index) => (
              <div
                key={index}
                className={`faq-item ${activeFaq === index ? "active" : ""}`}
                onClick={() => toggleFaq(index)}
              >
                <div className="faq-question">
                  <span>{item.q}</span>
                  <span className="faq-chevron">
                    {activeFaq === index ? "▲" : "▼"}
                  </span>
                </div>
                {activeFaq === index && (
                  <div className="faq-answer">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}