import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { modules, resources, type Resource } from "@/lib/erp/catalog";
import {
  readRows,
  runAction,
  saveResource,
  upiLink,
  whatsappDraft,
  type Row,
} from "@/lib/erp/api";
import {
  invoiceBalance,
  localDate,
  mayAccess,
  money,
  moduleRoles,
  type ModuleKey,
} from "@/lib/erp/rules";
import {
  jsonToCSV,
  downloadCSV,
  escapeHTML,
  generatePrintablePDF,
} from "@/lib/exportUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Wallet,
  X,
  Activity,
  Building2,
  BookOpen,
  Settings2,
} from "lucide-react";
import logo from "@/assets/skills-ville-logo.svg";
import "./workspace.css";

const icons = {
  overview: LayoutDashboard,
  admissions: Users,
  fees: Wallet,
  learning: GraduationCap,
  timetable: CalendarDays,
  commercial: Activity,
  stock: Package,
  franchises: Building2,
  team: ShieldCheck,
  communications: MessageCircle,
  audit: BookOpen,
  parent: GraduationCap,
};
const labels: Record<string, string> = {
  full_name: "Student",
  parent_name: "Parent",
  amount_paise: "Amount",
  discount_paise: "Discount",
  balance_paise: "Outstanding",
  installments: "Instalments",
  student_id: "Student",
  invoice_id: "Invoice",
  teacher_user_id: "Teacher",
  session_id: "Class",
  batch_id: "Batch",
  item_id: "Item",
  quantity_delta: "Change",
  created_at: "Recorded",
  basis_points: "Rate (basis points)",
  fixed_paise: "Fixed charge",
  collected_paise: "Collections",
  from_level: "From level",
  to_level: "To level",
  classes_attended: "Classes attended",
  on_hand: "On hand",
  parent_user_id: "Parent",
  changed_fields: "Fields changed",
  actor_id: "Changed by",
};
const fieldLabel = (key: string) =>
  labels[key] || key.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
const numberValue = (row: Row, key: string) => Number(row[key] || 0);
const today = localDate();

function labelRow(row: Row): string {
  const label =
    row.full_name ||
    row.display_name ||
    row.label ||
    row.name ||
    row.sku ||
    row.receipt_no ||
    row.reference ||
    row.room ||
    row.id.slice(0, 8);
  return `${label}${row.installment ? ` #${row.installment}` : ""}`;
}

function dependencies(module: ModuleKey, role: string): string[] {
  const tables = new Set(
    modules[module].resources.map((key) => resources[key].table),
  );
  const add = (...names: string[]) => names.forEach((name) => tables.add(name));
  if (module !== "audit") add("students");
  if (["admissions", "learning", "timetable", "team"].includes(module))
    add("batches", "erp_memberships", "erp_class_sessions");
  if (module === "learning" || module === "parent")
    add("erp_attendance", "erp_progressions", "erp_class_sessions");
  if (["fees", "parent"].includes(module)) add("erp_payments", "erp_invoices");
  if (module === "stock") add("erp_stock_movements", "erp_stock_items");
  if (module === "communications") add("erp_contacts", "erp_message_templates");
  if (module === "commercial") add("erp_payments");
  if (module === "overview") {
    add("erp_class_sessions", "erp_attendance", "erp_practice");
    if (role !== "teacher")
      add(
        "erp_leads",
        "erp_invoices",
        "erp_payments",
        "erp_stock_items",
        "erp_stock_movements",
      );
    if (role === "franchise_owner" || role === "super_admin")
      add("erp_contracts");
  }
  return [...tables];
}

