import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import TextInput from "./TextInput";
import TextArea from "./TextArea";

describe("TextInput", () => {
  test("defaults to type='text'", () => {
    render(<TextInput id="name" name="name" value="" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");
  });

  test("uses the given type", () => {
    render(<TextInput id="email" name="email" type="email" value="" onChange={() => {}} />);
    expect(document.getElementById("email")).toHaveAttribute("type", "email");
  });

  test("reflects the required prop", () => {
    render(<TextInput id="name" name="name" value="" onChange={() => {}} required />);
    expect(screen.getByRole("textbox")).toBeRequired();
  });

  test("fires onChange when typed into", async () => {
    const handleChange = vi.fn();
    render(<TextInput id="name" name="name" value="" onChange={handleChange} />);
    await userEvent.type(screen.getByRole("textbox"), "A");
    expect(handleChange).toHaveBeenCalled();
  });
});

describe("TextArea", () => {
  test("renders a textarea element", () => {
    render(<TextArea id="message" name="message" value="" onChange={() => {}} />);
    expect(screen.getByRole("textbox").tagName).toBe("TEXTAREA");
  });

  test("reflects the required prop", () => {
    render(<TextArea id="message" name="message" value="" onChange={() => {}} required />);
    expect(screen.getByRole("textbox")).toBeRequired();
  });

  test("fires onChange when typed into", async () => {
    const handleChange = vi.fn();
    render(<TextArea id="message" name="message" value="" onChange={handleChange} />);
    await userEvent.type(screen.getByRole("textbox"), "A");
    expect(handleChange).toHaveBeenCalled();
  });
});
