import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashGen {
    public static void main(String[] args) {
        if (args.length > 0) {
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            System.out.println(encoder.encode(args[0]));
        } else {
            System.out.println("Vui lòng cung cấp mật khẩu qua tham số dòng lệnh (ví dụ: java HashGen 123456)");
        }
    }
}

