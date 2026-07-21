import PublicHeader from "../../../components/layout/PublicHeader";
import PublicFooter from "../../../components/layout/PublicFooter";
import "./LegalPage.css";

const SECTIONS = [
  { id: "gioi-thieu", title: "1. Giới thiệu" },
  { id: "thong-tin-thu-thap", title: "2. Thông tin chúng tôi thu thập" },
  { id: "muc-dich-su-dung", title: "3. Mục đích sử dụng thông tin" },
  { id: "chia-se-thong-tin", title: "4. Chia sẻ thông tin với bên thứ ba" },
  { id: "luu-tru-bao-mat", title: "5. Lưu trữ và bảo mật dữ liệu" },
  { id: "quyen-cua-ban", title: "6. Quyền của khách hàng" },
  { id: "cookie", title: "7. Cookie và công nghệ theo dõi" },
  { id: "tre-em", title: "8. Quyền riêng tư của trẻ em" },
  { id: "thay-doi-chinh-sach", title: "9. Thay đổi chính sách" },
  { id: "lien-he", title: "10. Liên hệ" },
];

function PrivacyPolicyPage() {
  return (
    <div className="legal-page">
      <PublicHeader />

      <section className="legal-hero">
        <div className="app-container">
          <span className="landing-badge">Pháp lý</span>
          <h1>Chính sách bảo mật</h1>
          <p>
            AutoWash Pro cam kết bảo vệ thông tin cá nhân của khách hàng, đối
            tác và nhân viên khi sử dụng nền tảng đặt lịch rửa xe của chúng
            tôi trên mọi vai trò: khách hàng, nhân viên và quản trị viên.
          </p>
          <span className="legal-updated">Cập nhật lần cuối: 20/07/2026</span>
        </div>
      </section>

      <section className="legal-body">
        <div className="app-container legal-layout">
          <aside className="legal-toc">
            <h4>Nội dung</h4>
            <ol>
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.title}</a>
                </li>
              ))}
            </ol>
          </aside>

          <article className="legal-content">
            <section id="gioi-thieu">
              <h2>1. Giới thiệu</h2>
              <p>
                Chính sách bảo mật này áp dụng cho toàn bộ nền tảng
                <strong> AutoWash Pro</strong> (bao gồm website, ứng dụng và
                các hệ thống liên quan) — nền tảng đặt lịch rửa xe trực tuyến
                phục vụ ba nhóm người dùng: khách hàng (customer), nhân viên
                (staff) và quản trị viên (admin). Bằng việc truy cập hoặc sử
                dụng dịch vụ của chúng tôi, bạn đồng ý với các điều khoản
                được nêu trong chính sách này.
              </p>
              <p>
                Chúng tôi khuyến khích bạn đọc kỹ chính sách này để hiểu rõ
                cách AutoWash Pro thu thập, sử dụng, lưu trữ và bảo vệ thông
                tin cá nhân của bạn.
              </p>
            </section>

            <section id="thong-tin-thu-thap">
              <h2>2. Thông tin chúng tôi thu thập</h2>
              <p>Tùy theo vai trò sử dụng, chúng tôi có thể thu thập:</p>
              <h3>Đối với khách hàng</h3>
              <ul>
                <li>Họ tên, số điện thoại, email, địa chỉ</li>
                <li>Thông tin tài khoản đăng nhập (username, mật khẩu đã mã hóa)</li>
                <li>Thông tin phương tiện (biển số, dòng xe, loại xe)</li>
                <li>Lịch sử đặt lịch, lịch sử giao dịch và thanh toán</li>
                <li>Phản hồi, đánh giá dịch vụ và nội dung trao đổi qua hệ thống hỗ trợ</li>
              </ul>
              <h3>Đối với nhân viên và quản trị viên</h3>
              <ul>
                <li>Thông tin định danh nhân sự và tài khoản làm việc</li>
                <li>Lịch làm việc, ca trực và nhật ký thao tác trên hệ thống (audit log)</li>
              </ul>
              <h3>Thông tin kỹ thuật</h3>
              <ul>
                <li>Địa chỉ IP, loại trình duyệt, thiết bị truy cập</li>
                <li>Dữ liệu cookie và nhật ký hoạt động trên nền tảng</li>
              </ul>
            </section>

            <section id="muc-dich-su-dung">
              <h2>3. Mục đích sử dụng thông tin</h2>
              <p>AutoWash Pro sử dụng thông tin thu thập được nhằm:</p>
              <ul>
                <li>Xử lý và quản lý các lượt đặt lịch rửa xe, thanh toán và hóa đơn</li>
                <li>Xác thực tài khoản, phân quyền truy cập theo vai trò (khách hàng / nhân viên / quản trị viên)</li>
                <li>Gửi thông báo liên quan đến lịch đặt, khuyến mãi, chương trình hội viên</li>
                <li>Cải thiện chất lượng dịch vụ, phân tích trải nghiệm người dùng</li>
                <li>Hỗ trợ khách hàng, xử lý khiếu nại và tranh chấp phát sinh</li>
                <li>Đảm bảo an ninh hệ thống, phòng chống gian lận và truy cập trái phép</li>
                <li>Tuân thủ nghĩa vụ pháp lý theo quy định pháp luật hiện hành</li>
              </ul>
            </section>

            <section id="chia-se-thong-tin">
              <h2>4. Chia sẻ thông tin với bên thứ ba</h2>
              <p>
                AutoWash Pro không bán hoặc cho thuê thông tin cá nhân của
                bạn. Thông tin chỉ được chia sẻ trong các trường hợp sau:
              </p>
              <ul>
                <li>
                  Đối tác cung cấp dịch vụ thanh toán (VNPay, PayPal...) để xử
                  lý giao dịch của bạn
                </li>
                <li>
                  Đơn vị vận hành chi nhánh rửa xe, nhân viên phụ trách để
                  thực hiện đúng lịch hẹn đã đặt
                </li>
                <li>
                  Cơ quan nhà nước có thẩm quyền khi có yêu cầu hợp pháp theo
                  quy định pháp luật
                </li>
                <li>
                  Nhà cung cấp dịch vụ kỹ thuật (lưu trữ dữ liệu, gửi email/OTP)
                  hoạt động theo hợp đồng bảo mật với chúng tôi
                </li>
              </ul>
            </section>

            <section id="luu-tru-bao-mat">
              <h2>5. Lưu trữ và bảo mật dữ liệu</h2>
              <p>
                Dữ liệu của bạn được lưu trữ trên hạ tầng máy chủ có áp dụng
                các biện pháp bảo mật kỹ thuật như mã hóa mật khẩu, xác thực
                bằng token (JWT), giới hạn quyền truy cập theo vai trò và ghi
                nhật ký thao tác quản trị.
              </p>
              <p>
                Chúng tôi lưu trữ thông tin cá nhân trong thời gian cần thiết
                để phục vụ mục đích đã nêu hoặc theo yêu cầu của pháp luật.
                Sau thời gian đó, dữ liệu sẽ được xóa hoặc ẩn danh hóa một
                cách an toàn.
              </p>
            </section>

            <section id="quyen-cua-ban">
              <h2>6. Quyền của khách hàng</h2>
              <p>Bạn có quyền:</p>
              <ul>
                <li>Truy cập, xem lại và cập nhật thông tin cá nhân trong mục Hồ sơ</li>
                <li>Yêu cầu chỉnh sửa hoặc xóa thông tin không chính xác</li>
                <li>Yêu cầu ngừng nhận email/thông báo marketing bất kỳ lúc nào</li>
                <li>Yêu cầu xóa tài khoản và dữ liệu liên quan, trừ dữ liệu cần lưu trữ theo quy định pháp luật</li>
                <li>Khiếu nại nếu cho rằng quyền riêng tư của mình bị vi phạm</li>
              </ul>
            </section>

            <section id="cookie">
              <h2>7. Cookie và công nghệ theo dõi</h2>
              <p>
                Chúng tôi sử dụng cookie và các công nghệ tương tự để duy trì
                phiên đăng nhập, ghi nhớ tùy chọn và phân tích lưu lượng truy
                cập nhằm cải thiện trải nghiệm sử dụng. Bạn có thể tắt cookie
                trong cài đặt trình duyệt, tuy nhiên một số tính năng có thể
                không hoạt động đầy đủ nếu cookie bị vô hiệu hóa.
              </p>
            </section>

            <section id="tre-em">
              <h2>8. Quyền riêng tư của trẻ em</h2>
              <p>
                Dịch vụ của AutoWash Pro không hướng đến người dùng dưới 16
                tuổi. Chúng tôi không cố ý thu thập thông tin cá nhân từ trẻ
                em. Nếu phát hiện trường hợp này, chúng tôi sẽ xóa thông tin
                liên quan trong thời gian sớm nhất.
              </p>
            </section>

            <section id="thay-doi-chinh-sach">
              <h2>9. Thay đổi chính sách</h2>
              <p>
                Chính sách bảo mật này có thể được cập nhật theo thời gian để
                phù hợp với thay đổi trong hoạt động kinh doanh hoặc quy định
                pháp luật. Phiên bản mới nhất luôn được đăng tải trên trang
                này kèm ngày cập nhật.
              </p>
            </section>

            <section id="lien-he">
              <h2>10. Liên hệ</h2>
              <p>
                Nếu bạn có câu hỏi hoặc yêu cầu liên quan đến chính sách bảo
                mật này, vui lòng liên hệ:
              </p>
              <div className="legal-contact-box">
                <p><strong>AutoWash Pro</strong></p>
                <p>Địa chỉ: 123 Đường Công Nghệ, TP.HCM</p>
                <p>Hotline: 1900 8888</p>
                <p>Email: support@autowashpro.vn</p>
              </div>
            </section>
          </article>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

export default PrivacyPolicyPage;