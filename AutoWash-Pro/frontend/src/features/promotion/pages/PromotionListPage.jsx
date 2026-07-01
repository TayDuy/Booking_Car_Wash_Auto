import { Link } from "react-router-dom";
import "./PromotionListPage.css";

const promotions = [
  {
    id: 1,
    title: "Giảm 20% cho lần đặt lịch đầu tiên",
    description:
      "Áp dụng cho khách hàng mới khi đặt lịch rửa xe online qua WashFlow Pro.",
    code: "NEW20",
    discount: "20%",
    expiredDate: "31/12/2026",
    status: "available",
    tag: "Khách hàng mới",
  },
  {
    id: 2,
    title: "Giảm 50.000đ cho gói rửa xe cao cấp",
    description:
      "Ưu đãi dành cho khách hàng sử dụng dịch vụ rửa xe cao cấp tại chi nhánh bất kỳ.",
    code: "PREMIUM50",
    discount: "50K",
    expiredDate: "30/11/2026",
    status: "available",
    tag: "Rửa xe cao cấp",
  },
  {
    id: 3,
    title: "Tặng điểm thưởng thành viên",
    description:
      "Nhận thêm điểm loyalty khi hoàn tất booking và thanh toán thành công.",
    code: "POINTX2",
    discount: "x2 điểm",
    expiredDate: "15/12/2026",
    status: "available",
    tag: "Loyalty",
  },
  {
    id: 4,
    title: "Combo chăm sóc nội thất",
    description:
      "Giảm giá khi đặt combo vệ sinh nội thất và khử mùi khoang xe.",
    code: "INTERIOR15",
    discount: "15%",
    expiredDate: "20/10/2026",
    status: "expired",
    tag: "Combo",
  },
];

function getStatusLabel(status) {
  if (status === "available") {
    return "Còn hiệu lực";
  }

  return "Hết hạn";
}

function PromotionListPage() {
  return (
    <div className="promotion-page">
      <section className="promotion-hero">
        <div className="app-container promotion-hero-inner">
          <div>
            <span className="promotion-badge">Trung tâm ưu đãi</span>

            <h1>Khuyến mãi dành riêng cho bạn</h1>

            <p>
              Lưu mã ưu đãi và sử dụng khi đặt lịch rửa xe để tiết kiệm chi phí
              cho mỗi lần chăm sóc xe.
            </p>
          </div>

          <div className="promotion-hero-card">
            <span>Ưu đãi nổi bật</span>
            <strong>Giảm 20%</strong>
            <p>Cho lần đặt lịch đầu tiên</p>
            <Link to="/customer/booking" className="primary-button">
              Đặt lịch ngay
            </Link>
          </div>
        </div>
      </section>

      <section className="promotion-section">
        <div className="app-container">
          <div className="promotion-toolbar">
            <div>
              <h2>Danh sách ưu đãi</h2>
              <p>Chọn ưu đãi phù hợp và áp dụng khi đặt lịch.</p>
            </div>

            <Link to="/customer/booking" className="secondary-button">
              Đặt lịch rửa xe
            </Link>
          </div>

          <div className="promotion-grid">
            {promotions.map((promotion) => (
              <article
                className={
                  promotion.status === "expired"
                    ? "promotion-card card expired"
                    : "promotion-card card"
                }
                key={promotion.id}
              >
                <div className="promotion-card-top">
                  <span className="promotion-tag">{promotion.tag}</span>

                  <span
                    className={
                      promotion.status === "available"
                        ? "status-badge status-success"
                        : "status-badge status-danger"
                    }
                  >
                    {getStatusLabel(promotion.status)}
                  </span>
                </div>

                <div className="promotion-discount">
                  {promotion.discount}
                </div>

                <h3>{promotion.title}</h3>

                <p>{promotion.description}</p>

                <div className="promotion-code-box">
                  <span>Mã ưu đãi</span>
                  <strong>{promotion.code}</strong>
                </div>

                <div className="promotion-meta">
                  <span>Hạn dùng</span>
                  <strong>{promotion.expiredDate}</strong>
                </div>

                <Link
                  to="/customer/booking"
                  className={
                    promotion.status === "expired"
                      ? "promotion-use-btn disabled"
                      : "promotion-use-btn"
                  }
                  onClick={(event) => {
                    if (promotion.status === "expired") {
                      event.preventDefault();
                    }
                  }}
                >
                  {promotion.status === "expired" ? "Đã hết hạn" : "Dùng ngay"}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default PromotionListPage;