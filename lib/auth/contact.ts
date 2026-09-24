export const contactMessages = {
  identifierRequired: "ایمیل یا شماره موبایل را وارد کنید.",
  identifierInvalid: "ایمیل یا شماره موبایل را درست وارد کنید.",
  emailInvalid: "ایمیل را درست وارد کنید.",
  phoneInvalid: "شماره موبایل ایران را درست وارد کنید."
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const iranianPhonePattern = /^(?:09\d{9}|989\d{9}|\+989\d{9})$/;
const digitMap: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9"
};

export function normalizeEmail(rawEmail: string) {
  return rawEmail.trim().toLocaleLowerCase("en-US");
}

export function isValidEmail(rawEmail: string) {
  return emailPattern.test(normalizeEmail(rawEmail));
}

export function normalizeIranianPhone(rawPhoneNumber: string) {
  const trimmed = normalizeDigits(rawPhoneNumber.trim());

  if (!iranianPhonePattern.test(trimmed)) {
    return null;
  }

  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("98")) return `+${trimmed}`;
  return `+98${trimmed.slice(1)}`;
}

export function isValidIranianPhone(rawPhoneNumber: string) {
  return normalizeIranianPhone(rawPhoneNumber) !== null;
}

export function normalizeContactIdentifier(rawIdentifier: string) {
  const trimmed = rawIdentifier.trim();

  if (trimmed.includes("@")) {
    const email = normalizeEmail(trimmed);
    return isValidEmail(email) ? email : null;
  }

  return normalizeIranianPhone(trimmed);
}

export function normalizeContactIdentifierForInput(rawIdentifier: string) {
  const trimmed = rawIdentifier.trim();
  return trimmed.includes("@") ? normalizeEmail(trimmed) : normalizeDigits(trimmed);
}

export function validateContactIdentifier(rawIdentifier: string) {
  if (!rawIdentifier.trim()) return contactMessages.identifierRequired;
  return normalizeContactIdentifier(rawIdentifier) ? null : contactMessages.identifierInvalid;
}

function normalizeDigits(value: string) {
  return Array.from(value, (character) => digitMap[character] ?? character).join("");
}
