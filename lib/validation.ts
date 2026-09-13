export const PHONE_REGEX = /^0[5-7][0-9]{8}$/;

export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone.replace(/\s/g, ""));
}

export function formatPhoneHint(): string {
  return "Format: 05/06/07 XX XX XX XX";
}
