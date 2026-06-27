# Đặc tả chuyển động Logo AutoWash Pro (Motion Specification)

Đặc tả này thiết lập các thông số chuyển động cho logo của **AutoWash Pro** theo các nguyên lý chuyển động của Disney, đảm bảo tính công nghệ, mượt mà và cảm giác sạch sẽ của nước.

## 1. Tính cách thương hiệu (Motion Personality)
- **Swift (Nhanh nhẹn)**: Thể hiện sự nhanh chóng và tự động hóa trong dịch vụ rửa xe thông minh.
- **Precise (Chính xác)**: Các chuyển động dừng lại chuẩn xác tại khung hình tĩnh thiết kế (Final Frame Contract).
- **Fluid (Mượt mà/Linh hoạt)**: Sự đàn hồi, biến dạng và chuyển động lấy cảm hứng từ giọt nước và sóng nước.

## 2. Các nhóm phần tử chuyển động (Actors)
1. **Swoosh Wave (Sóng nước Cyan)**: `swoosh-main` và `swoosh-accent`
2. **Water Drop (Giọt nước nền)**: `water-drop` và `water-drop-highlight`
3. **Car Body (Khung xe)**: `car-body` và `car-windows`
4. **Wheels (Bánh xe)**: `wheel-rear` và `wheel-front`

## 3. Trục thời gian chuyển động (Timeline Table)

Tổng thời gian hiệu ứng xuất hiện (Reveal Intro): **1800ms**

| Actor | Thời gian | Hiệu ứng (Transition) | Easing (Cubic-Bezier) | Mô tả nguyên lý Disney |
| :--- | :--- | :--- | :--- | :--- |
| **Swoosh Wave** | 0ms - 800ms | Draw-on & Spin-in (Xoay và vẽ dần ra) | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | **Anticipation & Overshoot**: Vòng cung vút vào mạnh mẽ rồi dừng hơi quá đà trước khi ổn định. |
| **Water Drop** | 400ms - 1100ms | Drop & Squash (Rơi từ trên xuống và đàn hồi) | Rơi: `cubic-bezier(0.6, -0.28, 0.735, 0.045)` <br> Đàn hồi: `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | **Squash & Stretch**: Giọt nước rơi xuống va chạm, dẹt ra rồi co giãn trở lại hình dáng cũ. |
| **Car Body** | 700ms - 1400ms | Slide-in (Trượt từ trái sang) | `cubic-bezier(0.25, 1, 0.5, 1)` | **Slow In & Slow Out**: Xe trượt nhanh vào từ ngoài khung hình và phanh mượt mà tại tâm. |
| **Wheels** | 700ms - 1400ms | Spin & Roll (Xoay tròn đồng bộ xe) | `cubic-bezier(0.25, 1, 0.5, 1)` | **Follow Through**: Bánh xe quay khớp với vận tốc xe trượt vào. |
| **Highlights** | 1200ms - 1800ms | Sheen & Fade-in (Bừng sáng/Quét bóng bóng) | `ease-out` | **Appeal**: Ánh sáng phản chiếu lướt qua xe và giọt nước tạo độ cao cấp. |

## 4. Các Tokens Easing CSS
```css
--ease-overshoot: cubic-bezier(0.175, 0.885, 0.32, 1.275);
--ease-slide-out: cubic-bezier(0.25, 1, 0.5, 1);
--ease-drop-in: cubic-bezier(0.6, -0.28, 0.735, 0.045);
```
