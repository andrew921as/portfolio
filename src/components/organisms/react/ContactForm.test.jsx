import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import emailjs from "@emailjs/browser";
import ContactForm from "./ContactForm";

vi.mock("@emailjs/browser", () => ({
  default: {
    init: vi.fn(),
    send: vi.fn(),
  },
}));

async function fillRequiredFields(user) {
  await user.type(screen.getByLabelText("Name"), "Ada Lovelace");
  await user.type(screen.getByLabelText(/E-mail/), "ada@example.com");
  await user.type(screen.getByLabelText(/Message/), "Hello there");
}

describe("ContactForm", () => {
  beforeEach(() => {
    vi.mocked(emailjs.init).mockClear();
    vi.mocked(emailjs.send).mockReset();
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("initializes emailjs on render", () => {
    render(<ContactForm />);
    expect(emailjs.init).toHaveBeenCalled();
  });

  test("submits the current field values to emailjs.send", async () => {
    vi.mocked(emailjs.send).mockResolvedValue({ status: 200, text: "OK" });
    const user = userEvent.setup();
    render(<ContactForm />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "SEND" }));

    expect(emailjs.send).toHaveBeenCalledTimes(1);
    const [, , values] = vi.mocked(emailjs.send).mock.calls[0];
    expect(values).toMatchObject({
      name: "Ada Lovelace",
      email: "ada@example.com",
      message: "Hello there",
    });
  });

  test("resets the form and alerts on a successful send", async () => {
    vi.mocked(emailjs.send).mockResolvedValue({ status: 200, text: "OK" });
    const user = userEvent.setup();
    render(<ContactForm />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "SEND" }));

    await vi.waitFor(() => expect(window.alert).toHaveBeenCalled());
    await vi.waitFor(() => expect(screen.getByLabelText("Name")).toHaveValue(""));
    expect(screen.getByLabelText(/E-mail/)).toHaveValue("");
  });

  test("keeps the entered values and logs the error when send fails", async () => {
    vi.mocked(emailjs.send).mockRejectedValue(new Error("network error"));
    const user = userEvent.setup();
    render(<ContactForm />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "SEND" }));

    await vi.waitFor(() => expect(console.log).toHaveBeenCalledWith("FAILED...", expect.any(Error)));
    expect(window.alert).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Name")).toHaveValue("Ada Lovelace");
  });
});
