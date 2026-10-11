import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Batch, createStudent, uploadStudentPhoto } from "@/lib/supabase";

interface StudentKYCModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  franchiseId: string;
  batches: Batch[];
}

export interface StudentKYCData {
  name: string;
  parentName: string;
  dateOfBirth: string;
  phone: string;
  email?: string;
  batchId?: string;
  photo?: string;
  photoFile?: File;
}

export function StudentKYCModal({
  open,
  onOpenChange,
  onSuccess,
  franchiseId,
  batches,
}: StudentKYCModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<StudentKYCData>({
    name: "",
    parentName: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    batchId: undefined,
    photo: undefined,
    photoFile: undefined,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof StudentKYCData, string>>
  >({});

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: "",
        parentName: "",
        dateOfBirth: "",
        phone: "",
        email: "",
        batchId: undefined,
        photo: undefined,
        photoFile: undefined,
      });
      setErrors({});
    }
  }, [open]);

  const handlePhotoCapture = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a JPG, PNG, or WebP image.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        photo: previewUrl,
        photoFile: file,
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof StudentKYCData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Student name is required";
    }
    if (!formData.parentName.trim()) {
      newErrors.parentName = "Parent name is required";
    }
    if (
      formData.dateOfBirth &&
      formData.dateOfBirth > new Date().toISOString().slice(0, 10)
    )
      newErrors.dateOfBirth = "Date of birth cannot be in the future";
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Create the student record first
      const newStudent = await createStudent({
        franchise_id: franchiseId,
        full_name: formData.name.trim(),
        dob: formData.dateOfBirth || undefined,
        parent_name: formData.parentName.trim(),
        parent_phone: `+91${formData.phone.replace(/\D/g, "")}`,
        parent_email: formData.email?.trim() || undefined,
        batch_id: formData.batchId || undefined,
        level: 1,
      });

      if (!newStudent) {
        throw new Error("Failed to create student record");
      }

      // Upload photo if present
      if (formData.photoFile && newStudent.id) {
        try {
          const photoUrl = await uploadStudentPhoto(
            franchiseId,
            newStudent.id,
            formData.photoFile,
          );

          if (photoUrl) {
            // Update student with photo URL
            const { supabase } = await import("@/lib/supabase");
            const { error } = await supabase
              .from("students")
              .update({ photo_url: photoUrl })
              .eq("id", newStudent.id)
              .select("id")
              .single();
            if (error) throw error;
          }
        } catch (photoError) {
          console.error("Photo upload failed:", photoError);
          // Continue anyway - student was created
          toast({
            title: "Photo upload failed",
            description: "Student enrolled but photo could not be uploaded.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Student Enrolled!",
        description: `${formData.name} has been successfully enrolled.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating student:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to enroll student",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Complete the digital KYC form for student enrollment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload Section */}
          <div className="flex flex-col items-center gap-4 py-4">
            <Avatar className="h-24 w-24 border-2 border-dashed border-border">
              <AvatarImage src={formData.photo} />
              <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
                {formData.name ? formData.name[0].toUpperCase() : "?"}
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePhotoCapture}
                className="gap-2"
              >
                <Camera className="h-4 w-4" />
                Click Picture
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePhotoUpload}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Gallery Upload
              </Button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-name">Student Name</Label>
              <Input
                id="student-name"
                placeholder="Enter student's full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className={errors.name ? "border-destructive" : ""}
                required
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent-name">Parent/Guardian Name</Label>
              <Input
                id="parent-name"
                placeholder="Enter parent's name"
                value={formData.parentName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    parentName: e.target.value,
                  }))
                }
                className={errors.parentName ? "border-destructive" : ""}
                required
              />
              {errors.parentName && (
                <p className="text-xs text-destructive">{errors.parentName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dateOfBirth: e.target.value,
                  }))
                }
                className={errors.dateOfBirth ? "border-destructive" : ""}
                required
              />
              {errors.dateOfBirth && (
                <p className="text-xs text-destructive">{errors.dateOfBirth}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                  +91
                </span>
                <Input
                  id="phone"
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className={`rounded-l-none ${errors.phone ? "border-destructive" : ""}`}
                  required
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Parent Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="parent@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch">Assign Batch (Optional)</Label>
              <Select
                value={formData.batchId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, batchId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} (Level {batch.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enrolling...
                </>
              ) : (
                "Enroll Student"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
