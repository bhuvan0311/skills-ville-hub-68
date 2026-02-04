import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StudentKYCModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StudentKYCData) => void;
}

export interface StudentKYCData {
  name: string;
  parentName: string;
  dateOfBirth: string;
  phone: string;
  photo?: string;
}

export function StudentKYCModal({ open, onOpenChange, onSubmit }: StudentKYCModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<StudentKYCData>({
    name: '',
    parentName: '',
    dateOfBirth: '',
    phone: '',
    photo: undefined,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof StudentKYCData, string>>>({});

  const handlePhotoCapture = () => {
    // Simulate camera capture
    toast({
      title: 'Camera Activated',
      description: 'Camera capture simulated. Photo would be captured here.',
    });
    setFormData((prev) => ({
      ...prev,
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    }));
  };

  const handlePhotoUpload = () => {
    // Simulate file upload
    toast({
      title: 'Gallery Opened',
      description: 'File picker simulated. Image would be uploaded here.',
    });
    setFormData((prev) => ({
      ...prev,
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    }));
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof StudentKYCData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Student name is required';
    }
    if (!formData.parentName.trim()) {
      newErrors.parentName = 'Parent name is required';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);

    onSubmit(formData);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      name: '',
      parentName: '',
      dateOfBirth: '',
      phone: '',
      photo: undefined,
    });
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
                {formData.name ? formData.name[0].toUpperCase() : '?'}
              </AvatarFallback>
            </Avatar>
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
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent-name">Parent/Guardian Name</Label>
              <Input
                id="parent-name"
                placeholder="Enter parent's name"
                value={formData.parentName}
                onChange={(e) => setFormData((prev) => ({ ...prev, parentName: e.target.value }))}
                className={errors.parentName ? 'border-destructive' : ''}
              />
              {errors.parentName && <p className="text-xs text-destructive">{errors.parentName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                className={errors.dateOfBirth ? 'border-destructive' : ''}
              />
              {errors.dateOfBirth && <p className="text-xs text-destructive">{errors.dateOfBirth}</p>}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className={`rounded-l-none ${errors.phone ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
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
                'Enroll Student'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