export default function ErpWorkspace() {
  const { module: routeModule = "overview" } = useParams();
  const { userRole, userProfile, signOut, user } = useAuth();
  const module = routeModule as ModuleKey;
  const [scopes, setScopes] = useState<Row[]>([]);
  const [scope, setScope] = useState("");
  const [scopeLoading, setScopeLoading] = useState(true);
  const [scopeError, setScopeError] = useState("");
  const [dataReady, setDataReady] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Record<string, Row[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("");
  const [search, setSearch] = useState("");
  const [mobile, setMobile] = useState(false);
  const [reload, setReload] = useState(0);
  const [form, setForm] = useState<{ resource: Resource; row?: Row } | null>(
    null,
  );
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmation, setConfirmation] = useState<{
    title: string;
    description: string;
    name: string;
    args: Record<string, unknown>;
  } | null>(null);
  const [periodStart, setPeriodStart] = useState(`${today.slice(0, 7)}-01`);
  const [periodEnd, setPeriodEnd] = useState(today);
  const globalAllowed =
    userRole === "super_admin" &&
    ["overview", "commercial", "audit"].includes(module);
  const [messageContact, setMessageContact] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [draft, setDraft] = useState("");
  const allowed = Boolean(modules[module] && mayAccess(userRole, module));

  useEffect(() => {
    let live = true;
    setScopeLoading(true);
    setScopeError("");
    readRows("franchises")
      .then((rows) => {
        if (!live) return;
        setScopes(rows);
        setScope(
          rows.find((row) => row.id === userProfile?.franchise_id)?.id ||
            rows[0]?.id ||
            "",
        );
      })
      .catch(() => {
        if (live)
          setScopeError(
            "Could not load your centres. Check account assignments and database setup.",
          );
      })
      .finally(() => {
        if (live) setScopeLoading(false);
      });
    return () => {
      live = false;
    };
  }, [user?.id, userProfile?.franchise_id]);

  useEffect(() => {
    let live = true;
    setData({});
    setDataReady(false);
    setLoading(true);
    setSearch("");
    setError("");
    setForm(null);
    setPage(1);
    setTab((previous) =>
      modules[module]?.resources.includes(previous)
        ? previous
        : modules[module]?.resources[0] || "",
    );
    if (!allowed || scopeLoading || !scope) {
      setLoading(false);
      return () => {
        live = false;
      };
    }
    if (scope === "all" && !globalAllowed) {
      setScope(scopes[0]?.id || "");
      return () => {
        live = false;
      };
    }
    const tables = dependencies(module, userRole);
    Promise.all(
      tables.map(
        async (table) =>
          [
            table,
            await readRows(table, scope === "all" ? undefined : scope),
          ] as const,
      ),
    )
      .then((entries) => {
        if (live) {
          setData(Object.fromEntries(entries));
          setDataReady(true);
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [
    module,
    scope,
    scopeLoading,
    reload,
    userRole,
    allowed,
    globalAllowed,
    scopes,
  ]);

  const centre =
    scope === "all"
      ? ({ id: "all", name: "All centres" } as Row)
      : scopes.find((row) => row.id === scope);
  const rows = (table: string) => data[table] || [];
  const find = (table: string, id: unknown) =>
    rows(table).find((row) => row.id === id);
  const payments = rows("erp_payments");
  const invoices: Row[] = rows("erp_invoices").map((row) => ({
    ...row,
    balance_paise: invoiceBalance(
      {
        amount_paise: numberValue(row, "amount_paise"),
        discount_paise: numberValue(row, "discount_paise"),
      },
      payments
        .filter((p) => p.invoice_id === row.id)
        .map((p) => ({ amount_paise: numberValue(p, "amount_paise") })),
    ),
  }));
  const stock: Row[] = rows("erp_stock_items").map((row) => ({
    ...row,
    on_hand: rows("erp_stock_movements")
      .filter((m) => m.item_id === row.id)
      .reduce((n, m) => n + numberValue(m, "quantity_delta"), 0),
  }));
  const students = rows("students");
  const attended = (student: Row) =>
    new Set(
      rows("erp_attendance")
        .filter(
          (a) =>
            a.student_id === student.id &&
            a.present &&
            a.level === student.level &&
            find("erp_class_sessions", a.session_id)?.status !== "CANCELLED",
        )
        .map((a) => a.session_id),
    ).size;
  const visibleRows = (resource: Resource) =>
    resource.key === "invoices"
      ? invoices
      : resource.key === "stockItems"
        ? stock
        : rows(resource.table);
  const activeResource = resources[tab];

  const display = (key: string, value: Row[string]): string => {
    if (value === null || value === undefined) return "—";
    if (key.endsWith("_paise")) return money(value as number);
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) return value.map(fieldLabel).join(", ");
    const tables: Record<string, string> = {
      student_id: "students",
      batch_id: "batches",
      invoice_id: "erp_invoices",
      item_id: "erp_stock_items",
      teacher_user_id: "erp_memberships",
      parent_user_id: "erp_memberships",
      session_id: "erp_class_sessions",
    };
    if (tables[key]) {
      const record =
        key === "teacher_user_id" || key === "parent_user_id"
          ? rows(tables[key]).find((r) => r.user_id === value)
          : find(tables[key], value);
      return record ? labelRow(record) : String(value).slice(0, 8);
    }
    if (key.endsWith("_at"))
      return new Date(String(value)).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      });
    return String(value);
  };

  const filtered = (activeResource ? visibleRows(activeResource) : []).filter(
    (row) =>
      activeResource.columns
        .map((key) => display(key, row[key]))
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / 25));
  const displayedRows = filtered.slice((page - 1) * 25, page * 25);

  const startForm = (resource: Resource, row?: Row) => {
    if (scope === "all") {
      setError("Select one centre to add or edit records.");
      return;
    }
    const initial: Record<string, string | boolean> = {};
    resource.fields.forEach((field) => {
      const value = row?.[field.key];
      if (field.type === "checkbox")
        initial[field.key] = row
          ? Boolean(value)
          : field.key !== "present" && field.key !== "whatsapp_consent";
      else if (field.type === "money")
        initial[field.key] =
          value !== undefined ? (Number(value) / 100).toFixed(2) : "";
      else if (field.type === "datetime-local" && value)
        initial[field.key] = new Date(
          new Date(String(value)).getTime() + 330 * 60000,
        )
          .toISOString()
          .slice(0, 16);
      else
        initial[field.key] =
          value !== undefined && value !== null
            ? String(value)
            : field.options?.[0] || "";
    });
    if (userRole === "parent" && resource.key === "claims")
      initial.method = "UPI";
    setValues(initial);
    setFormError("");
    setForm({ resource, row });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || saving) return;
    setSaving(true);
    setFormError("");
    try {
      await saveResource(form.resource, values, scope, form.row);
      setForm(null);
      setReload((n) => n + 1);
      setNotice("Saved to the database.");
    } catch (e) {
      setFormError(
        e instanceof Error ? e.message : "The record was not saved.",
      );
    } finally {
      setSaving(false);
    }
  };
  const act = async () => {
    if (!confirmation || saving) return;
    setSaving(true);
    try {
      await runAction(confirmation.name, confirmation.args);
      setConfirmation(null);
      setReload((n) => n + 1);
      setNotice("Change recorded successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The operation failed.");
    } finally {
      setSaving(false);
    }
  };
  const approve = (
    title: string,
    description: string,
    name: string,
    args: Record<string, unknown>,
  ) => setConfirmation({ title, description, name, args });

  const exportRows = () => {
    if (!activeResource || !filtered.length) return;
    const output = filtered.map((row) =>
      Object.fromEntries(
        activeResource.columns.map((key) => [
          fieldLabel(key),
          display(key, row[key]),
        ]),
      ),
    );
    downloadCSV(
      jsonToCSV(
        output,
        activeResource.columns.map((key) => ({
          key: fieldLabel(key),
          label: fieldLabel(key),
        })),
      ),
      `skills-ville-${activeResource.key}-${today}`,
    );
  };
  const receipt = (payment: Row) => {
    const invoice = find("erp_invoices", payment.invoice_id);
    const content = `<p><strong>Receipt:</strong> ${escapeHTML(String(payment.receipt_no))}</p><p><strong>Student:</strong> ${escapeHTML(display("student_id", invoice?.student_id))}</p><p><strong>Amount received:</strong> ${escapeHTML(money(payment.amount_paise as number))}</p><p><strong>Reference:</strong> ${escapeHTML(String(payment.reference))}</p><p><strong>Verified by account:</strong> ${escapeHTML(String(payment.verified_by))}</p><p>Manual bank / UPI / cash verification recorded on ${escapeHTML(display("created_at", payment.created_at))}. This document is a payment receipt, not a tax invoice.</p>`;
    generatePrintablePDF(
      `${centre?.name || "Skills Ville"} — Payment receipt`,
      content,
    );
  };

  if (!modules[module]) return <Navigate to="/erp/overview" replace />;
  if (!allowed)
    return (
      <Navigate
        to={userRole === "parent" ? "/erp/parent" : "/erp/overview"}
        replace
      />
    );

  const totalDues = invoices.reduce(
    (sum, i) => sum + Math.max(0, Number(i.balance_paise)),
    0,
  );
  const periodValid = periodStart <= periodEnd;
  const periodCollections = payments
    .filter((p) => {
      const date = localDate(new Date(String(p.created_at)));
      return date >= periodStart && date <= periodEnd;
    })
    .reduce((sum, p) => sum + numberValue(p, "amount_paise"), 0);
  const periodExpenses = rows("erp_expenses")
    .filter(
      (e) =>
        String(e.expense_date) >= periodStart &&
        String(e.expense_date) <= periodEnd,
    )
    .reduce((sum, e) => sum + numberValue(e, "amount_paise"), 0);
  const periodRoyalties = rows("erp_royalty_statements")
    .filter(
      (r) =>
        String(r.period_start) >= periodStart &&
        String(r.period_end) <= periodEnd,
    )
    .reduce((sum, r) => sum + numberValue(r, "amount_paise"), 0);

  return (
    <div className="sv-erp">
      {mobile && (
        <button
          className="sv-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sv-sidebar ${mobile ? "is-open" : ""}`}>
        <Link
          className="sv-brand"
          to={userRole === "parent" ? "/erp/parent" : "/erp/overview"}
        >
          <img src={logo} alt="" />
          <span>
            <strong>Skills Ville</strong>
            <small>FRANCHISE WORKSPACE</small>
          </span>
        </Link>
        <div className="sv-centre">
          <span className="sv-dot" />{" "}
          {userRole === "parent"
            ? "Parent portal"
            : userRole === "super_admin"
              ? "Head Office"
              : "Centre workspace"}
          <small>{centre?.name || "Select your centre"}</small>
        </div>
        <nav aria-label="ERP navigation">
          {(Object.keys(modules) as ModuleKey[])
            .filter((key) => moduleRoles[key].includes(userRole))
            .map((key) => {
              const Icon = icons[key];
              return (
                <Link
                  key={key}
                  className={module === key ? "active" : ""}
                  to={`/erp/${key}`}
                  onClick={() => setMobile(false)}
                >
                  <Icon size={18} />
                  <span>
                    {key === "overview"
                      ? "Overview"
                      : modules[key].title.replace(
                          "Your child’s journey",
                          "Parent portal",
                        )}
                  </span>
                  {module === key && <ChevronRight size={14} />}
                </Link>
              );
            })}
          {userRole === "super_admin" && (
            <>
              <div className="sv-nav-section">HEAD OFFICE TOOLS</div>
              <Link to="/admin/franchises">
                <Building2 size={18} />
                Franchise directory
              </Link>
              <Link to="/admin/products">
                <Package size={18} />
                Existing product catalogue
              </Link>
              <Link to="/admin/broadcasts">
                <MessageCircle size={18} />
                HQ broadcasts
              </Link>
              <Link to="/admin/certificates">
                <GraduationCap size={18} />
                Certificate hub
              </Link>
            </>
          )}
          {userRole === "franchise_owner" && (
            <Link to="/franchise/payments">
              <Wallet size={18} />
              Existing HQ invoices
            </Link>
          )}
        </nav>
        <div className="sv-sidebar-foot">
          <div>
            <ShieldCheck size={17} />
            <span>Recorded data. Clear ownership.</span>
          </div>
          <button
            onClick={async () => {
              try {
                await signOut();
              } catch {
                setError("Sign out failed. Please retry.");
              }
            }}
          >
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>
      <main className="sv-main">
        <header className="sv-topbar">
          <button
            className="sv-menu"
            aria-label="Open navigation"
            onClick={() => setMobile(true)}
          >
            <Menu size={21} />
          </button>
          <div>
            <span>Skills Ville</span>
            <ChevronRight size={13} />
            <strong>
              {module === "overview" ? "Overview" : modules[module].title}
            </strong>
          </div>
          <div className="sv-topbar-right">
            {scopes.length > 0 && (
              <select
                aria-label="Centre"
                value={
                  scope === "all" && !globalAllowed
                    ? scopes[0]?.id || ""
                    : scope
                }
                onChange={(e) => setScope(e.target.value)}
              >
                {globalAllowed && <option value="all">All centres</option>}
                {scopes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
            <span className="sv-avatar">
              {String(userProfile?.full_name || user?.email || "SV")
                .slice(0, 2)
                .toUpperCase()}
            </span>
          </div>
        </header>
        <div className="sv-content">
          <div className="sv-page-heading">
            <div>
              <div className="sv-eyebrow">
                {userRole === "parent"
                  ? "PARENT PORTAL"
                  : "SKILLS VILLE ABACUS · ERP"}
              </div>
              <h1>{modules[module].title}</h1>
              <p>{modules[module].subtitle}</p>
            </div>
            <div className="sv-heading-actions">
              {["super_admin", "franchise_owner"].includes(userRole) && (
                <Link
                  className="sv-legacy"
                  to={
                    userRole === "super_admin"
                      ? "/admin/franchises"
                      : "/franchise/students"
                  }
                >
                  {userRole === "super_admin"
                    ? "Franchise directory"
                    : "Student photos"}{" "}
                  <ArrowRight size={15} />
                </Link>
              )}
              <Button
                variant="outline"
                onClick={() => setReload((n) => n + 1)}
                disabled={loading || scopeLoading}
                aria-label="Refresh records"
              >
                <RefreshCw size={16} />
              </Button>
            </div>
          </div>
          {(error || scopeError) && (
            <div className="sv-error" role="alert">
              <AlertCircle size={19} />
              <div>
                <strong>Unable to complete this request</strong>
                <p>{error || scopeError}</p>
              </div>
              <button
                aria-label="Dismiss error"
                onClick={() => {
                  setError("");
                  setScopeError("");
                }}
              >
                <X size={18} />
              </button>
            </div>
          )}
          {notice && (
            <div className="sv-notice" role="status">
              <CheckCircle2 size={18} />
              {notice}
            </div>
          )}
          {scopeLoading || loading ? (
            <div className="sv-loading" role="status">
              <RefreshCw className="animate-spin" /> Loading your records…
            </div>
          ) : !scope ? (
            <div className="sv-empty">
              <Building2 size={36} />
              <h2>
                {userRole === "super_admin"
                  ? "Select or create a centre"
                  : "No centre assigned"}
              </h2>
              <p>
                {userRole === "super_admin"
                  ? "Use the franchise directory to set up your centres, then select one to manage its records."
                  : "Head Office must assign your account to a centre before records can be managed."}
              </p>
              {userRole === "super_admin" && (
                <Button asChild>
                  <Link to="/admin/franchises">Open franchise directory</Link>
                </Button>
              )}
            </div>
          ) : !dataReady ? (
            <div className="sv-empty">
              <ShieldCheck size={36} />
              <h2>Workspace setup required</h2>
              <p>
                Your records could not be loaded. Check database setup and your
                account permissions, then refresh.
              </p>
            </div>
          ) : (
            <>
              {(module === "overview" || module === "parent") && (
                <>
                  <section className="sv-welcome">
                    <div>
                      <span className="sv-eyebrow">
                        {new Date().toLocaleDateString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </span>
                      <h2>
                        {userRole === "parent"
                          ? "Every class is a step forward."
                          : "Small steps. Stronger centres."}
                      </h2>
                      <p>
                        {userRole === "parent"
                          ? "Follow your child’s attended classes, learning and verified fee payments."
                          : "Keep today’s follow-ups, classes and centre operations moving."}
                      </p>
                    </div>
                    <div className="sv-welcome-icon">
                      <GraduationCap size={65} />
                      <span>
                        12 attended classes
                        <br />
                        per level
                      </span>
                    </div>
                  </section>
                  <section className="sv-metrics">
                    <Metric
                      label={
                        userRole === "parent"
                          ? "Linked students"
                          : "Active students"
                      }
                      value={String(
                        students.filter(
                          (s) => userRole === "parent" || s.status === "ACTIVE",
                        ).length,
                      )}
                      hint="From student records"
                      icon={<Users />}
                    />
                    <Metric
                      label="Classes today"
                      value={String(
                        rows("erp_class_sessions").filter(
                          (s) =>
                            localDate(new Date(String(s.starts_at))) ===
                              today && s.status !== "CANCELLED",
                        ).length,
                      )}
                      hint={
                        userRole === "parent"
                          ? "See attended classes below"
                          : "Scheduled in your timetable"
                      }
                      icon={<CalendarDays />}
                    />
                    {userRole !== "teacher" && (
                      <Metric
                        label="Outstanding fees"
                        value={money(totalDues)}
                        hint="After verified payments and discounts"
                        icon={<Wallet />}
                      />
                    )}
                    <Metric
                      label="Ready for next level"
                      value={String(
                        students.filter((s) => attended(s) >= 12).length,
                      )}
                      hint="12 distinct attended classes"
                      icon={<GraduationCap />}
                    />
                  </section>
                  <div className="sv-overview-grid">
                    <section className="sv-panel">
                      <div className="sv-panel-heading">
                        <h2>
                          {userRole === "parent"
                            ? "Class progress"
                            : "Level readiness"}
                        </h2>
                        <span className="sv-tag">Attendance based</span>
                      </div>
                      {students.length === 0 ? (
                        <Empty text="Student records will appear here once enrolled." />
                      ) : (
                        students.slice(0, 8).map((student) => (
                          <div className="sv-student-progress" key={student.id}>
                            <span className="sv-student-avatar">
                              {String(student.full_name).slice(0, 1)}
                            </span>
                            <div>
                              <strong>{student.full_name}</strong>
                              <small>
                                Level {student.level} · {attended(student)} / 12
                                attended classes
                              </small>
                              <div className="sv-progress-track">
                                <i
                                  style={{
                                    width: `${Math.min(100, (attended(student) / 12) * 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <span
                              className={`sv-tag ${attended(student) >= 12 ? "good" : ""}`}
                            >
                              {attended(student) >= 12
                                ? "Eligible"
                                : "In progress"}
                            </span>
                          </div>
                        ))
                      )}
                    </section>
                    <section className="sv-panel">
                      <div className="sv-panel-heading">
                        <h2>Needs attention</h2>
                        <span className="sv-tag">From records</span>
                      </div>
                      {module === "parent" ? (
                        <p className="sv-panel-copy">
                          Use the fee list to submit a transfer reference. Your
                          centre will verify it before a receipt is issued.
                        </p>
                      ) : userRole === "teacher" ? (
                        <p className="sv-panel-copy">
                          Review the class timetable and record today’s
                          attendance and practice feedback.
                        </p>
                      ) : (
                        <>
                          <ActionTile
                            label="Admissions follow-ups"
                            count={
                              rows("erp_leads").filter(
                                (l) =>
                                  l.next_follow_up &&
                                  String(l.next_follow_up) <= today &&
                                  !["ENROLLED", "LOST"].includes(
                                    String(l.status),
                                  ),
                              ).length
                            }
                            to="/erp/admissions"
                          />
                          <ActionTile
                            label="Overdue instalments"
                            count={
                              invoices.filter(
                                (i) =>
                                  String(i.due_date) < today &&
                                  Number(i.balance_paise) > 0,
                              ).length
                            }
                            to="/erp/fees"
                          />
                          <ActionTile
                            label="Low stock items"
                            count={
                              stock.filter(
                                (s) =>
                                  Number(s.on_hand) <=
                                  numberValue(s, "reorder_level"),
                              ).length
                            }
                            to="/erp/stock"
                          />
                          <ActionTile
                            label="Renewals due"
                            count={
                              rows("erp_contracts").filter(
                                (c) =>
                                  String(c.renews_on) <= today &&
                                  c.status !== "CLOSED",
                              ).length
                            }
                            to="/erp/franchises"
                          />
                        </>
                      )}
                    </section>
                  </div>
                </>
              )}
              {module === "learning" && (
                <section className="sv-panel sv-readiness">
                  <div className="sv-panel-heading">
                    <div>
                      <h2>Ready for the next level</h2>
                      <p>
                        Owner-approved progression after 12 attended classes at
                        this level.
                      </p>
                    </div>
                    <span className="sv-tag">Your Skills Ville rule</span>
                  </div>
                  {students.filter(
                    (s) => s.status === "ACTIVE" && attended(s) >= 12,
                  ).length === 0 ? (
                    <Empty text="No students currently meet the 12-class attendance requirement." />
                  ) : (
                    students
                      .filter((s) => s.status === "ACTIVE" && attended(s) >= 12)
                      .map((s) => (
                        <div className="sv-action-row" key={s.id}>
                          <span>
                            {s.full_name} · Level {s.level} · {attended(s)}{" "}
                            attended classes
                          </span>
                          {["super_admin", "franchise_owner"].includes(
                            userRole,
                          ) && (
                            <Button
                              size="sm"
                              onClick={() =>
                                approve(
                                  "Advance student level",
                                  `Advance ${s.full_name} from level ${s.level} to ${Number(s.level) + 1}? The database will verify the attendance requirement.`,
                                  "erp_progress_student",
                                  { p_student: s.id },
                                )
                              }
                            >
                              Advance level
                            </Button>
                          )}
                        </div>
                      ))
                  )}
                </section>
              )}
              {module === "commercial" && (
                <section className="sv-panel">
                  <div className="sv-panel-heading">
                    <h2>Recorded cash-basis performance</h2>
                    <div className="sv-period">
                      <Input
                        aria-label="Reporting period start"
                        type="date"
                        value={periodStart}
                        onChange={(e) => setPeriodStart(e.target.value)}
                      />
                      <span>to</span>
                      <Input
                        aria-label="Reporting period end"
                        type="date"
                        value={periodEnd}
                        onChange={(e) => setPeriodEnd(e.target.value)}
                      />
                    </div>
                  </div>
                  {!periodValid ? (
                    <p role="alert">End date must follow start date.</p>
                  ) : (
                    <div className="sv-metrics">
                      <Metric
                        label="Verified collections"
                        value={money(periodCollections)}
                        hint="Student fee payments recorded in period"
                        icon={<Wallet />}
                      />
                      <Metric
                        label="Recorded expenses"
                        value={money(periodExpenses)}
                        hint="By expense date"
                        icon={<Activity />}
                      />
                      <Metric
                        label="Issued royalties"
                        value={money(periodRoyalties)}
                        hint="Statements wholly within period"
                        icon={<Building2 />}
                      />
                      <Metric
                        label="Recorded operating surplus"
                        value={money(
                          periodCollections - periodExpenses - periodRoyalties,
                        )}
                        hint="Collections − expenses − issued royalties"
                        icon={<Activity />}
                      />
                    </div>
                  )}
                  <p className="sv-panel-copy">
                    Cash-basis operational view. Unrecorded expenses, unissued
                    royalties, taxes and refunds are excluded. A royalty
                    statement spanning the boundary is excluded; choose matching
                    periods.
                  </p>
                </section>
              )}
              {module === "communications" && (
                <section className="sv-panel">
                  <div className="sv-panel-heading">
                    <h2>Prepare a WhatsApp message</h2>
                    <span className="sv-tag">You review and send</span>
                  </div>
                  <div className="sv-composer">
                    <label>
                      Contact
                      <select
                        value={messageContact}
                        onChange={(e) => {
                          setMessageContact(e.target.value);
                          const contact = find("erp_contacts", e.target.value);
                          const template = find(
                            "erp_message_templates",
                            messageTemplate,
                          );
                          setDraft(
                            String(template?.body || "")
                              .replaceAll(
                                "{student}",
                                display("student_id", contact?.student_id),
                              )
                              .replaceAll(
                                "{centre}",
                                String(centre?.name || "Skills Ville"),
                              ),
                          );
                        }}
                      >
                        <option value="">Choose a consenting parent</option>
                        {rows("erp_contacts")
                          .filter((c) => c.whatsapp_consent)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {display("student_id", c.student_id)} · {c.phone}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      Approved template
                      <select
                        value={messageTemplate}
                        onChange={(e) => {
                          setMessageTemplate(e.target.value);
                          const template = find(
                            "erp_message_templates",
                            e.target.value,
                          );
                          const contact = find("erp_contacts", messageContact);
                          setDraft(
                            String(template?.body || "")
                              .replaceAll(
                                "{student}",
                                display("student_id", contact?.student_id),
                              )
                              .replaceAll(
                                "{centre}",
                                String(centre?.name || "Skills Ville"),
                              ),
                          );
                        }}
                      >
                        <option value="">Choose a template</option>
                        {rows("erp_message_templates")
                          .filter((t) => t.active)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="sv-full">
                      Review message
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={4}
                      />
                    </label>
                    <Button
                      disabled={
                        !messageContact || !messageTemplate || !draft.trim()
                      }
                      onClick={() => {
                        const contact = find("erp_contacts", messageContact);
                        if (!contact?.whatsapp_consent) {
                          setError("Recorded WhatsApp consent is required.");
                          return;
                        }
                        try {
                          window.open(
                            whatsappDraft(String(contact.phone), draft),
                            "_blank",
                            "noopener,noreferrer",
                          );
                          setNotice(
                            "WhatsApp draft opened. Review and send it in WhatsApp; no message has been sent by the ERP.",
                          );
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      <MessageCircle size={16} /> Open WhatsApp draft
                    </Button>
                  </div>
                </section>
              )}
              {modules[module].resources.length > 0 && (
                <section className="sv-panel sv-records">
                  <div
                    className="sv-tabs"
                    role="tablist"
                    aria-label="Workspace sections"
                  >
                    {modules[module].resources.map((key) => (
                      <button
                        role="tab"
                        aria-selected={tab === key}
                        key={key}
                        onClick={() => {
                          setTab(key);
                          setSearch("");
                          setPage(1);
                        }}
                        className={tab === key ? "active" : ""}
                      >
                        {resources[key].title}
                      </button>
                    ))}
                  </div>
                  {activeResource && (
                    <>
                      <div className="sv-records-heading">
                        <div>
                          <h2>{activeResource.title}</h2>
                          <p>{activeResource.description}</p>
                        </div>
                        <div className="sv-table-tools">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!filtered.length}
                            onClick={exportRows}
                          >
                            <ArrowDownToLine size={15} /> Export CSV
                          </Button>
                          {scope !== "all" &&
                            activeResource.createRoles.includes(userRole) &&
                            !(
                              activeResource.key === "paymentSettings" &&
                              visibleRows(activeResource).length > 0
                            ) && (
                              <Button
                                size="sm"
                                onClick={() => startForm(activeResource)}
                              >
                                <Plus size={15} />{" "}
                                {activeResource.rpc
                                  ? "Create / assign"
                                  : "Add record"}
                              </Button>
                            )}
                        </div>
                      </div>
                      <div className="sv-search">
                        <Search size={17} />
                        <Input
                          aria-label="Search records"
                          placeholder="Search these records…"
                          value={search}
                          onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                          }}
                        />
                        <span>{filtered.length} records</span>
                      </div>
                      {filtered.length === 0 ? (
                        <Empty
                          text={
                            search
                              ? "No records match your search."
                              : "No records yet. Saved records will appear here."
                          }
                        />
                      ) : (
                        <div className="sv-table-scroll">
                          <table>
                            <thead>
                              <tr>
                                {scope === "all" && <th>Centre</th>}
                                {activeResource.columns.map((key) => (
                                  <th key={key}>{fieldLabel(key)}</th>
                                ))}
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {displayedRows.map((row) => (
                                <tr key={row.id}>
                                  {scope === "all" && (
                                    <td>
                                      {String(
                                        scopes.find(
                                          (s) => s.id === row.franchise_id,
                                        )?.name || "Unknown centre",
                                      )}
                                    </td>
                                  )}
                                  {activeResource.columns.map((key) => (
                                    <td key={key}>
                                      {key === "status" || key === "role" ? (
                                        <span
                                          className={`sv-tag ${["VERIFIED", "COMPLETED", "REVIEWED", "APPROVED", "ACTIVE", "RECEIVED"].includes(String(row[key])) ? "good" : ""}`}
                                        >
                                          {display(key, row[key])}
                                        </span>
                                      ) : (
                                        display(key, row[key])
                                      )}
                                    </td>
                                  ))}
                                  <td>
                                    <div className="sv-row-actions">
                                      {activeResource.key === "leads" &&
                                        row.status !== "LOST" &&
                                        !row.student_id && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              approve(
                                                "Enrol student",
                                                `Create a pending level 1 student record for ${row.full_name}?`,
                                                "erp_enroll_lead",
                                                { p_lead: row.id },
                                              )
                                            }
                                          >
                                            Enrol
                                          </Button>
                                        )}
                                      {activeResource.key === "batches" &&
                                        userRole === "franchise_owner" && (
                                          <Link
                                            to={`/franchise/batches/${row.id}/exam`}
                                          >
                                            Exam marks
                                          </Link>
                                        )}
                                      {scope !== "all" &&
                                        activeResource.updateRoles?.includes(
                                          userRole,
                                        ) && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              startForm(activeResource, row)
                                            }
                                          >
                                            Edit
                                          </Button>
                                        )}
                                      {activeResource.key === "appointments" &&
                                        row.status === "REQUESTED" &&
                                        userRole !== "parent" && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={async () => {
                                              const { error } = await supabase
                                                .from("erp_appointments")
                                                .update({ status: "CONFIRMED" })
                                                .eq("id", row.id)
                                                .eq("franchise_id", scope)
                                                .select("id")
                                                .single();
                                              if (error)
                                                setError(
                                                  "Appointment confirmation was not saved.",
                                                );
                                              else {
                                                setNotice(
                                                  "Appointment confirmed.",
                                                );
                                                setReload((n) => n + 1);
                                              }
                                            }}
                                          >
                                            Confirm time
                                          </Button>
                                        )}
                                      {activeResource.key === "payments" && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => receipt(row)}
                                        >
                                          Receipt
                                        </Button>
                                      )}
                                      {activeResource.key === "claims" &&
                                        row.status === "PENDING" &&
                                        [
                                          "super_admin",
                                          "franchise_owner",
                                        ].includes(userRole) && (
                                          <>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                approve(
                                                  "Verify received payment",
                                                  `Confirm that ${money(row.amount_paise as number)} with reference ${row.reference} has actually arrived in the bank or cash register. A receipt will be issued.`,
                                                  "erp_verify_payment",
                                                  {
                                                    p_claim: row.id,
                                                    p_accept: true,
                                                  },
                                                )
                                              }
                                            >
                                              Verify
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                approve(
                                                  "Reject payment claim",
                                                  "Reject this claim without issuing a receipt?",
                                                  "erp_verify_payment",
                                                  {
                                                    p_claim: row.id,
                                                    p_accept: false,
                                                  },
                                                )
                                              }
                                            >
                                              Reject
                                            </Button>
                                          </>
                                        )}
                                      {activeResource.key === "discounts" &&
                                        row.status === "PENDING" &&
                                        userRole === "super_admin" && (
                                          <>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                approve(
                                                  "Approve discount",
                                                  `Reduce this invoice by ${money(row.amount_paise as number)}?`,
                                                  "erp_decide_discount",
                                                  {
                                                    p_request: row.id,
                                                    p_accept: true,
                                                  },
                                                )
                                              }
                                            >
                                              Approve
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                approve(
                                                  "Reject discount",
                                                  "Reject this discount request?",
                                                  "erp_decide_discount",
                                                  {
                                                    p_request: row.id,
                                                    p_accept: false,
                                                  },
                                                )
                                              }
                                            >
                                              Reject
                                            </Button>
                                          </>
                                        )}
                                      {activeResource.key === "procurement" &&
                                        [
                                          "super_admin",
                                          "franchise_owner",
                                        ].includes(userRole) &&
                                        (
                                          (row.status === "REQUESTED"
                                            ? ["APPROVED", "REJECTED"]
                                            : row.status === "APPROVED"
                                              ? ["RECEIVED"]
                                              : []) as string[]
                                        ).map((action) => (
                                          <Button
                                            key={action}
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              approve(
                                                action === "RECEIVED"
                                                  ? "Confirm stock received"
                                                  : "Decide procurement",
                                                action === "RECEIVED"
                                                  ? "Confirm the items physically arrived. This records a stock receipt."
                                                  : `Set this request to ${action.toLowerCase()}?`,
                                                "erp_decide_procurement",
                                                {
                                                  p_request: row.id,
                                                  p_action: action,
                                                },
                                              )
                                            }
                                          >
                                            {action === "RECEIVED"
                                              ? "Receive"
                                              : action === "APPROVED"
                                                ? "Approve"
                                                : "Reject"}
                                          </Button>
                                        ))}
                                      {activeResource.key === "invoices" &&
                                        Number(row.balance_paise) > 0 &&
                                        rows("erp_payment_settings")[0]
                                          ?.upi_id && (
                                          <a
                                            className="sv-pay-link"
                                            href={upiLink(
                                              rows("erp_payment_settings")[0],
                                              row.id,
                                              Number(row.balance_paise),
                                            )}
                                          >
                                            Open UPI app
                                          </a>
                                        )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      <div className="sv-table-footer">
                        <div className="sv-pagination">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={page === 1}
                            onClick={() => setPage((n) => n - 1)}
                          >
                            Previous
                          </Button>
                          <span>
                            Page {page} of {pageCount}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={page >= pageCount}
                            onClick={() => setPage((n) => n + 1)}
                          >
                            Next
                          </Button>
                        </div>
                        All accessible records for {centre?.name}. Times
                        displayed in IST.
                      </div>
                    </>
                  )}
                </section>
              )}
            </>
          )}
          <footer className="sv-footer">
            <span>Skills Ville · Franchise ERP</span>
            <span>
              Business rules set by Head Office · No generated business data
            </span>
          </footer>
        </div>
      </main>
      <Dialog
        open={Boolean(form)}
        onOpenChange={(open) => {
          if (!open && !saving) setForm(null);
        }}
      >
        <DialogContent className="sv-form-modal">
          <DialogHeader>
            <DialogTitle>
              {form?.row ? "Edit" : "Create"} · {form?.resource.title}
            </DialogTitle>
            <DialogDescription>{form?.resource.description}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="sv-record-form">
            {form?.resource.fields.map((field) => {
              const relationRows =
                field.relation === "teachers"
                  ? rows("erp_memberships").filter(
                      (r) => r.role === "teacher" && r.active,
                    )
                  : field.relation === "parents"
                    ? rows("erp_memberships").filter(
                        (r) => r.role === "parent" && r.active,
                      )
                    : rows(field.relation || "").filter(
                        (r) => r.active !== false,
                      );
              const options = field.options?.filter(
                (option) =>
                  !(userRole === "parent" && option === "CASH") &&
                  !(
                    userRole !== "super_admin" &&
                    form.resource.key === "memberships" &&
                    option === "franchise_owner"
                  ),
              );
              return (
                <div
                  key={field.key}
                  className={field.type === "textarea" ? "sv-full" : ""}
                >
                  {field.type === "checkbox" ? (
                    <label className="sv-check">
                      <Checkbox
                        checked={Boolean(values[field.key])}
                        onCheckedChange={(checked) =>
                          setValues((v) => ({
                            ...v,
                            [field.key]: checked === true,
                          }))
                        }
                      />
                      {field.label}
                    </label>
                  ) : (
                    <>
                      <Label htmlFor={`field-${field.key}`}>
                        {field.label}
                        {field.required ? " *" : ""}
                      </Label>
                      {field.relation || options ? (
                        <select
                          id={`field-${field.key}`}
                          required={field.required}
                          value={String(values[field.key] || "")}
                          onChange={(e) =>
                            setValues((v) => ({
                              ...v,
                              [field.key]: e.target.value,
                            }))
                          }
                        >
                          <option value="">Choose…</option>
                          {options
                            ? options.map((o) => (
                                <option key={o} value={o}>
                                  {o.replaceAll("_", " ")}
                                </option>
                              ))
                            : relationRows
                                .filter((r) => r.is_active !== false)
                                .map((r) => (
                                  <option
                                    key={r.id}
                                    value={
                                      field.relation === "teachers" ||
                                      field.relation === "parents"
                                        ? String(r.user_id)
                                        : r.id
                                    }
                                  >
                                    {labelRow(r)}
                                  </option>
                                ))}
                        </select>
                      ) : field.type === "textarea" ? (
                        <Textarea
                          id={`field-${field.key}`}
                          required={field.required}
                          value={String(values[field.key] || "")}
                          onChange={(e) =>
                            setValues((v) => ({
                              ...v,
                              [field.key]: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <Input
                          id={`field-${field.key}`}
                          type={
                            field.type === "money"
                              ? "text"
                              : field.type || "text"
                          }
                          inputMode={
                            field.type === "money" ? "decimal" : undefined
                          }
                          min={field.min}
                          max={field.max}
                          required={field.required}
                          value={String(values[field.key] ?? "")}
                          onChange={(e) =>
                            setValues((v) => ({
                              ...v,
                              [field.key]: e.target.value,
                            }))
                          }
                        />
                      )}
                    </>
                  )}
                </div>
              );
            })}
            {formError && (
              <p role="alert" className="sv-form-error sv-full">
                {formError}
              </p>
            )}
            <div className="sv-form-actions sv-full">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setForm(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save record"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(confirmation)}
        onOpenChange={(open) => {
          if (!open && !saving) setConfirmation(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmation?.title}</DialogTitle>
            <DialogDescription>{confirmation?.description}</DialogDescription>
          </DialogHeader>
          <div className="sv-form-actions">
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => setConfirmation(null)}
            >
              Cancel
            </Button>
            <Button disabled={saving} onClick={act}>
              {saving ? "Recording…" : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="sv-metric">
      <span className="sv-metric-icon">{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="sv-empty">
      <Package size={28} />
      <p>{text}</p>
    </div>
  );
}
function ActionTile({
  label,
  count,
  to,
}: {
  label: string;
  count: number;
  to: string;
}) {
  return (
    <Link className="sv-action-tile" to={to}>
      <span>
        <i className={count > 0 ? "pending" : ""} />
        {label}
      </span>
      <strong>{count}</strong>
      <ChevronRight size={17} />
    </Link>
  );
}
