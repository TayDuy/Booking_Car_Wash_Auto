import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./SupportPage.css";

export default function SupportPage() {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
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
                Trung tâm Hỗ trợ - <br />
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
                <span className="tag-label">Tag các tin tức popular nhất:</span>
                <div className="tags-list">
                  <span className="tag-item">Đặt lịch</span>
                  <span className="tag-item">Thanh toán</span>
                  <span className="tag-item">Sự cố</span>
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

      {/* CHỦ ĐỀ HỖ TRỢ */}
      <section className="support-topics-section">
        <div className="app-container">
          <div className="section-header-center">
            <h2>Chủ đề hỗ trợ</h2>
            <p>Chúng tôi luôn ở đây để hỗ trợ bạn tại các trạm WashFlow Pro.</p>
          </div>

          <div className="topics-grid">
            <div className="topic-card">
              <div className="topic-icon-box">📖</div>
              <h3>Hướng dẫn sử dụng</h3>
              <p>
                Hướng dẫn sử dụng các thao tác tự động hóa tiện lợi của chúng tôi
                được áp dụng.
              </p>
              <button className="btn-topic-action">Xem chi tiết →</button>
            </div>

            <div className="topic-card">
              <div className="topic-icon-box">🛠️</div>
              <h3>Xử lý sự cố</h3>
              <p>
                Xử lý sự cố khi hệ thống tự động gặp phải tình huống trục trặc
                về sự cố.
              </p>
              <button className="btn-topic-action">Xem chi tiết →</button>
            </div>

            <div className="topic-card">
              <div className="topic-icon-box">💳</div>
              <h3>Thanh toán & Hóa đơn</h3>
              <p>
                Thanh toán & Hóa đơn của tôi thanh toán & lịch sử/xuất/hướng dẫn
                Hóa đơn.
              </p>
              <button className="btn-topic-action">Xem chi tiết →</button>
            </div>

            <div className="topic-card">
              <div className="topic-icon-box">🛡️</div>
              <h3>Chính sách bảo hành</h3>
              <p>
                Sửa chữa sản phẩm hóa chất chuyên dụng làm tròn rửa quy mô lớn nhất
                thị trường của WashFlow Pro.
              </p>
              <button className="btn-topic-action">Xem chi tiết →</button>
            </div>
          </div>
        </div>
      </section>

      {/* LIÊN HỆ HỖ TRỢ */}
      <section className="direct-support-section">
        <div className="app-container">
          <div className="section-header-center">
            <h2>Liên hệ hỗ trợ</h2>
            <p>
              Chúng tôi cung cấp các giải pháp tối ưu cho mọi loại hình doanh
              nghiệp trong ngành dịch vụ vận tải và chăm sóc xe.
            </p>
          </div>

          <div className="direct-grid">
            <div className="direct-card">
              <div className="direct-icon-box">💬</div>
              <h3>Chat trực tuyến</h3>
              <p>
                Chat trực tuyến và ngay lập tức hỗ trợ bạn giải quyết mọi câu
                hỏi thắc mắc.
              </p>
              <button className="btn-direct-blue">Bắt đầu chat</button>
            </div>

            <div className="direct-card">
              <div className="direct-icon-box">✉️</div>
              <h3>Gửi yêu cầu</h3>
              <p>
                Tạo yêu cầu mới cần xác nhận, tải file video hỗ trợ thắc mắc
                nào.
              </p>
              <button className="btn-direct-blue">Tạo yêu cầu mới</button>
            </div>

            <div className="direct-card">
              <div className="direct-icon-box">📞</div>
              <h3>Hotline hỗ trợ 24/7</h3>
              <p>
                Hotline hỗ trợ 24/7 Hotline tư vấn của WashFlow Pro hỗ trợ.
              </p>
              <a href="tel:19008888" className="btn-direct-blue btn-hotline">
                1900 8888
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CÂU HỎI THƯỜNG GẶP (FAQ) */}
      <section className="faq-section">
        <div className="app-container">
          <div className="section-header-center">
            <h2>Câu hỏi thường gặp (FAQ)</h2>
            <p>Đội ngũ chuyên viên sẵn sàng trả lời câu hỏi thường gặp (FAQ)</p>
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