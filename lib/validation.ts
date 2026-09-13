// Saudi mobile: 05XXXXXXXX locally, or +9665XXXXXXXX / 9665XXXXXXXX internationally.
export const PHONE_REGEX = /^(?:\+?966|0)5[0-9]{8}$/;

export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone.replace(/\s/g, ""));
}

export function formatPhoneHint(): string {
  return "Format: 05X XXX XXXX";
}
