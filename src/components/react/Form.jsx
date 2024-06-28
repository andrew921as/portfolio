import styles from "./Form.module.css";
import { useFormik } from "formik";
import emailjs from "@emailjs/browser";

export default function Form() {
  emailjs.init({
    publicKey: 'REACT_APP_EMAIL_KEY',
    // Do not allow headless browsers
    blockHeadless: true,
    blockList: {
      // Block the suspended emails
      list: ['foo@emailjs.com', 'bar@emailjs.com'],
      // The variable contains the email address
      watchVariable: 'userEmail',
    },
    limitRate: {
      // Set the limit rate for the application
      id: 'app',
      // Allow 1 request per 10s
      throttle: 10000,
    },
  });
  
  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
    onSubmit: (values) => {
      alert(JSON.stringify(values, null, 2));
      emailjs.send('REACT_APP_SERVICE_ID', 'REACT_APP_TEMPLATE_ID', values).then(
        (response) => {
          console.log('SUCCESS!', response.status, response.text);
        },
        (error) => {
          console.log('FAILED...', error);
        },
      );
    },
  });

  return (
    <form id="contactForm" onSubmit={formik.handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="name"> Name </label>
        <input
          type="text"
          id="name"
          name="name"
          onChange={formik.handleChange}
          value={formik.values.name}
          required
        />
        <span className={styles.errorMessage}>The text field is required.</span>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="email">
          <span className="icon">✉️</span>
          E-mail
        </label>
        <input
          type="email"
          id="email"
          name="email"
          onChange={formik.handleChange}
          value={formik.values.email}
          required
        />
        <span className={styles.errorMessage}>The text field is required.</span>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="phone">
          <span className="icon">📞</span>
          Phone
        </label>
        <input
          type="text"
          id="phone"
          name="phone"
          onChange={formik.handleChange}
          value={formik.values.phone}
        />
        <span className={styles.errorMessage}>Only numbers are required.</span>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="message">
          <span className="icon">💬</span>
          Message
        </label>
        <textarea
          id="message"
          name="message"
          onChange={formik.handleChange}
          value={formik.values.message}
          required
        ></textarea>
        <span className={styles.errorMessage}>The text field is required.</span>
      </div>
      <button type="submit">SEND</button>
    </form>
  );
}
