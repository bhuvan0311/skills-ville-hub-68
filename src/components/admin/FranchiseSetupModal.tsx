import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export function FranchiseSetupModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("franchises")
        .insert({
          name: name.trim(),
          city: city.trim(),
          franchise_code: code.trim(),
          is_active: true,
        })
        .select("id")
        .single();
      if (error || !data)
        throw new Error(error?.message || "Franchise was not created.");
      setName("");
      setCity("");
      setCode("");
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!saving) onOpenChange(value);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create franchise</DialogTitle>
          <DialogDescription>
            Create the centre first. Add its existing owner account in ERP →
            People & permissions. Account creation is handled securely by Head
            Office in Supabase Auth.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="franchise-name">Centre name</Label>
            <Input
              id="franchise-name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="franchise-city">City</Label>
            <Input
              id="franchise-city"
              required
              minLength={2}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="franchise-code">Unique franchise code</Label>
            <Input
              id="franchise-code"
              required
              minLength={2}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          <Button disabled={saving} type="submit">
            {saving ? "Creating…" : "Create centre"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
