import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun, Eye, EyeOff, Loader2, Shield } from "lucide-react";
import skillsVilleLogo from "@/assets/skills-ville-logo.svg";
import { z } from "zod";
import "./auth.css";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters");

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, userRole, signIn, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  // Redirect authenticated users based on role
  useEffect(() => {
    if (user && userRole && !isLoading) {
      navigate(userRole === "parent" ? "/erp/parent" : "/erp/overview");
    }
  }, [user, userRole, isLoading, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
    } catch {
      // Show access denied message for all login errors
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Contact Head Office for account access.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sv-auth">
      {/* Header */}
      <header className="sv-auth-header">
        <span className="sv-auth-wordmark">
          Skills Ville <span>Franchise Portal</span>
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="sv-auth-theme"
          aria-label={theme === "dark" ? "Use light theme" : "Use dark theme"}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </header>

      {/* Main Content */}
      <main className="sv-auth-main">
        <div className="sv-auth-shell">
          <section
            className="sv-auth-brand"
            aria-label="Skills Ville Abacus Academy"
          >
            <span className="sv-auth-eyebrow">FRANCHISE OPERATIONS</span>
            <img
              src={skillsVilleLogo}
              alt="Skills Ville — Future Ready"
              className="sv-auth-logo"
            />
            <div className="sv-auth-brand-copy">
              <h1>
                Your centre.
                <br /> One workspace.
              </h1>
              <p>
                Admissions, learning and accounts.
                <br /> Connected in one place.
              </p>
            </div>
            <span className="sv-auth-brand-footer">
              SKILLS VILLE ABACUS ACADEMY
            </span>
          </section>
          <div className="sv-auth-access">
            {!isSupabaseConfigured && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm"
              >
                Database connection is not configured. Head Office must connect
                the approved Supabase project before sign-in is available.
              </div>
            )}
            {user && !userRole && (
              <div role="alert" className="mb-4 rounded-lg border p-4 text-sm">
                Account permissions could not be verified. Contact Head Office
                or sign out and try again.
                <Button
                  className="mt-3 w-full"
                  variant="outline"
                  onClick={() =>
                    import("@/lib/supabase").then(({ supabase }) =>
                      supabase.auth.signOut(),
                    )
                  }
                >
                  Sign out
                </Button>
              </div>
            )}
            <Card className="sv-auth-card">
              <CardHeader className="sv-auth-card-header">
                <span className="sv-auth-eyebrow">ACCOUNT ACCESS</span>
                <CardTitle className="sv-auth-title">Welcome back</CardTitle>
                <CardDescription>
                  Sign in to your Skills Ville workspace.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="username"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={
                        errors.email ? "login-email-error" : undefined
                      }
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && (
                      <p
                        id="login-email-error"
                        className="text-xs text-destructive"
                      >
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        aria-invalid={Boolean(errors.password)}
                        aria-describedby={
                          errors.password ? "login-password-error" : undefined
                        }
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={
                          errors.password ? "border-destructive pr-10" : "pr-10"
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p
                        id="login-password-error"
                        className="text-xs text-destructive"
                      >
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="sv-auth-submit"
                    disabled={isSubmitting || !isSupabaseConfigured}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="sv-auth-card-footer">
                <div className="sv-auth-account-note">
                  <Shield size={18} aria-hidden="true" />
                  <p className="text-xs">
                    This is a private portal. Accounts are created by Head
                    Office only.
                  </p>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="sv-auth-footer">
        <span>© {new Date().getFullYear()} Skills Ville Abacus.</span>
        <span>Franchise management, thoughtfully connected.</span>
      </footer>
    </div>
  );
}
