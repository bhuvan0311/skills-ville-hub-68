import { localDate } from "../src/lib/erp/rules";
import { previewRole } from "./auth-fixture";
export { parseField, upiLink, whatsappDraft } from "../src/lib/erp/api";
export type { Row } from "../src/lib/erp/api";
const date = localDate();
const fixture: Record<string, Record<string, unknown>[]> = {
  franchises: [
    {
      id: "centre-a",
      name: "Skills Ville · Sample Centre",
      city: "Preview",
      is_active: true,
      created_at: date,
    },
  ],
  students: [
    {
      id: "student-1",
      franchise_id: "centre-a",
      full_name: "Sample Student A",
      level: 1,
      status: "ACTIVE",
      batch_id: "batch-1",
      parent_name: "Sample Parent A",
      parent_phone: "919999999999",
    },
    {
      id: "student-2",
      franchise_id: "centre-a",
      full_name: "Sample Student B",
      level: 2,
      status: "ACTIVE",
      batch_id: "batch-2",
      parent_name: "Sample Parent B",
      parent_phone: "918888888888",
    },
    {
      id: "student-3",
      franchise_id: "centre-a",
      full_name: "Sample Student C",
      level: 1,
      status: "PENDING",
    },
  ],
  batches: [
    {
      id: "batch-1",
      franchise_id: "centre-a",
      name: "Sample · Level 1 Morning",
      level: 1,
      max_students: 15,
      is_active: true,
    },
    {
      id: "batch-2",
      franchise_id: "centre-a",
      name: "Sample · Level 2 Evening",
      level: 2,
      max_students: 12,
      is_active: true,
    },
  ],
  erp_memberships: [
    {
      id: "member-1",
      user_id: "teacher-1",
      display_name: "Sample Teacher",
      role: "teacher",
      active: true,
    },
    {
      id: "member-2",
      user_id: "parent-1",
      display_name: "Sample Parent",
      role: "parent",
      active: true,
    },
  ],
  erp_class_sessions: Array.from({ length: 12 }, (_, i) => ({
    id: `session-${i + 1}`,
    franchise_id: "centre-a",
    batch_id: "batch-1",
    teacher_user_id: "teacher-1",
    level: 1,
    room: "Sample Room A",
    starts_at: `2026-09-${String(i + 1).padStart(2, "0")}T04:30:00Z`,
    ends_at: `2026-09-${String(i + 1).padStart(2, "0")}T05:30:00Z`,
    status: "COMPLETED",
  })).concat([
    {
      id: "session-today",
      franchise_id: "centre-a",
      batch_id: "batch-2",
      teacher_user_id: "teacher-1",
      level: 2,
      room: "Sample Room B",
      starts_at: `${date}T10:00:00Z`,
      ends_at: `${date}T11:00:00Z`,
      status: "SCHEDULED",
    },
  ]),
  erp_attendance: Array.from({ length: 12 }, (_, i) => ({
    id: `attendance-${i + 1}`,
    franchise_id: "centre-a",
    session_id: `session-${i + 1}`,
    student_id: "student-1",
    level: 1,
    present: true,
    created_at: date,
  })),
  erp_leads: [
    {
      id: "lead-1",
      franchise_id: "centre-a",
      full_name: "Sample Enquiry",
      parent_name: "Sample Parent",
      phone: "919999999999",
      status: "FOLLOW_UP",
      next_follow_up: date,
    },
  ],
  erp_fee_plans: [
    {
      id: "plan-1",
      franchise_id: "centre-a",
      label: "Sample fee plan",
      amount_paise: 600000,
      installments: 3,
      active: true,
    },
  ],
  erp_invoices: [
    {
      id: "invoice-1",
      franchise_id: "centre-a",
      student_id: "student-1",
      plan_id: "plan-1",
      label: "Sample instalment · Level 1",
      amount_paise: 200000,
      discount_paise: 0,
      due_date: "2026-10-01",
    },
    {
      id: "invoice-2",
      franchise_id: "centre-a",
      student_id: "student-2",
      plan_id: "plan-1",
      label: "Sample instalment · Level 2",
      amount_paise: 200000,
      discount_paise: 10000,
      due_date: "2026-10-25",
    },
  ],
  erp_payments: [
    {
      id: "payment-1",
      franchise_id: "centre-a",
      invoice_id: "invoice-1",
      amount_paise: 100000,
      receipt_no: "SAMPLE-RECEIPT",
      reference: "SAMPLE-TRANSFER",
      verified_by: "preview-admin",
      created_at: date,
    },
  ],
  erp_payment_claims: [
    {
      id: "claim-1",
      franchise_id: "centre-a",
      invoice_id: "invoice-2",
      amount_paise: 190000,
      reference: "SAMPLE-PENDING",
      method: "UPI",
      status: "PENDING",
    },
  ],
  erp_stock_items: [
    {
      id: "item-1",
      franchise_id: "centre-a",
      sku: "SAMPLE-KIT-L1",
      name: "Sample Level 1 Kit",
      unit_price_paise: 100000,
      reorder_level: 5,
    },
    {
      id: "item-2",
      franchise_id: "centre-a",
      sku: "SAMPLE-BOOK-L2",
      name: "Sample Level 2 Workbook",
      unit_price_paise: 35000,
      reorder_level: 10,
    },
  ],
  erp_stock_movements: [
    {
      id: "move-1",
      item_id: "item-1",
      quantity_delta: 12,
      reason: "Sample opening stock",
      reference: "SAMPLE-OPEN-1",
      created_at: date,
    },
    {
      id: "move-2",
      item_id: "item-2",
      quantity_delta: 4,
      reason: "Sample opening stock",
      reference: "SAMPLE-OPEN-2",
      created_at: date,
    },
  ],
  erp_practice: [
    {
      id: "practice-1",
      student_id: "student-1",
      task: "Sample · Addition practice",
      due_date: date,
      status: "ASSIGNED",
    },
  ],
  erp_expenses: [
    {
      id: "expense-1",
      category: "Sample rent",
      description: "Sample operating cost",
      amount_paise: 40000,
      expense_date: date,
      reference: "SAMPLE-RENT",
    },
  ],
  erp_contacts: [
    {
      id: "contact-1",
      student_id: "student-1",
      phone: "919999999999",
      whatsapp_consent: true,
      consent_note: "Sample consent fixture",
    },
  ],
  erp_message_templates: [
    {
      id: "template-1",
      label: "Sample class reminder",
      body: "Dear parent, {student} has a class at {centre}. Please check your timetable.",
      active: true,
    },
  ],
};
export async function readRows(table: string) {
  let records = fixture[table] || [];
  if (previewRole === "parent") {
    if (table === "students")
      records = records.filter((row) => row.id === "student-1");
    else if (table === "erp_invoices")
      records = records.filter((row) => row.student_id === "student-1");
    else if (table === "erp_payments" || table === "erp_payment_claims")
      records = records.filter((row) => row.invoice_id === "invoice-1");
    else if (records.some((row) => "student_id" in row))
      records = records.filter((row) => row.student_id === "student-1");
  }
  return structuredClone(records);
}
export async function saveResource() {
  throw new Error(
    "Saving is disabled in this design preview. Configure the real app and database to save records.",
  );
}
export async function runAction() {
  throw new Error(
    "Actions are disabled in this design preview. No live records were changed.",
  );
}
