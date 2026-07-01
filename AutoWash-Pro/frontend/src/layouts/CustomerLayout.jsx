import { Outlet } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import "./CustomerLayout.css";

function CustomerLayout() {
  return (
    <div className="customer-layout">
      <SiteHeader />

      <main className="customer-main">
        <Outlet />
      </main>

      <footer className="customer-footer">
        <div className="app-container customer-footer-inner">
          <div>
            <h3>WashFlow Pro</h3>
            <p>Đặt lịch rửa xe nhanh chóng, tiện lợi và chuyên nghiệp.</p>
          </div>

          <div className="customer-footer-links">
            <a href="/customer/home">Trang chủ</a>
            <a href="/customer/booking">Đặt lịch</a>
            <a href="/customer/promotions">Ưu đãi</a>
            <a href="/customer/support">Hỗ trợ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default CustomerLayout;