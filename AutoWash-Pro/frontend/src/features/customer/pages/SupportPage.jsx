import { useState } from "react";
import "./SupportPage.css";

const faqs = [
  {
    id: 1,
    question: "Tôi có thể hủy lịch đã đặt không?",
    answer:
      "Có. Bạn có thể vào trang Lịch sử đặt lịch để hủy booking nếu booking chưa được hoàn thành.",
  },
  {
    id: 2,
    question: "Tôi thanh toán bằng cách nào?",
    answer:
      "Hiện tại bạn có thể thanh toán tại quầy. Sau này hệ thống sẽ hỗ trợ thêm thanh toán online.",
  },
  {
    id: 3,
    question: "Điểm thành viên được tính như thế nào?",
    answer:
      "Sau mỗi booking hoàn thành, hệ thống sẽ cộng điểm dựa trên dịch vụ và tổng tiền thanh toán.",
  },
  {
    id: 4,
    question: "Tôi có thể đổi chi nhánh sau khi đặt lịch không?",
    answer:
      "Nếu booking chưa được xác nhận, bạn có thể hủy và đặt lại tại chi nhánh mong muốn.",
  },
];

function SupportPage() {
  const [message, setMessage] = useState({
    fullName: "",
    email: "",
    content: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setMessage((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    alert("Gửi yêu cầu hỗ trợ demo thành công.");
    setMessage({
      fullName: "",
      email: "",
      content: "",
    });
  };

  return (
    <div className="support-page">
      <section className="support-hero">
        <div className="app-container support-hero-inner">
          <div>
            <span className="support-badge">Hỗ trợ khách hàng</span>

            <h1>Chúng tôi có thể giúp gì cho bạn?</h1>

            <p>
              Gửi yêu cầu hỗ trợ, xem câu hỏi thường gặp hoặc liên hệ trực tiếp
              với WashFlow Pro khi bạn cần trợ giúp.
            </p>
          </div>
        </div>
      </section>

      <section className="support-section">
        <div className="app-container support-layout">
          <main className="support-main card">
            <div className="support-form-header">
              <h2>Gửi yêu cầu hỗ trợ</h2>
              <p>Điền thông tin bên dưới, đội ngũ hỗ trợ sẽ phản hồi sớm.</p>
            </div>

            <form className="support-form" onSubmit={handleSubmit}>
              <div className="support-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="fullName">
                    Họ và tên
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    className="form-input"
                    type="text"
                    placeholder="Nhập họ tên"
                    value={message.fullName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    className="form-input"
                    type="email"
                    placeholder="Nhập email"
                    value={message.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="content">
                  Nội dung cần hỗ trợ
                </label>
                <textarea
                  id="content"
                  name="content"
                  className="form-textarea"
                  placeholder="Mô tả vấn đề bạn đang gặp..."
                  value={message.content}
                  onChange={handleChange}
                />
              </div>

              <button className="primary-button" type="submit">
                Gửi yêu cầu
              </button>
            </form>
          </main>

          <aside className="support-contact">
            <div className="support-contact-card card">
              <div className="support-contact-icon">☎️</div>
              <h3>Hotline</h3>
              <p>1900 1234</p>
            </div>

            <div className="support-contact-card card">
              <div className="support-contact-icon">📧</div>
              <h3>Email</h3>
              <p>support@washflow.vn</p>
            </div>

            <div className="support-contact-card card">
              <div className="support-contact-icon">⏰</div>
              <h3>Thời gian hỗ trợ</h3>
              <p>08:00 - 22:00 hằng ngày</p>
            </div>
          </aside>
        </div>

        <div className="app-container faq-wrapper">
          <div className="faq-header">
            <h2>Câu hỏi thường gặp</h2>
            <p>Một số câu hỏi phổ biến khi sử dụng WashFlow Pro.</p>
          </div>

          <div className="faq-grid">
            {faqs.map((faq) => (
              <article className="faq-card card" key={faq.id}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default SupportPage;