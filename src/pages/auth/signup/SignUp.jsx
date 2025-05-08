import { useState } from "react";
import { EyeInvisibleFilled, EyeFilled, CheckCircleFilled } from "@ant-design/icons";
import { message } from "antd";
import ImageCarousel from "../../../components/ImageCarousel/ImageCarousel";
import styles from "./Signup.module.scss";
import { useCreateUserMutation } from "../../../redux/services/userApi";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    doB: "",
    roleID: "67f87ca3c19b91da666bbdc7",
  });
  const navigate = useNavigate();
  const [createUser, { isLoading }] = useCreateUserMutation();
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasSpecialChar: false,
    level: "weak"
  });

  const validateEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  const validatePhone = (phone) => /^\d{10}$/.test(phone);
  const validateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return (
      age > 18 ||
      (age === 18 &&
        today >= new Date(birthDate.setFullYear(today.getFullYear())))
    );
  };

  const calculatePasswordStrength = (password) => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const strength = [hasMinLength, hasUpperCase, hasLowerCase, hasSpecialChar].filter(Boolean).length;
    let level = "weak";
    if (strength <= 1) level = "weak";
    else if (strength <= 3) level = "medium";
    else level = "strong";

    setPasswordStrength({
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasSpecialChar,
      level
    });
  };

  const validatePassword = (password) => {
    return passwordStrength.hasMinLength && 
           passwordStrength.hasUpperCase && 
           passwordStrength.hasLowerCase && 
           passwordStrength.hasSpecialChar;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === "password") {
      calculatePasswordStrength(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(formData.email))
      return message.error("Email không hợp lệ!");
    if (!validatePhone(formData.phone))
      return message.error("Số điện thoại phải có 10 số!");
    if (!validateAge(formData.doB))
      return message.error("Bạn phải từ 18 tuổi trở lên!");
    if (!validatePassword(formData.password))
      return message.error("Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa, 1 chữ thường và 1 ký tự đặc biệt!");
    if (formData.password !== formData.confirmPassword)
      return message.error("Mật khẩu nhập lại không khớp!");
    if (!acceptTerms)
      return message.error(
        "Bạn phải chấp nhận Điều khoản dịch vụ và Chính sách quyền riêng tư!"
      );

    try {
      const response = await createUser({
        ...formData,
        email: formData.email.toLowerCase().trim(),
        avatarUrl: [],
      }).unwrap();
      message.success("Đăng ký thành công!");
      console.log(response);
      navigate("/login");
    } catch (error) {
      message.error(error.data?.message || "Đăng ký thất bại!");
    }
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupCarousel}>
        <ImageCarousel
          images={[
            "src/assets/images/beach.jpg",
            "src/assets/images/lake.jpg",
            "src/assets/images/mountain.jpg",
          ]}
        />
      </div>
      <div className={styles.signupForm}>
        <div className={styles.signupContent}>
          <h1 className={styles.brand}>Mean</h1>
          <h2>Đăng ký</h2>
          <p className={styles.signupDescription}>
            Trở thành đối tác của chúng tôi
          </p>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Họ và tên</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Họ và tên"
                className={styles.formInput}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Nhập email của bạn"
                className={styles.formInput}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Số điện thoại</label>
              <input
                type="number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0987654321"
                className={styles.formInput}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Ngày sinh</label>
              <input
                type="date"
                name="doB"
                value={formData.doB}
                onChange={handleChange}
                className={styles.formInput}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Mật khẩu</label>
              <div className={styles.passwordInputWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className={styles.formInput}
                  required
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeInvisibleFilled className={styles.passwordIcon} />
                  ) : (
                    <EyeFilled className={styles.passwordIcon} />
                  )}
                </button>
              </div>
              <div className={styles.passwordStrengthContainer}>
                <div className={styles.strengthBar}>
                  <div className={`${styles.strengthFill} ${styles[passwordStrength.level]}`} />
                </div>
                <ul className={styles.requirementsList}>
                  <li className={styles.requirementItem}>
                    <CheckCircleFilled className={`${styles.checkIcon} ${passwordStrength.hasMinLength ? styles.valid : styles.invalid}`} />
                    Ít nhất 8 ký tự
                  </li>
                  <li className={styles.requirementItem}>
                    <CheckCircleFilled className={`${styles.checkIcon} ${passwordStrength.hasUpperCase ? styles.valid : styles.invalid}`} />
                    Ít nhất 1 chữ hoa
                  </li>
                  <li className={styles.requirementItem}>
                    <CheckCircleFilled className={`${styles.checkIcon} ${passwordStrength.hasLowerCase ? styles.valid : styles.invalid}`} />
                    Ít nhất 1 chữ thường
                  </li>
                  <li className={styles.requirementItem}>
                    <CheckCircleFilled className={`${styles.checkIcon} ${passwordStrength.hasSpecialChar ? styles.valid : styles.invalid}`} />
                    Ít nhất 1 ký tự đặc biệt
                  </li>
                </ul>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Nhập lại mật khẩu</label>
              <div className={styles.passwordInputWrapper}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className={styles.formInput}
                  required
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeInvisibleFilled className={styles.passwordIcon} />
                  ) : (
                    <EyeFilled className={styles.passwordIcon} />
                  )}
                </button>
              </div>
            </div>
            <div className={styles.formGroupCheckbox}>
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={() => setAcceptTerms(!acceptTerms)}
              />
              <label htmlFor="terms">
                Tôi đồng ý với{" "}
                <a href="/terms" target="_blank">
                  Điều khoản dịch vụ
                </a>{" "}
                và{" "}
                <a href="/privacy" target="_blank">
                  Chính sách quyền riêng tư
                </a>
              </label>
            </div>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
