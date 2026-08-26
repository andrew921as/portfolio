import "./FormControls.module.css";

export default function TextInput({
  id,
  name,
  type = "text",
  value,
  onChange,
  required = false,
}) {
  return (
    <input
      type={type}
      id={id}
      name={name}
      onChange={onChange}
      value={value}
      required={required}
    />
  );
}
