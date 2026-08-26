import styles from "./FormField.module.css";
import TextInput from "../../atoms/react/TextInput";
import TextArea from "../../atoms/react/TextArea";

export default function FormField({
  as = "input",
  type = "text",
  id,
  name,
  label,
  icon,
  value,
  onChange,
  required = false,
  errorMessage,
}) {
  const Field = as === "textarea" ? TextArea : TextInput;

  return (
    <div className={styles.formGroup}>
      <label htmlFor={id}>
        {icon && <span className="icon">{icon}</span>}
        {label}
      </label>
      <Field
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
      />
      <span className={styles.errorMessage}>{errorMessage}</span>
    </div>
  );
}
