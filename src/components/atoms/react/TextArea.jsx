import "./FormControls.module.css";

export default function TextArea({ id, name, value, onChange, required = false }) {
  return (
    <textarea
      id={id}
      name={name}
      onChange={onChange}
      value={value}
      required={required}
    ></textarea>
  );
}
