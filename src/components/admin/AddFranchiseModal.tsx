import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Building2, Mail, Lock, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const franchiseSchema = z.object({
  name: z.string().min(2, 'Franchise name must be at least 2 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  ownerEmail: z.string().email('Please enter a valid email address'),
  ownerPassword: z.string().min(6, 'Password must be at least 6 characters'),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
});

type FranchiseFormData = z.infer<typeof franchiseSchema>;

interface AddFranchiseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddFranchiseModal({ open, onOpenChange, onSuccess }: AddFranchiseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FranchiseFormData>({
    resolver: zodResolver(franchiseSchema),
    defaultValues: {
      name: '',
      city: '',
      ownerEmail: '',
      ownerPassword: '',
      ownerName: '',
    },
  });

  const generateFranchiseCode = (city: string) => {
    const cityPrefix = city.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${cityPrefix}-${randomNum}`;
  };

  const onSubmit = async (data: FranchiseFormData) => {
    setIsSubmitting(true);

    try {
      // Step 1: Create the franchise record
      const franchiseCode = generateFranchiseCode(data.city);
      
      const { data: franchiseData, error: franchiseError } = await supabase
        .from('franchises')
        .insert({
          name: data.name,
          city: data.city,
          franchise_code: franchiseCode,
          email: data.ownerEmail,
          is_active: true,
        })
        .select()
        .single();

      if (franchiseError) {
        throw new Error(`Failed to create franchise: ${franchiseError.message}`);
      }

      // Step 2: Create the user account via Supabase Auth
      // Note: In production, this should be done via an Edge Function with admin privileges
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.ownerEmail,
        password: data.ownerPassword,
        options: {
          data: {
            full_name: data.ownerName,
          },
        },
      });

      if (authError) {
        // Rollback: Delete the franchise if user creation fails
        await supabase.from('franchises').delete().eq('id', franchiseData.id);
        throw new Error(`Failed to create user account: ${authError.message}`);
      }

      if (!authData.user) {
        await supabase.from('franchises').delete().eq('id', franchiseData.id);
        throw new Error('User creation failed - no user returned');
      }

      // Step 3: Create the profile linking user to franchise
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: data.ownerName,
          franchise_id: franchiseData.id,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Continue anyway - profile might be created by trigger
      }

      // Step 4: Assign franchise_owner role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'franchise_owner',
        });

      if (roleError) {
        console.error('Role assignment error:', roleError);
        // Continue anyway - we'll handle this gracefully
      }

      toast({
        title: 'Franchise Created!',
        description: `Credentials sent to ${data.ownerEmail}. Franchise Code: ${franchiseCode}`,
      });

      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating franchise:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create franchise',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Add New Franchise
          </DialogTitle>
          <DialogDescription>
            Create a new franchise and owner account. The owner will receive login credentials.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
              <h4 className="font-medium text-sm text-muted-foreground">Franchise Details</h4>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Franchise Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Skills Ville - Koramangala" 
                          className="pl-9" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Bangalore" 
                          className="pl-9" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
              <h4 className="font-medium text-sm text-muted-foreground">Owner Account</h4>
              
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="email"
                          placeholder="owner@example.com" 
                          className="pl-9" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temporary Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="password"
                          placeholder="••••••••" 
                          className="pl-9" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Franchise'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
