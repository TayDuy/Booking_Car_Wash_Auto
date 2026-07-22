import PublicHeader from "../../../components/layout/PublicHeader";
import PublicFooter from "../../../components/layout/PublicFooter";
import "./LegalPage.css";

const SECTIONS = [
  { id: "chap-nhan-dieu-khoan", title: "1. Chấp nhận điều khoản" },
  { id: "dinh-nghia", title: "2. Định nghĩa" },
  { id: "tai-khoan", title: "3. Tài khoản người dùng" },
  { id: "dat-lich-huy-lich", title: "4. Đặt lịch, thay đổi và hủy lịch" },
  { id: "thanh-toan", title: "5. Giá dịch vụ, Thuế VAT & Thanh toán" },
  { id: "trach-nhiem-khach-hang", title: "6. Trách nhiệm của khách hàng" },
  { id: "trach-nhiem-autowash", title: "7. Trách nhiệm của AutoWash Pro" },
  { id: "gioi-han-trach-nhiem", title: "8. Giới hạn trách nhiệm" },
  { id: "chuong-trinh-hoi-vien", title: "9. Chương trình hội viên & khuyến mãi" },
  { id: "so-huu-tri-tue", title: "10. Sở hữu trí tuệ" },
  { id: "cham-dut", title: "11. Tạm ngưng và chấm dứt tài khoản" },
  { id: "thay-doi-dieu-khoan", title: "12. Thay đổi điều khoản" },
  { id: "luat-ap-dung", title: "13. Luật áp dụng" },
  { id: "lien-he-terms", title: "14. Liên hệ" },
];

