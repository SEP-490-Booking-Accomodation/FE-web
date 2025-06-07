import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LeftOutlined } from "@ant-design/icons";
import { Button, notification } from "antd";
import ImageCarousel from "../../../components/ImageCarousel/ImageCarousel";
import { useForgetPasswordTokenMutation } from "../../../redux/services/authApi";
import styles from "./ForgotPassword.module.scss";

const images = [
  "src/assets/images/beach.jpg",
  "src/assets/images/lake.jpg",
  "src/assets/images/mountain.jpg",
];

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const [forgetPasswordToken, { isLoading }] = useForgetPasswordTokenMutation();

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        const result = await forgetPasswordToken({ email }).unwrap();
        if (result) {
          notification.success({
            message: "Vui lòng kiểm tra hộp thư email",
            // description: "Chào mừng bạn đến với Mean!",
          });
          navigate("/login");
        }
      } catch (err) {
        notification.error({
          message: "Đăng nhập thất bại",
          // description: err.message || "Vui lòng kiểm tra lại email.",
          description: err.data.message || "Vui lòng kiểm tra lại email.",
        });
      }
    },
    [email, forgetPasswordToken, navigate]
  );

  return (
    <div className={styles["forgotpw-container"]}>
      <div className={styles["forgotpw-form"]}>
        <div className={styles["forgotpw-content"]}>
          <h1 className={styles.brand}>Mean</h1>
          <Link to="/" className={styles["back-link"]}>
            <LeftOutlined /> Đăng nhập
          </Link>
          <h2>Quên mật khẩu</h2>
          <p className={styles["forgotpw-description"]}>
            Đừng lo lắng, điều này xảy ra với tất cả chúng ta. Nhập email của
            bạn bên dưới để khôi phục mật khẩu.
          </p>
          <form onSubmit={handleSubmit}>
            <div className={styles["form-group"]}>
              <label>Email</label>
              <input
                type="email"
                value={email}
                placeholder="Nhập email của bạn"
                className={styles["form-input"]}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button
              type="primary"
              htmlType="submit"
              className={styles["submit-btn"]}
              loading={isLoading}
            >
              Xác nhận
            </Button>
          </form>
          <div className={styles.copyright}>Copyright © Mean 2025</div>
        </div>
      </div>
      <div className={styles["forgotpw-carousel"]}>
        <ImageCarousel images={images} />
      </div>
    </div>
  );
};

export default ForgotPassword;
