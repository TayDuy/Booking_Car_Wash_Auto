import { initializeApp} from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    //Mã nhận dạng ứng dụng
  apiKey: "AIzaSyCVMlFjRXohRFSgE28cqjtPsQ7bdwUvwRk",
    //Domain xử lý đăng nhập Google
  authDomain: "autowash-pro-9220c.firebaseapp.com",
    //ID dự án Firebase
  projectId: "autowash-pro-9220c",
    //Dùng lưu ảnh: avatar khách hàng, ảnh xe, ảnh hoá đơn...
  storageBucket: "autowash-pro-9220c.firebasestorage.app",
    //Dùng cho notification, gửi thông báo đẩy đến khách hàng
  messagingSenderId: "459502234828",
    //ID riêng của Web App, dùng để phân biệt với các nền tảng khác như iOS, Android
  appId: "1:459502234828:web:9acc3c23355df9974ba669"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();