function TermsOfServicePage() {
  return (
    <div className="legal-page">

      <section className="legal-hero">
        <div className="app-container">
          <span className="landing-badge">Pháp lý</span>
          <h1>Điều khoản dịch vụ</h1>
          <p>
            Vui lòng đọc kỹ các điều khoản dưới đây trước khi sử dụng nền
            tảng đặt lịch rửa xe AutoWash Pro. Việc tạo tài khoản hoặc đặt
            lịch đồng nghĩa với việc bạn đồng ý tuân thủ các điều khoản này.
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
            <section id="chap-nhan-dieu-khoan">
              <h2>1. Chấp nhận điều khoản</h2>
              <p>
                Điều khoản dịch vụ này ("Điều khoản") là thỏa thuận giữa bạn
                và <strong>AutoWash Pro</strong> điều chỉnh việc sử dụng
                website, ứng dụng và các dịch vụ đặt lịch rửa xe liên quan
                ("Dịch vụ"). Khi đăng ký tài khoản hoặc sử dụng Dịch vụ, bạn
                xác nhận đã đọc, hiểu và đồng ý bị ràng buộc bởi các Điều
                khoản này cùng Chính sách bảo mật của chúng tôi.
              </p>
            </section>

            <section id="dinh-nghia">
              <h2>2. Định nghĩa</h2>
              <ul>
                <li><strong>Khách hàng:</strong> người dùng đăng ký tài khoản để đặt lịch rửa xe.</li>
                <li><strong>Nhân viên:</strong> người dùng được cấp tài khoản để thực hiện và quản lý dịch vụ tại chi nhánh.</li>
                <li><strong>Quản trị viên:</strong> người dùng có quyền quản lý toàn bộ hệ thống, chi nhánh, dịch vụ và người dùng.</li>
                <li><strong>Chi nhánh:</strong> địa điểm cung cấp dịch vụ rửa xe thuộc hệ thống AutoWash Pro.</li>
              </ul>
            </section>

            <section id="tai-khoan">
              <h2>3. Tài khoản người dùng</h2>
              <ul>
                <li>
                  Bạn cần cung cấp thông tin chính xác, đầy đủ khi đăng ký tài
                  khoản và có trách nhiệm cập nhật khi có thay đổi.
                </li>
                <li>
                  Bạn chịu trách nhiệm bảo mật thông tin đăng nhập (tài khoản,
                  mật khẩu) và mọi hoạt động phát sinh từ tài khoản của mình.
                </li>
                <li>
                  Mỗi cá nhân chỉ được sở hữu một tài khoản khách hàng, trừ
                  trường hợp được AutoWash Pro chấp thuận khác.
                </li>
                <li>
                  AutoWash Pro có quyền tạm khóa hoặc yêu cầu xác minh lại tài
                  khoản nếu phát hiện dấu hiệu gian lận hoặc vi phạm điều
                  khoản.
                </li>
              </ul>
            </section>

            <section id="dat-lich-huy-lich">
              <h2>4. Đặt lịch, thay đổi và hủy lịch</h2>
              <ul>
                <li>
                  Khách hàng đặt lịch bằng cách chọn chi nhánh, dịch vụ, thời
                  gian phù hợp trên hệ thống. Lịch hẹn được xác nhận khi hệ
                  thống hiển thị trạng thái "Đã xác nhận".
                </li>
                <li>
                  Khách hàng nên có mặt tại chi nhánh đúng khung giờ đã đặt.
                  Trường hợp trễ quá thời gian quy định, lịch hẹn có thể bị
                  hủy hoặc chuyển sang khung giờ khác tùy tình trạng chỗ trống.
                </li>
                <li>
                  Khách hàng có thể thay đổi hoặc hủy lịch hẹn trực tiếp trên
                  hệ thống trước thời gian hẹn theo chính sách hủy lịch hiển
                  thị tại thời điểm đặt.
                </li>
                <li>
                  AutoWash Pro có quyền từ chối hoặc điều chỉnh lịch hẹn trong
                  trường hợp bất khả kháng (sự cố thiết bị, thời tiết, quá tải
                  hệ thống...) và sẽ thông báo sớm nhất có thể.
                </li>
              </ul>
            </section>

            {/* CẬP NHẬT MỤC 5: GIÁ DỊCH VỤ, THUẾ VAT & THANH TOÁN */}
            <section id="thanh-toan">
              <h2>5. Giá dịch vụ, Thuế VAT và Thanh toán</h2>
              <ul>
                <li>
                  <strong>Giá dịch vụ & Phụ phí:</strong> Giá dịch vụ được niêm yết công khai trên nền tảng và có thể thay đổi theo từng thời điểm. Chi phí thực tế có thể bao gồm phụ phí phân loại dòng xe (xe 4 chỗ, 7 chỗ/SUV). Giá áp dụng là tổng giá trị được hiển thị tại thời điểm bạn xác nhận đặt lịch.
                </li>
                <li>
                  <strong>Thuế Giá trị Gia tăng (VAT 8%):</strong> Mọi dịch vụ chăm sóc và rửa xe tại AutoWash Pro đều thuộc đối tượng áp dụng thuế Giá trị Gia tăng (VAT) với mức thuế suất <strong>8%</strong> theo quy định hiện hành của Pháp luật. Tiền thuế VAT được tự động tính toán dựa trên tổng giá trị dịch vụ và hiển thị minh bạch tại màn hình tóm tắt đơn hàng.
                </li>
                <li>
                  <strong>Xuất hóa đơn GTGT:</strong> Khách hàng hoặc Doanh nghiệp có nhu cầu xuất Hóa đơn GTGT điện tử vui lòng điền thông tin xuất hóa đơn (Tên công ty, Mã số thuế, Email) trong bước đặt lịch hoặc gửi yêu cầu đến bộ phận CSKH trong vòng <strong>24 giờ</strong> kể từ khi dịch vụ hoàn tất.
                </li>
                <li>
                  <strong>Hình thức thanh toán:</strong> Thanh toán được thực hiện qua các kênh thanh toán trực tuyến được hỗ trợ (MoMo, ZaloPay, NAPAS...) hoặc thanh toán trực tiếp tại chi nhánh. Các chương trình giảm giá (như ưu đãi thanh toán online) sẽ được trừ trực tiếp vào hóa đơn thanh toán cuối cùng.
                </li>
                <li>
                  <strong>Xử lý sự cố giao dịch:</strong> Trường hợp phát sinh lỗi thanh toán hoặc trừ tiền trùng lặp, khoản tiền sẽ được đối soát và hoàn lại cho khách hàng theo quy trình của ngân hàng hoặc đối tác cổng thanh toán liên kết.
                </li>
              </ul>
            </section>

            <section id="trach-nhiem-khach-hang">
              <h2>6. Trách nhiệm của khách hàng</h2>
              <ul>
                <li>Cung cấp thông tin xe và liên hệ chính xác khi đặt lịch.</li>
                <li>Kiểm tra và lấy hết tài sản cá nhân trong xe trước khi giao xe để rửa.</li>
                <li>Tuân thủ nội quy an toàn tại chi nhánh và hướng dẫn của nhân viên.</li>
                <li>Thông báo kịp thời cho AutoWash Pro nếu phát hiện sai sót trong quá trình sử dụng dịch vụ.</li>
              </ul>
            </section>

            <section id="trach-nhiem-autowash">
              <h2>7. Trách nhiệm của AutoWash Pro</h2>
              <ul>
                <li>Cung cấp dịch vụ rửa xe đúng như mô tả, đảm bảo chất lượng và an toàn cho phương tiện.</li>
                <li>Bảo mật thông tin cá nhân của người dùng theo Chính sách bảo mật.</li>
                <li>Hỗ trợ, xử lý khiếu nại của khách hàng trong thời gian hợp lý.</li>
                <li>Thông báo minh bạch về giá dịch vụ, khuyến mãi và thay đổi chính sách.</li>
              </ul>
            </section>

            <section id="gioi-han-trach-nhiem">
              <h2>8. Giới hạn trách nhiệm</h2>
              <p>
                AutoWash Pro không chịu trách nhiệm đối với các thiệt hại phát
                sinh do lỗi thiết bị sẵn có trên xe, hư hỏng tồn tại trước khi
                sử dụng dịch vụ, hoặc do khách hàng cung cấp sai thông tin.
                Trong phạm vi pháp luật cho phép, trách nhiệm bồi thường của
                AutoWash Pro (nếu có) giới hạn ở giá trị dịch vụ đã thanh
                toán cho lượt đặt lịch liên quan.
              </p>
            </section>

            <section id="chuong-trinh-hoi-vien">
              <h2>9. Chương trình hội viên & khuyến mãi</h2>
              <p>
                Điểm thưởng, mã giảm giá và quyền lợi hội viên chỉ có giá trị
                sử dụng trong thời hạn quy định và không được quy đổi thành
                tiền mặt trừ khi có thông báo khác từ AutoWash Pro. Chúng tôi
                có quyền điều chỉnh điều kiện chương trình hội viên và sẽ
                thông báo trước cho khách hàng.
              </p>
            </section>

            <section id="so-huu-tri-tue">
              <h2>10. Sở hữu trí tuệ</h2>
              <p>
                Toàn bộ thương hiệu, logo, giao diện, mã nguồn và nội dung
                trên nền tảng AutoWash Pro thuộc quyền sở hữu của chúng tôi
                hoặc các bên cấp phép liên quan. Nghiêm cấm sao chép, phân
                phối lại dưới bất kỳ hình thức nào khi chưa có sự đồng ý bằng
                văn bản.
              </p>
            </section>

            <section id="cham-dut">
              <h2>11. Tạm ngưng và chấm dứt tài khoản</h2>
              <p>
                AutoWash Pro có quyền tạm ngưng hoặc chấm dứt tài khoản vi
                phạm Điều khoản này, có hành vi gian lận, gây ảnh hưởng đến hệ
                thống hoặc người dùng khác. Khách hàng cũng có quyền yêu cầu
                đóng tài khoản bất kỳ lúc nào thông qua mục Hồ sơ hoặc liên hệ
                bộ phận hỗ trợ.
              </p>
            </section>

            <section id="thay-doi-dieu-khoan">
              <h2>12. Thay đổi điều khoản</h2>
              <p>
                Chúng tôi có thể cập nhật Điều khoản dịch vụ theo thời gian.
                Phiên bản mới sẽ được đăng tải tại trang này kèm ngày cập
                nhật; việc bạn tiếp tục sử dụng Dịch vụ sau khi thay đổi có
                hiệu lực đồng nghĩa với việc bạn chấp nhận các thay đổi đó.
              </p>
            </section>

            <section id="luat-ap-dung">
              <h2>13. Luật áp dụng</h2>
              <p>
                Điều khoản này được điều chỉnh và giải thích theo pháp luật
                Việt Nam. Mọi tranh chấp phát sinh sẽ được ưu tiên giải quyết
                thông qua thương lượng; nếu không đạt được thỏa thuận, tranh
                chấp sẽ được đưa ra cơ quan có thẩm quyền giải quyết theo quy
                định pháp luật.
              </p>
            </section>

            <section id="lien-he-terms">
              <h2>14. Liên hệ</h2>
              <p>
                Nếu bạn có câu hỏi liên quan đến Điều khoản dịch vụ này, vui
                lòng liên hệ:
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
    </div>
  );
}

export default TermsOfServicePage;