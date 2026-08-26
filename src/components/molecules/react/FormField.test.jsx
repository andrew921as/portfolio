import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import FormField from "./FormField";

describe("FormField", () => {
  test("renders an <input> by default", () => {
    render(<FormField id="name" name="name" label="Name" value="" onChange={() => {}} />);
    expect(screen.getByLabelText("Name").tagName).toBe("INPUT");
  });

  test("renders a <textarea> when as='textarea'", () => {
    render(
      <FormField
        as="textarea"
        id="message"
        name="message"
        label="Message"
        value=""
        onChange={() => {}}
      />
    );
    expect(screen.getByLabelText("Message").tagName).toBe("TEXTAREA");
  });

  test("does not render an icon span when icon is not provided", () => {
    render(<FormField id="name" name="name" label="Name" value="" onChange={() => {}} />);
    expect(screen.queryByText("✉️")).not.toBeInTheDocument();
  });

  test("renders the icon before the label text when provided", () => {
    render(
      <FormField
        id="email"
        name="email"
        type="email"
        label="E-mail"
        icon="✉️"
        value=""
        onChange={() => {}}
      />
    );
    expect(screen.getByText("✉️")).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/)).toBeInTheDocument();
  });

  test("renders the errorMessage text", () => {
    render(
      <FormField
        id="name"
        name="name"
        label="Name"
        value=""
        onChange={() => {}}
        errorMessage="The text field is required."
      />
    );
    expect(screen.getByText("The text field is required.")).toBeInTheDocument();
  });

  test("propagates onChange from the underlying field", async () => {
    const handleChange = vi.fn();
    render(<FormField id="name" name="name" label="Name" value="" onChange={handleChange} />);
    await userEvent.type(screen.getByLabelText("Name"), "A");
    expect(handleChange).toHaveBeenCalled();
  });
});
