import { useForm } from "@/hooks/useForm";
import * as yup from "yup";
import { describe, expect, test, vi } from "vitest";
import { fireEvent, render } from "./index";

const schema = yup.object({
  username: yup
    .string()
    .required("Username is required")
    .min(3, "Username must be at least 3 characters"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords do not match"),
});

const App = () => {
  const { form, register, handleSubmit, errors } = useForm(schema);

  const onSubmit = (data: any) => {
    console.log(data);
  };

  return (
    <form {...form} onsubmit={handleSubmit(onSubmit)}>
      <input type="text" {...register("username")} placeholder="Username" />
      <div>{errors().username}</div>
      <input type="password" {...register("password")} placeholder="Password" />
      <div>{errors().password}</div>
      <input
        type="password"
        {...register("confirmPassword")}
        placeholder="Confirm Password"
      />
      <div>{errors().confirmPassword}</div>
      <button type="submit">Sign Up</button>
    </form>
  );
};

const getFields = () => {
  const { getByPlaceholderText, findByText, getByText, queryByText } = render(
    () => <App />
  );
  const usernameInput = getByPlaceholderText("Username");
  const passwordInput = getByPlaceholderText("Password");
  const confirmPasswordInput = getByPlaceholderText("Confirm Password");
  const submitButton = getByText("Sign Up");
  return {
    usernameInput,
    passwordInput,
    confirmPasswordInput,
    submitButton,
    findByText,
    getByPlaceholderText,
    getByText,
    queryByText,
  };
};

const pause = async (ms: number) =>
  await new Promise((resolve) => setTimeout(resolve, ms));

const targetValue = (value: string) => {
  return {
    target: {
      value: value,
    },
  };
};

describe("useForm hook", () => {
  test("should submit form with correct data", async () => {
    const consoleLogSpy = vi.spyOn(console, "log");
    const { usernameInput, passwordInput, confirmPasswordInput, submitButton } =
      getFields();
    // Valid input values
    fireEvent.input(usernameInput, targetValue("Nick"));
    fireEvent.input(passwordInput, targetValue("Passwordlol123"));
    fireEvent.input(confirmPasswordInput, targetValue("Passwordlol123"));
    fireEvent.click(submitButton);
    await pause(100);
    expect(consoleLogSpy).toHaveBeenCalledWith({
      username: "Nick",
      password: "Passwordlol123",
      confirmPassword: "Passwordlol123",
    });
    consoleLogSpy.mockRestore();
  });
  test("shouldn't submit form then display error if mismatching field values", async () => {
    const consoleLogSpy = vi.spyOn(console, "log");
    const {
      usernameInput,
      passwordInput,
      confirmPasswordInput,
      submitButton,
      findByText,
    } = getFields();
    fireEvent.input(usernameInput, targetValue("Nick"));
    // Passwords do not match
    fireEvent.input(passwordInput, targetValue("Passwordlol111"));
    fireEvent.input(confirmPasswordInput, targetValue("Passwordlol222"));
    fireEvent.click(submitButton);
    expect(await findByText("Passwords do not match")).toBeTruthy();
    expect(consoleLogSpy).toHaveBeenCalledTimes(0);
  });
  test("shouldn't submit form then display error if missing field values", async () => {
    const consoleLogSpy = vi.spyOn(console, "log");
    const { passwordInput, confirmPasswordInput, submitButton, getByText } =
      getFields();
    // Username field is missing
    fireEvent.input(passwordInput, targetValue("Passwordlol123"));
    fireEvent.input(confirmPasswordInput, targetValue("Passwordlol123"));
    fireEvent.click(submitButton);
    await pause(100);
    expect(() => getByText("Username is required")).toBeTruthy();
    expect(consoleLogSpy).toBeCalledTimes(0);
  });
  test("shouldn't submit form then display error if incorrect field values", async () => {
    const consoleLogSpy = vi.spyOn(console, "log");
    const {
      usernameInput,
      passwordInput,
      confirmPasswordInput,
      submitButton,
      findByText,
    } = getFields();
    fireEvent.input(usernameInput, targetValue("Nick"));
    fireEvent.input(passwordInput, targetValue("Pass"));
    fireEvent.input(confirmPasswordInput, targetValue("Pass"));
    fireEvent.click(submitButton);
    expect(
      await findByText("Password must be at least 8 characters")
    ).toBeTruthy();
    expect(consoleLogSpy).toBeCalledTimes(0);
  });
  test("should display live validation errors as user types incorrect values", async () => {
    const { usernameInput, passwordInput, confirmPasswordInput, findByText } =
      getFields();
    // Type incorrect username
    fireEvent.input(usernameInput, targetValue("Ni"));
    expect(
      await findByText("Username must be at least 3 characters")
    ).toBeTruthy();
    // Type incorrect password
    fireEvent.input(passwordInput, targetValue("Pass"));
    expect(
      await findByText("Password must be at least 8 characters")
    ).toBeTruthy();
    // Type incorrect confirmPassword
    fireEvent.input(confirmPasswordInput, targetValue("Ssap"));
    expect(await findByText("Passwords do not match")).toBeTruthy();
  });
  test("should hide live validation errors as user corrects values", async () => {
    const {
      usernameInput,
      passwordInput,
      confirmPasswordInput,
      getByText,
      queryByText,
    } = getFields();
    // Type incorrect username
    fireEvent.input(usernameInput, targetValue("Ni"));
    await pause(300); // debounce
    expect(() =>
      getByText("Username must be at least 3 characters")
    ).toBeTruthy();
    // Type correct username
    fireEvent.input(usernameInput, targetValue("Nick"));
    await pause(300); // debounce
    expect(queryByText("Username must be at least 3 characters")).toBeNull();
    // Type incorrect password
    fireEvent.input(passwordInput, targetValue("Pass"));
    await pause(300); // debounce
    expect(() =>
      getByText("Password must be at least 8 characters")
    ).toBeTruthy();
    // Type correct password
    fireEvent.input(passwordInput, targetValue("Passwordlol123"));
    await pause(300); // debounce
    expect(queryByText("Password must be at least 8 characters")).toBeNull();
    // Type incorrect confirmPassword
    fireEvent.input(confirmPasswordInput, targetValue("Passwordlol321"));
    await pause(300); // debounce
    expect(() => getByText("Passwords do not match")).toBeTruthy();
    // Type correct confirmPassword
    fireEvent.input(confirmPasswordInput, targetValue("Passwordlol123"));
    expect(queryByText("Passwords do not match")).toBeNull();
  });
});
