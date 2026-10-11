import { supabase } from "@/lib/supabase";
import { resources, type Resource, type Field } from "./catalog";
import { rupeesToPaise } from "./rules";

export type Row = Record<
  string,
  string | number | boolean | string[] | null
> & { id: string };

export async function readRows(
  table: string,
  franchiseId?: string,
): Promise<Row[]> {
  const rows: Row[] = [];
  for (let offset = 0; ; offset += 500) {
    let query = supabase
      .from(table)
      .select("*")
      .order("created_at")
      .order("id")
      .range(offset, offset + 499);
    if (franchiseId) query = query.eq("franchise_id", franchiseId);
    const { data, error } = await query;
    if (error)
      throw new Error(
        `Could not load ${table.replace(/^erp_/, "").replaceAll("_", " ")}. Check account access and database setup.`,
      );
    rows.push(...((data || []) as Row[]));
    if (!data || data.length < 500) return rows;
  }
}

export function parseField(
  field: Field,
  value: string | boolean,
): string | number | boolean | null {
  if (field.type === "checkbox") return value === true;
  const text = String(value ?? "").trim();
  if (!text) {
    if (field.required) throw new Error(`${field.label} is required.`);
    return field.type === "money" ? 0 : null;
  }
  if (field.type === "money") {
    if (text === "0" || text === "0.00") return 0;
    return rupeesToPaise(text);
  }
  if (field.type === "number") {
    const number = Number(text);
    if (
      !Number.isSafeInteger(number) ||
      (field.min !== undefined && number < field.min) ||
      (field.max !== undefined && number > field.max)
    )
      throw new Error(`${field.label} is outside the allowed range.`);
    return number;
  }
  if (field.type === "datetime-local") {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text))
      throw new Error(`${field.label} is invalid.`);
    const date = new Date(`${text}:00+05:30`);
    if (Number.isNaN(date.getTime()))
      throw new Error(`${field.label} is invalid.`);
    return date.toISOString();
  }
  return text;
}

export async function saveResource(
  resource: Resource,
  values: Record<string, string | boolean>,
  franchiseId: string,
  editing?: Row,
) {
  const payload = Object.fromEntries(
    resource.fields.map((field) => [
      field.key,
      parseField(field, values[field.key]),
    ]),
  );
  if (
    resource.key === "students" &&
    payload.dob &&
    String(payload.dob) > new Date().toISOString().slice(0, 10)
  )
    throw new Error("Date of birth cannot be in the future.");
  if (resource.rpc) {
    if (resource.key === "memberships" || resource.key === "parents")
      payload.p_franchise = franchiseId;
    const { error } = await supabase.rpc(resource.rpc, payload);
    if (error) throw new Error(error.message);
    return;
  }
  let query;
  if (editing)
    query = supabase
      .from(resource.table)
      .update(payload)
      .eq("id", editing.id)
      .eq("franchise_id", franchiseId);
  else
    query = supabase
      .from(resource.table)
      .insert({ ...payload, franchise_id: franchiseId });
  const { data, error } = await query.select("id").single();
  if (error || !data)
    throw new Error(error?.message || "The record was not saved.");
}

export async function runAction(name: string, args: Record<string, unknown>) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
}

export function resourceByTable(table: string): Resource | undefined {
  return Object.values(resources).find((resource) => resource.table === table);
}

export function whatsappDraft(phone: string, message: string): string {
  if (!/^[1-9]\d{7,14}$/.test(phone))
    throw new Error(
      "Use the full international phone number, with digits only.",
    );
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function upiLink(
  settings: Row,
  invoiceId: string,
  balance: number,
): string {
  const upiId = String(settings.upi_id || "");
  if (
    !/^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+$/.test(upiId) ||
    !Number.isSafeInteger(balance) ||
    balance <= 0
  )
    throw new Error(
      "Valid payment details and a positive balance are required.",
    );
  const params = new URLSearchParams({
    pa: upiId,
    pn: String(settings.payee_name),
    am: (balance / 100).toFixed(2),
    cu: "INR",
    tn: `Skills Ville fee ${invoiceId}`,
  });
  return `upi://pay?${params.toString()}`;
}
