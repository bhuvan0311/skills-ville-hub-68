import type { ErpRole, ModuleKey } from "./rules";

export interface Field {
  key: string;
  label: string;
  type?:
    | "text"
    | "date"
    | "datetime-local"
    | "money"
    | "number"
    | "email"
    | "textarea"
    | "checkbox";
  required?: boolean;
  options?: string[];
  relation?: string;
  min?: number;
  max?: number;
}
export interface Resource {
  key: string;
  table: string;
  title: string;
  description: string;
  fields: Field[];
  columns: string[];
  createRoles: ErpRole[];
  updateRoles?: ErpRole[];
  rpc?: string;
}
const admin: ErpRole[] = ["super_admin"];
const owners: ErpRole[] = ["super_admin", "franchise_owner"];
const office: ErpRole[] = [...owners, "receptionist"];
const academic: ErpRole[] = [...owners, "teacher"];
const text = (key: string, label: string, required = true): Field => ({
  key,
  label,
  required,
});
const date = (key: string, label: string): Field => ({
  key,
  label,
  type: "date",
  required: true,
});
const amount = (key: string, label: string): Field => ({
  key,
  label,
  type: "money",
  required: true,
});
const relation = (key: string, label: string, table: string): Field => ({
  key,
  label,
  relation: table,
  required: true,
});
const number = (
  key: string,
  label: string,
  min: number,
  max?: number,
): Field => ({ key, label, type: "number", min, max, required: true });

