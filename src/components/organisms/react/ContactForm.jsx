import "./ContactForm.module.css";
import { useFormik } from "formik";
import emailjs from "@emailjs/browser";
import FormField from "../../molecules/react/FormField";
import SubmitButton from "../../atoms/react/SubmitButton";

export default function ContactForm() {
  const emailKey = import.meta.env.PUBLIC_EMAIL_KEY;
  const emailServiceId = import.meta.env.PUBLIC_SERVICE_ID;
  const emailTemplateId = import.meta.env.PUBLIC_TEMPLATE_ID;
  emailjs.init({
    publicKey: emailKey,
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
    onSubmit: (values, { resetForm }) => {
      emailjs.send(emailServiceId, emailTemplateId, values).then(
        (response) => {
          alert('SUCCESS!', response.status, response.text);
          resetForm();
        },
        (error) => {
          console.log('FAILED...', error);
        },
      );
    },
  });

  return (
    <form id="contactForm" onSubmit={formik.handleSubmit}>
      <FormField
        id="name"
        name="name"
        label="Name"
        value={formik.values.name}
        onChange={formik.handleChange}
        required
        errorMessage="The text field is required."
      />
      <FormField
        id="email"
        name="email"
        type="email"
        label="E-mail"
        icon="✉️"
        value={formik.values.email}
        onChange={formik.handleChange}
        required
        errorMessage="The text field is required."
      />
      <FormField
        id="phone"
        name="phone"
        label="Phone"
        icon="📞"
        value={formik.values.phone}
        onChange={formik.handleChange}
        errorMessage="Only numbers are required."
      />
      <FormField
        as="textarea"
        id="message"
        name="message"
        label="Message"
        icon="💬"
        value={formik.values.message}
        onChange={formik.handleChange}
        required
        errorMessage="The text field is required."
      />
      <SubmitButton>SEND</SubmitButton>
    </form>
  );
}
