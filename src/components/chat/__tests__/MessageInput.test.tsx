import { test, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageInput } from "../MessageInput";

afterEach(() => {
  cleanup();
});

test("renders with placeholder text", () => {
  const mockProps = {
    input: "",
    setInput: vi.fn(),
    sendMessage: vi.fn(),
    isLoading: false,
  };

  render(<MessageInput {...mockProps} />);

  const textarea = screen.getByPlaceholderText("Describe the React component you want to create...");
  expect(textarea).toBeDefined();
});

test("displays the input value", () => {
  const mockProps = {
    input: "Test input value",
    setInput: vi.fn(),
    sendMessage: vi.fn(),
    isLoading: false,
  };

  render(<MessageInput {...mockProps} />);

  const textarea = screen.getByDisplayValue("Test input value");
  expect(textarea).toBeDefined();
});

test("calls setInput when typing", async () => {
  const setInput = vi.fn();
  const mockProps = {
    input: "",
    setInput,
    sendMessage: vi.fn(),
    isLoading: false,
  };

  render(<MessageInput {...mockProps} />);

  const textarea = screen.getByPlaceholderText("Describe the React component you want to create...");
  await userEvent.type(textarea, "Hello");

  expect(setInput).toHaveBeenCalled();
});

test("calls sendMessage when button is clicked", async () => {
  const sendMessage = vi.fn();
  const mockProps = {
    input: "Test input",
    setInput: vi.fn(),
    sendMessage,
    isLoading: false,
  };

  render(<MessageInput {...mockProps} />);

  const submitButton = screen.getByRole("button");
  await userEvent.click(submitButton);

  expect(sendMessage).toHaveBeenCalledWith("Test input");
});

test("calls sendMessage when Enter is pressed without shift", async () => {
  const sendMessage = vi.fn();
  const mockProps = {
    input: "Test input",
    setInput: vi.fn(),
    sendMessage,
    isLoading: false,
  };

  render(<MessageInput {...mockProps} />);

  const textarea = screen.getByRole("textbox");
  fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

  expect(sendMessage).toHaveBeenCalledWith("Test input");
});

test("does not call sendMessage when Enter is pressed with shift", async () => {
  const sendMessage = vi.fn();
  const mockProps = {
    input: "Test input",
    setInput: vi.fn(),
    sendMessage,
    isLoading: false,
  };

  render(<MessageInput {...mockProps} />);

  const textarea = screen.getByRole("textbox");
  fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

  expect(sendMessage).not.toHaveBeenCalled();
});

test("disables textarea when isLoading is true", () => {
  const mockProps = {
    input: "",
    setInput: vi.fn(),
    sendMessage: vi.fn(),
    isLoading: true,
  };

  render(<MessageInput {...mockProps} />);

  const textarea = screen.getByRole("textbox");
  expect(textarea).toHaveProperty("disabled", true);
});

test("disables submit button when isLoading is true", () => {
  const mockProps = {
    input: "Test input",
    setInput: vi.fn(),
    sendMessage: vi.fn(),
    isLoading: true,
  };

  render(<MessageInput {...mockProps} />);

  const submitButton = screen.getByRole("button");
  expect(submitButton).toHaveProperty("disabled", true);
});

test("disables submit button when input is empty", () => {
  const mockProps = {
    input: "",
    setInput: vi.fn(),
    sendMessage: vi.fn(),
    isLoading: false,
  };

  render(<MessageInput {...mockProps} />);

  const submitButton = screen.getByRole("button");
  expect(submitButton).toHaveProperty("disabled", true);
});

test("disables submit button when input contains only whitespace", () => {
  const mockProps = {
    input: "   ",
    setInput: vi.fn(),
    sendMessage: vi.fn(),
    isLoading: false,
  };

  render(<MessageInput {...mockProps} />);

  const submitButton = screen.getByRole("button");
  expect(submitButton).toHaveProperty("disabled", true);
});

test("enables submit button when input has content and not loading", () => {
  const mockProps = {
    input: "Valid content",
    setInput: vi.fn(),
    sendMessage: vi.fn(),
    isLoading: false,
  };

  render(<MessageInput {...mockProps} />);

  const submitButton = screen.getByRole("button");
  expect(submitButton).toHaveProperty("disabled", false);
});

test("applies correct CSS classes based on loading state", () => {
  const { rerender } = render(
    <MessageInput
      input="Test"
      setInput={vi.fn()}
      sendMessage={vi.fn()}
      isLoading={false}
    />
  );

  let submitButton = screen.getByRole("button");
  expect(submitButton.className).toContain("disabled:opacity-40");
  expect(submitButton.className).toContain("hover:bg-blue-50");

  rerender(
    <MessageInput
      input="Test"
      setInput={vi.fn()}
      sendMessage={vi.fn()}
      isLoading={true}
    />
  );

  submitButton = screen.getByRole("button");
  expect(submitButton.className).toContain("disabled:cursor-not-allowed");
  expect(submitButton.className).toContain("disabled:opacity-40");
});

test("applies correct color to send icon based on state", () => {
  const { rerender } = render(
    <MessageInput
      input="Test"
      setInput={vi.fn()}
      sendMessage={vi.fn()}
      isLoading={false}
    />
  );

  let sendIcon = screen.getByRole("button").querySelector("svg");
  expect(sendIcon?.getAttribute("class")).not.toContain("text-neutral-300");

  rerender(
    <MessageInput
      input="Test"
      setInput={vi.fn()}
      sendMessage={vi.fn()}
      isLoading={true}
    />
  );

  sendIcon = screen.getByRole("button").querySelector("svg");
  expect(sendIcon?.getAttribute("class")).toContain("text-neutral-300");
});

test("textarea has correct styling classes", () => {
  const mockProps = {
    input: "",
    setInput: vi.fn(),
    sendMessage: vi.fn(),
    isLoading: false,
  };

  render(<MessageInput {...mockProps} />);

  const textarea = screen.getByRole("textbox");
  expect(textarea.className).toContain("min-h-[80px]");
  expect(textarea.className).toContain("max-h-[200px]");
  expect(textarea.className).toContain("resize-none");
  expect(textarea.className).toContain("focus:ring-2");
  expect(textarea.className).toContain("focus:ring-blue-500/10");
});
