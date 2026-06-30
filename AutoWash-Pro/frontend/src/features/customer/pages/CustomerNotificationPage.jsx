import "./CustomerNotificationPage.css";

const notifications = [
  {
    id: 1,
    title: "Booking đã được xác nhận",
    message:
      "Lịch rửa xe của bạn tại WashFlow Kim Giang lúc 09:00 ngày 28/06/2026 đã được xác nhận.",
    time: "10 phút trước",
    type: "booking",
    unread: true,
  },
  {
    id: 2,
    title: "Bạn nhận được ưu đãi mới",
    message:
      "Mã NEW20 đang khả dụng. Áp dụng giảm 20% cho lần đặt lịch tiếp theo.",
    time: "2 giờ trước",
    type: "promotion",
    unread: true,
  },
  {
    id: 3,
    title: "Cộng điểm thành viên",
    message:
      "Bạn đã được cộng 120 điểm sau khi hoàn tất dịch vụ rửa xe cao cấp.",
    time: "Hôm qua",
    type: "loyalty",
    unread: false,
  },
  {
    id: 4,
    title: "Booking đã hoàn thành",
    message:
      "Cảm ơn bạn đã sử dụng dịch vụ tại WashFlow Pro. Hãy đánh giá trải nghiệm của bạn.",
    time: "3 ngày trước",
    type: "booking",
    unread: false,
  },
];

function getNotificationIcon(type) {
  switch (type) {
    case "booking":
      return "📅";
    case "promotion":
      return "🎁";
    case "loyalty":
      return "⭐";
    default:
      return "🔔";
  }
}

function CustomerNotificationPage() {
  return (
    <div className="notification-page">
      <section className="notification-hero">
        <div className="app-container notification-hero-inner">
          <div>
            <span className="notification-badge">Thông báo</span>

            <h1>Cập nhật mới nhất dành cho bạn</h1>

            <p>
              Theo dõi trạng thái booking, ưu đãi mới, điểm thành viên và các
              thông tin quan trọng từ WashFlow Pro.
            </p>
          </div>

          <button className="secondary-button" type="button">
            Đánh dấu đã đọc
          </button>
        </div>
      </section>

      <section className="notification-section">
        <div className="app-container notification-layout">
          <aside className="notification-sidebar card">
            <h2>Bộ lọc</h2>

            <button className="notification-filter active" type="button">
              Tất cả
            </button>

            <button className="notification-filter" type="button">
              Booking
            </button>

            <button className="notification-filter" type="button">
              Ưu đãi
            </button>

            <button className="notification-filter" type="button">
              Thành viên
            </button>
          </aside>

          <main className="notification-list card">
            <div className="notification-list-header">
              <div>
                <h2>Danh sách thông báo</h2>
                <p>Bạn có 2 thông báo chưa đọc.</p>
              </div>
            </div>

            <div className="notification-items">
              {notifications.map((notification) => (
                <article
                  className={
                    notification.unread
                      ? "notification-item unread"
                      : "notification-item"
                  }
                  key={notification.id}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="notification-content">
                    <div className="notification-title-row">
                      <h3>{notification.title}</h3>

                      {notification.unread && (
                        <span className="unread-dot">Mới</span>
                      )}
                    </div>

                    <p>{notification.message}</p>

                    <span className="notification-time">
                      {notification.time}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </main>
        </div>
      </section>
    </div>
  );
}

export default CustomerNotificationPage;