export const resources: Record<string, Resource> = {
  students: {
    key: "students",
    table: "students",
    title: "Students",
    description:
      "Manage real enrolment records, parent details and batch assignment. New students start at level 1.",
    createRoles: office,
    updateRoles: office,
    fields: [
      text("full_name", "Student name"),
      { key: "dob", label: "Date of birth", type: "date" },
      text("parent_name", "Parent name"),
      text("parent_phone", "Parent phone"),
      { key: "parent_email", label: "Parent email", type: "email" },
      { key: "batch_id", label: "Batch", relation: "batches" },
      {
        key: "status",
        label: "Status",
        options: ["PENDING", "ACTIVE", "INACTIVE", "DROPOUT", "GRADUATED"],
        required: true,
      },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    columns: [
      "full_name",
      "level",
      "status",
      "batch_id",
      "parent_name",
      "parent_phone",
    ],
  },
  batches: {
    key: "batches",
    table: "batches",
    title: "Batches",
    description: "Create level-based groups and set their enrolment capacity.",
    createRoles: owners,
    updateRoles: owners,
    fields: [
      text("name", "Batch name"),
      number("level", "Level", 1),
      text("schedule", "Schedule notes", false),
      number("max_students", "Capacity", 1, 1000),
      { key: "is_active", label: "Batch active", type: "checkbox" },
    ],
    columns: ["name", "level", "schedule", "max_students", "is_active"],
  },
  training: {
    key: "training",
    table: "erp_teacher_training",
    title: "Teacher training",
    description:
      "Record actual training progress and completion evidence for your teaching team.",
    createRoles: owners,
    updateRoles: owners,
    fields: [
      relation("teacher_user_id", "Teacher", "teachers"),
      text("title", "Training / certification"),
      number("level", "Level", 1),
      {
        key: "status",
        label: "Status",
        options: ["PLANNED", "SCHEDULED", "COMPLETED"],
        required: true,
      },
      date("training_date", "Training date"),
      text("evidence", "Completion evidence / notes"),
    ],
    columns: [
      "teacher_user_id",
      "title",
      "level",
      "status",
      "training_date",
      "evidence",
    ],
  },
  leads: {
    key: "leads",
    table: "erp_leads",
    title: "Admissions pipeline",
    description: "Track enquiries, trial classes and the next follow-up.",
    createRoles: office,
    updateRoles: office,
    fields: [
      text("full_name", "Student name"),
      text("parent_name", "Parent name"),
      text("phone", "Phone"),
      {
        key: "status",
        label: "Stage",
        options: ["NEW", "TRIAL", "FOLLOW_UP", "ENROLLED", "LOST"],
        required: true,
      },
      date("next_follow_up", "Next follow-up"),
      { key: "notes", label: "Notes", type: "textarea" },
      { key: "student_id", label: "Enrolled student", relation: "students" },
    ],
    columns: ["full_name", "parent_name", "phone", "status", "next_follow_up"],
  },
  plans: {
    key: "plans",
    table: "erp_fee_plans",
    title: "Fee plans",
    description:
      "Head Office sets amounts and instalments. No fee defaults are assumed.",
    createRoles: admin,
    updateRoles: admin,
    fields: [
      text("label", "Plan name"),
      amount("amount_paise", "Total fee (₹)"),
      number("installments", "Monthly instalments", 1, 24),
      { key: "active", label: "Available for assignment", type: "checkbox" },
    ],
    columns: ["label", "amount_paise", "installments", "active"],
  },
  invoices: {
    key: "invoices",
    table: "erp_invoices",
    title: "Student dues",
    description:
      "Assign a plan to create exact monthly instalments. Discounts require Head Office approval.",
    createRoles: office,
    rpc: "erp_assign_fee_plan",
    fields: [
      relation("p_student", "Student", "students"),
      relation("p_plan", "Fee plan", "erp_fee_plans"),
      date("p_first_due", "First due date"),
    ],
    columns: [
      "student_id",
      "label",
      "amount_paise",
      "discount_paise",
      "balance_paise",
      "due_date",
    ],
  },
  claims: {
    key: "claims",
    table: "erp_payment_claims",
    title: "Payment verification",
    description:
      "A reference is a claim, not proof of settlement. Verify against your bank before confirming.",
    createRoles: [...office, "parent"],
    fields: [
      relation("invoice_id", "Invoice", "erp_invoices"),
      amount("amount_paise", "Transferred amount (₹)"),
      text("reference", "UPI / bank reference"),
      {
        key: "method",
        label: "Method",
        options: ["UPI", "BANK_TRANSFER", "CASH"],
        required: true,
      },
    ],
    columns: ["invoice_id", "amount_paise", "reference", "method", "status"],
  },
  payments: {
    key: "payments",
    table: "erp_payments",
    title: "Receipts",
    description: "Receipts exist only after a payment claim is verified.",
    createRoles: [],
    fields: [],
    columns: [
      "receipt_no",
      "invoice_id",
      "amount_paise",
      "reference",
      "created_at",
    ],
  },
  discounts: {
    key: "discounts",
    table: "erp_discount_requests",
    title: "Discount approvals",
    description:
      "Submit an amount and reason; Head Office approves or rejects it.",
    createRoles: office,
    fields: [
      relation("invoice_id", "Invoice", "erp_invoices"),
      amount("amount_paise", "Requested discount (₹)"),
      text("reason", "Reason"),
    ],
    columns: ["invoice_id", "amount_paise", "reason", "status"],
  },
  paymentSettings: {
    key: "paymentSettings",
    table: "erp_payment_settings",
    title: "Payment & contact details",
    description:
      "Head Office supplies the centre’s actual UPI ID, bank instructions and WhatsApp number.",
    createRoles: admin,
    updateRoles: admin,
    fields: [
      text("payee_name", "Payee name"),
      text("upi_id", "UPI ID", false),
      {
        key: "bank_instructions",
        label: "Bank transfer instructions",
        type: "textarea",
      },
      text(
        "whatsapp_phone",
        "Centre WhatsApp number (international digits)",
        false,
      ),
    ],
    columns: ["payee_name", "upi_id", "bank_instructions", "whatsapp_phone"],
  },
  sessions: {
    key: "sessions",
    table: "erp_class_sessions",
    title: "Class timetable",
    description:
      "Teacher, room and batch clashes are rejected. Times are entered in India Standard Time.",
    createRoles: academic,
    updateRoles: academic,
    fields: [
      relation("batch_id", "Batch", "batches"),
      relation("teacher_user_id", "Teacher", "teachers"),
      text("room", "Room"),
      number("level", "Level", 1),
      {
        key: "starts_at",
        label: "Starts (IST)",
        type: "datetime-local",
        required: true,
      },
      {
        key: "ends_at",
        label: "Ends (IST)",
        type: "datetime-local",
        required: true,
      },
      {
        key: "status",
        label: "Status",
        options: ["SCHEDULED", "COMPLETED", "CANCELLED"],
        required: true,
      },
    ],
    columns: [
      "batch_id",
      "teacher_user_id",
      "room",
      "level",
      "starts_at",
      "ends_at",
      "status",
    ],
  },
  attendance: {
    key: "attendance",
    table: "erp_attendance",
    title: "Class attendance",
    description:
      "Record each student’s attendance after class. Only attended classes at the current level count toward progression.",
    createRoles: academic,
    fields: [
      relation("session_id", "Class", "erp_class_sessions"),
      relation("student_id", "Student", "students"),
      number("level", "Class level", 1),
      { key: "present", label: "Student attended", type: "checkbox" },
    ],
    columns: ["student_id", "session_id", "level", "present", "created_at"],
  },
  assessments: {
    key: "assessments",
    table: "erp_assessments",
    title: "Skill assessments",
    description:
      "Record observed skill scores and feedback, without automatic marks or invented results.",
    createRoles: academic,
    updateRoles: academic,
    fields: [
      relation("student_id", "Student", "students"),
      number("level", "Level", 1),
      text("skill", "Skill assessed"),
      number("score", "Score / 100", 0, 100),
      date("assessed_on", "Assessment date"),
      { key: "notes", label: "Feedback", type: "textarea" },
    ],
    columns: ["student_id", "level", "skill", "score", "assessed_on", "notes"],
  },
  practice: {
    key: "practice",
    table: "erp_practice",
    title: "Practice & homework",
    description: "Assign practice and track completion and teacher review.",
    createRoles: academic,
    updateRoles: academic,
    fields: [
      relation("student_id", "Student", "students"),
      text("task", "Practice task"),
      date("due_date", "Due date"),
      {
        key: "status",
        label: "Status",
        options: ["ASSIGNED", "COMPLETED", "REVIEWED"],
        required: true,
      },
      { key: "notes", label: "Review notes", type: "textarea" },
    ],
    columns: ["student_id", "task", "due_date", "status", "notes"],
  },
  progressions: {
    key: "progressions",
    table: "erp_progressions",
    title: "Level progression history",
    description:
      "The server requires 12 distinct attended classes at the current level before an owner can advance a student.",
    createRoles: [],
    fields: [],
    columns: [
      "student_id",
      "from_level",
      "to_level",
      "classes_attended",
      "created_at",
    ],
  },
  expenses: {
    key: "expenses",
    table: "erp_expenses",
    title: "Centre expenses",
    description:
      "Track recorded operating expenses for the selected reporting period.",
    createRoles: owners,
    updateRoles: owners,
    fields: [
      text("category", "Category"),
      text("description", "Description"),
      amount("amount_paise", "Amount (₹)"),
      date("expense_date", "Expense date"),
      text("reference", "Reference"),
    ],
    columns: [
      "category",
      "description",
      "amount_paise",
      "expense_date",
      "reference",
    ],
  },
  royaltyRules: {
    key: "royaltyRules",
    table: "erp_royalty_rules",
    title: "Royalty rules",
    description:
      "Head Office sets a percentage of verified collections and an optional fixed charge per statement.",
    createRoles: admin,
    updateRoles: admin,
    fields: [
      text("label", "Rule name"),
      number("basis_points", "Percentage in basis points (100 = 1%)", 0, 10000),
      {
        key: "fixed_paise",
        label: "Fixed charge per statement (₹)",
        type: "money",
      },
      date("effective_from", "Effective from"),
      { key: "effective_to", label: "Effective until", type: "date" },
    ],
    columns: [
      "label",
      "basis_points",
      "fixed_paise",
      "effective_from",
      "effective_to",
    ],
  },
  royalties: {
    key: "royalties",
    table: "erp_royalty_statements",
    title: "Royalty statements",
    description:
      "Issue a statement from verified collections. Overlapping statement periods are rejected.",
    createRoles: admin,
    rpc: "erp_generate_royalty",
    fields: [
      relation("p_rule", "Royalty rule", "erp_royalty_rules"),
      date("p_start", "Period start"),
      date("p_end", "Period end"),
    ],
    columns: [
      "period_start",
      "period_end",
      "collected_paise",
      "amount_paise",
      "created_at",
    ],
  },
  stockItems: {
    key: "stockItems",
    table: "erp_stock_items",
    title: "Stock catalogue",
    description:
      "Head Office sets stock identifiers, unit prices and reorder thresholds.",
    createRoles: admin,
    updateRoles: admin,
    fields: [
      text("sku", "SKU"),
      text("name", "Item name"),
      {
        key: "unit_price_paise",
        label: "Unit price (₹)",
        type: "money",
        required: true,
      },
      number("reorder_level", "Reorder threshold", 0),
    ],
    columns: ["sku", "name", "unit_price_paise", "on_hand", "reorder_level"],
  },
  movements: {
    key: "movements",
    table: "erp_stock_movements",
    title: "Stock movements",
    description:
      "Opening balances, receipts, issues and reconciliation need a reference. Negative stock is rejected.",
    createRoles: owners,
    rpc: "erp_record_stock",
    fields: [
      relation("p_item", "Item", "erp_stock_items"),
      number(
        "p_delta",
        "Quantity change (+ received / − issued)",
        -100000,
        100000,
      ),
      text("p_reason", "Reason"),
      text("p_reference", "Unique reference"),
    ],
    columns: ["item_id", "quantity_delta", "reason", "reference", "created_at"],
  },
  procurement: {
    key: "procurement",
    table: "erp_procurement",
    title: "Procurement approvals",
    description:
      "Request stock, approve the request, then confirm receipt to create an accountable stock movement.",
    createRoles: office,
    fields: [
      relation("item_id", "Item", "erp_stock_items"),
      number("quantity", "Quantity", 1),
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    columns: ["item_id", "quantity", "status", "notes", "created_at"],
  },
  contracts: {
    key: "contracts",
    table: "erp_contracts",
    title: "Franchise onboarding & renewals",
    description:
      "Head Office records the agreed dates and the onboarding checklist.",
    createRoles: admin,
    updateRoles: admin,
    fields: [
      text("label", "Agreement / onboarding name"),
      date("starts_on", "Starts on"),
      date("renews_on", "Renewal date"),
      {
        key: "status",
        label: "Stage",
        options: ["ONBOARDING", "ACTIVE", "RENEWAL_DUE", "CLOSED"],
        required: true,
      },
      {
        key: "checklist",
        label: "Checklist and outstanding requirements",
        type: "textarea",
        required: true,
      },
    ],
    columns: ["label", "starts_on", "renews_on", "status", "checklist"],
  },
  memberships: {
    key: "memberships",
    table: "erp_memberships",
    title: "Team access",
    description:
      "Use an existing Supabase Auth account ID. Only Head Office can assign franchise owners.",
    createRoles: owners,
    rpc: "erp_manage_membership",
    fields: [
      text("p_user", "Existing account UUID"),
      text("p_name", "Display name"),
      {
        key: "p_role",
        label: "Role",
        options: ["franchise_owner", "teacher", "receptionist", "parent"],
        required: true,
      },
      { key: "p_active", label: "Access active", type: "checkbox" },
    ],
    columns: ["display_name", "user_id", "role", "active"],
  },
  parents: {
    key: "parents",
    table: "erp_parent_links",
    title: "Parent–student links",
    description:
      "A parent membership must exist before linking a student. Parents only see their linked children.",
    createRoles: owners,
    rpc: "erp_link_parent",
    fields: [
      relation("p_parent", "Parent account", "parents"),
      relation("p_student", "Student", "students"),
    ],
    columns: ["parent_user_id", "student_id", "created_at"],
  },
  templates: {
    key: "templates",
    table: "erp_message_templates",
    title: "Approved WhatsApp templates",
    description:
      "Head Office prepares message text. Use {student} and {centre}; staff review each draft before sending.",
    createRoles: admin,
    updateRoles: admin,
    fields: [
      text("label", "Template name"),
      { key: "body", label: "Message", type: "textarea", required: true },
      { key: "active", label: "Approved for use", type: "checkbox" },
    ],
    columns: ["label", "body", "active"],
  },
  contacts: {
    key: "contacts",
    table: "erp_contacts",
    title: "Parent contact consent",
    description: "Record permission before using a WhatsApp draft.",
    createRoles: office,
    updateRoles: office,
    fields: [
      relation("student_id", "Student", "students"),
      text("phone", "International phone digits"),
      {
        key: "whatsapp_consent",
        label: "WhatsApp permission recorded",
        type: "checkbox",
      },
      text("consent_note", "How / when permission was received"),
    ],
    columns: ["student_id", "phone", "whatsapp_consent", "consent_note"],
  },
  appointments: {
    key: "appointments",
    table: "erp_appointments",
    title: "Parent appointments",
    description:
      "Parents request a time; the centre confirms it. Times are entered in IST.",
    createRoles: [...office, "parent"],
    updateRoles: academic,
    fields: [
      relation("student_id", "Student", "students"),
      {
        key: "requested_at",
        label: "Requested time (IST)",
        type: "datetime-local",
        required: true,
      },
      text("reason", "Reason"),
    ],
    columns: ["student_id", "requested_at", "reason", "status"],
  },
  audit: {
    key: "audit",
    table: "erp_audit",
    title: "Activity history",
    description:
      "Database-written actor, action and changed-field history. Records cannot be edited from the app.",
    createRoles: [],
    fields: [],
    columns: [
      "actor_id",
      "entity",
      "operation",
      "record_id",
      "changed_fields",
      "created_at",
    ],
  },
};

export const modules: Record<
  ModuleKey,
  { title: string; subtitle: string; resources: string[] }
> = {
  overview: {
    title: "Your centre, at a glance",
    subtitle: "A clear view of today’s work and recorded performance.",
    resources: [],
  },
  admissions: {
    title: "Admissions",
    subtitle: "Turn an enquiry into a well-managed student journey.",
    resources: ["leads", "students"],
  },
  fees: {
    title: "Fees & receipts",
    subtitle: "Clear dues. Verified collections. Accountable approvals.",
    resources: [
      "invoices",
      "claims",
      "payments",
      "plans",
      "discounts",
      "paymentSettings",
    ],
  },
  learning: {
    title: "Learning operations",
    subtitle: "Twelve attended classes. Evidence for every next step.",
    resources: [
      "attendance",
      "assessments",
      "practice",
      "progressions",
      "training",
    ],
  },
  timetable: {
    title: "Class timetable",
    subtitle: "Keep every teacher, classroom and batch in sync.",
    resources: ["sessions", "batches", "appointments"],
  },
  commercial: {
    title: "Centre finances",
    subtitle: "Collections, expenses and Head Office royalty statements.",
    resources: ["expenses", "royalties", "royaltyRules"],
  },
  stock: {
    title: "Stock & procurement",
    subtitle: "Know what is on hand and why it changed.",
    resources: ["stockItems", "procurement", "movements"],
  },
  franchises: {
    title: "Franchise lifecycle",
    subtitle: "Onboarding, agreements and renewal dates in one place.",
    resources: ["contracts"],
  },
  team: {
    title: "People & permissions",
    subtitle: "The right access for every person at your centre.",
    resources: ["memberships", "parents", "training"],
  },
  communications: {
    title: "Parent communications",
    subtitle: "Consent-based WhatsApp drafts, reviewed and sent by you.",
    resources: ["contacts", "templates"],
  },
  audit: {
    title: "Activity history",
    subtitle: "Trace each recorded change to its actor and time.",
    resources: ["audit"],
  },
  parent: {
    title: "Your child’s journey",
    subtitle: "Learning progress, fees, receipts and appointments.",
    resources: [
      "invoices",
      "claims",
      "payments",
      "attendance",
      "assessments",
      "practice",
      "progressions",
      "appointments",
      "paymentSettings",
    ],
  },
};
