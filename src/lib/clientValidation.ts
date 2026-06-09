export type ClientRegistrationInput = {
  name: string;
  email: string;
  emailConfirm: string;
  phone: string;
  idNumber: string;
  password: string;
  passwordConfirm: string;
};

export type ClientRegistrationErrors = Partial<
  Record<keyof ClientRegistrationInput | "form", string>
>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const normalizePhone = (value: string) =>
  value
    .trim()
    .replace(/[^\d+]/g, "")
    .replace(/(?!^)\+/g, "");

export const normalizeIdNumber = (value: string) => value.replace(/\D/g, "");

const isStrongPassword = (value: string) =>
  value.length >= 8 && /[a-zA-Z]/.test(value) && /\d/.test(value);

const cuitCheckDigit = (digits: string) => {
  if (digits.length !== 11) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const numbers = digits.split("").map((n) => Number(n));
  const sum = weights.reduce((acc, weight, idx) => acc + weight * numbers[idx], 0);
  const mod = 11 - (sum % 11);
  const expected = mod === 11 ? 0 : mod === 10 ? 9 : mod;
  return numbers[10] === expected;
};

const validateIdNumber = (value: string) => {
  const digits = normalizeIdNumber(value);
  if (!digits) return "Ingresá DNI, CUIL o CUIT.";
  if (digits.length === 8) return "";
  if (digits.length === 11) {
    return cuitCheckDigit(digits) ? "" : "El CUIL/CUIT no es válido.";
  }
  return "Usá 8 dígitos para DNI u 11 para CUIL/CUIT.";
};

export const validateClientRegistration = (
  input: ClientRegistrationInput
): ClientRegistrationErrors => {
  const errors: ClientRegistrationErrors = {};
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const emailConfirm = normalizeEmail(input.emailConfirm);
  const phone = normalizePhone(input.phone);
  const password = input.password.trim();
  const passwordConfirm = input.passwordConfirm.trim();

  if (name.split(/\s+/).filter(Boolean).length < 2) {
    errors.name = "Ingresá nombre y apellido.";
  }
  if (!emailPattern.test(email)) {
    errors.email = "Ingresá un email válido.";
  }
  if (email && emailConfirm && email !== emailConfirm) {
    errors.emailConfirm = "Los emails no coinciden.";
  }
  if (!emailConfirm) {
    errors.emailConfirm = "Confirmá tu email.";
  }
  if (phone.replace(/\D/g, "").length < 8) {
    errors.phone = "Ingresá un teléfono con código de área.";
  }
  const idError = validateIdNumber(input.idNumber);
  if (idError) errors.idNumber = idError;
  if (!isStrongPassword(password)) {
    errors.password = "Usá al menos 8 caracteres con letras y números.";
  }
  if (password && passwordConfirm && password !== passwordConfirm) {
    errors.passwordConfirm = "Las contraseñas no coinciden.";
  }
  if (!passwordConfirm) {
    errors.passwordConfirm = "Confirmá tu contraseña.";
  }

  return errors;
};

export const hasClientRegistrationErrors = (errors: ClientRegistrationErrors) =>
  Object.values(errors).some(Boolean);
