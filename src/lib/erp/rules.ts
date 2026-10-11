export type ErpRole =
  "super_admin" | "franchise_owner" | "teacher" | "receptionist" | "parent";
export type ModuleKey =
  | "overview"
  | "admissions"
  | "fees"
  | "learning"
  | "timetable"
  | "commercial"
  | "stock"
  | "franchises"
  | "team"
  | "communications"
  | "audit"
  | "parent";

export const moduleRoles: Record<ModuleKey, ErpRole[]> = {
  overview: ["super_admin", "franchise_owner", "teacher", "receptionist"],
  admissions: ["super_admin", "franchise_owner", "receptionist"],
  fees: ["super_admin", "franchise_owner", "receptionist"],
  learning: ["super_admin", "franchise_owner", "teacher"],
  timetable: ["super_admin", "franchise_owner", "teacher", "receptionist"],
  commercial: ["super_admin", "franchise_owner"],
  stock: ["super_admin", "franchise_owner", "receptionist"],
  franchises: ["super_admin", "franchise_owner"],
  team: ["super_admin", "franchise_owner"],
  communications: ["super_admin", "franchise_owner", "receptionist"],
  audit: ["super_admin", "franchise_owner"],
  parent: ["parent"],
};

export function mayAccess(role: ErpRole | null, module: ModuleKey): boolean {
  return Boolean(role && moduleRoles[module].includes(role));
}

// Parse decimal input as an integer number of paise, without floating-point multiplication.
export function rupeesToPaise(value: string): number {
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(value.trim()))
    throw new Error("Enter a positive amount with at most two decimal places.");
  const [whole, fraction = ""] = value.trim().split(".");
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(paise) || paise <= 0)
    throw new Error("Amount must be greater than zero.");
  return paise;
}

export function money(paise: number | string): string {
  const amount = Number(paise);
  if (!Number.isSafeInteger(amount)) return "Unavailable";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount / 100);
}

export function installmentAmounts(total: number, count: number): number[] {
  if (
    !Number.isSafeInteger(total) ||
    total <= 0 ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 24 ||
    total < count
  )
    throw new Error("Invalid instalment plan.");
  const base = Math.floor(total / count);
  return Array.from(
    { length: count },
    (_, i) => base + (i < total % count ? 1 : 0),
  );
}

export function invoiceBalance(
  invoice: { amount_paise: number; discount_paise?: number },
  payments: { amount_paise: number }[],
): number {
  return (
    Number(invoice.amount_paise) -
    Number(invoice.discount_paise || 0) -
    payments.reduce((sum, p) => sum + Number(p.amount_paise), 0)
  );
}

export function localDate(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return (
    Date.parse(aStart) < Date.parse(bEnd) &&
    Date.parse(bStart) < Date.parse(aEnd)
  );
}

export function safeCheckoutUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
