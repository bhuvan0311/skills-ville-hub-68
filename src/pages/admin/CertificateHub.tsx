import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { escapeHTML, generatePrintablePDF } from "@/lib/exportUtils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
type Certificate = {
  id: string;
  student_id: string;
  franchise_id: string;
  level: number;
  exam_date: string;
  certificate_status: "PENDING" | "GENERATED" | "SHIPPED";
  student: { full_name: string };
  franchise: { name: string };
};
export default function CertificateHub() {
  const [records, setRecords] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [shipping, setShipping] = useState<Certificate | null>(null);
  const [saving, setSaving] = useState(false);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("exam_results")
        .select("*,student:students(full_name),franchise:franchises(name)")
        .eq("is_passed", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRecords(data || []);
    } catch {
      setRecords([]);
      setError(
        "Certificate records could not be loaded. Check database setup and retry.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const update = async (
    record: Certificate,
    status: "GENERATED" | "SHIPPED",
  ) => {
    const { data, error } = await supabase
      .from("exam_results")
      .update({
        certificate_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id)
      .eq("certificate_status", record.certificate_status)
      .select("id")
      .single();
    if (error || !data)
      throw new Error("Certificate status was not saved. Refresh and retry.");
  };
  const print = async (record: Certificate) => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const opened = generatePrintablePDF(
        "Skills Ville Abacus — Level Certificate",
        `<p>This certifies that</p><h2>${escapeHTML(record.student?.full_name || "")}</h2><p>completed the recorded assessment for <strong>Level ${record.level}</strong> at ${escapeHTML(record.franchise?.name || "Skills Ville")}.</p><p>Assessment date: ${escapeHTML(record.exam_date)}</p><p>Assessment reference: ${escapeHTML(record.id)}</p><p>Authorised signature: __________________</p>`,
      );
      if (!opened)
        throw new Error(
          "Allow the print window to open before preparing the certificate.",
        );
      if (record.certificate_status === "PENDING")
        await update(record, "GENERATED");
      setNotice(
        "Certificate print view opened. Use your browser’s Save as PDF or printer.",
      );
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Certificate Hub</h1>
        <p className="text-muted-foreground">
          Passing assessments, printable certificates and recorded dispatch
          status.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <Button variant="outline" onClick={load} disabled={loading}>
        Refresh
      </Button>
      {loading ? (
        <p role="status">Loading certificates…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm text-left">
            <thead>
              <tr>
                {[
                  "Student",
                  "Centre",
                  "Level",
                  "Assessment date",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th className="p-4" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr className="border-t" key={record.id}>
                  <td className="p-4">{record.student?.full_name}</td>
                  <td className="p-4">{record.franchise?.name}</td>
                  <td className="p-4">{record.level}</td>
                  <td className="p-4">{record.exam_date}</td>
                  <td className="p-4">{record.certificate_status}</td>
                  <td className="p-4">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={saving}
                      onClick={() => print(record)}
                    >
                      Open print view
                    </Button>
                    {record.certificate_status === "GENERATED" && (
                      <Button
                        className="ml-2"
                        size="sm"
                        disabled={saving}
                        onClick={() => setShipping(record)}
                      >
                        Record dispatch
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!records.length && !error && (
            <p className="p-6 text-muted-foreground">
              No passing assessments have been recorded yet.
            </p>
          )}
        </div>
      )}
      <Dialog
        open={Boolean(shipping)}
        onOpenChange={(open) => {
          if (!open && !saving) setShipping(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record certificate dispatch</DialogTitle>
            <DialogDescription>
              Confirm this certificate has physically been dispatched to the
              centre. The ERP does not arrange shipping.
            </DialogDescription>
          </DialogHeader>
          <Button
            disabled={saving}
            onClick={async () => {
              if (!shipping) return;
              setSaving(true);
              try {
                await update(shipping, "SHIPPED");
                setShipping(null);
                setNotice("Dispatch recorded.");
                await load();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setSaving(false);
              }
            }}
          >
            Confirm dispatched
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
