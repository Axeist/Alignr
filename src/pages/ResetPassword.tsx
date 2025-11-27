import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Eye, EyeOff, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const PasswordInput = ({
  id,
  value,
  onChange,
  showPassword,
  onToggle,
  placeholder = "Enter password",
  className,
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPassword: boolean;
  onToggle: () => void;
  placeholder?: string;
  className?: string;
}) => {
  return (
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className={cn("border-gray-300 focus:border-[#0066FF] focus:ring-[#0066FF] pr-10", className)}
      />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};

interface PasswordValidation {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
  <div className={cn("flex items-center gap-2 text-sm transition-colors", isValid ? "text-green-600" : "text-gray-500")}>
    {isValid ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-gray-400" />}
    <span>{text}</span>
  </div>
);

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // Validate password
  useEffect(() => {
    if (password) {
      setPasswordValidation({
        minLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      });
    } else {
      setPasswordValidation({
        minLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
      });
    }
  }, [password]);

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const passwordsMatch = confirmPassword === password && confirmPassword.length > 0;

  // Check if we have a valid session from the reset token
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const checkSession = async () => {
      try {
        // Check if URL has hash fragments (Supabase recovery tokens are in hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const type = hashParams.get("type");
        
        // Also check query params for type
        const urlType = searchParams.get("type");

        // If we have a recovery type in URL, Supabase will process it automatically
        // We listen for the session to be created
        if (type === "recovery" || urlType === "recovery" || accessToken) {
          // Set up listener for auth state changes
          const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
                setIsValidToken(true);
              }
            }
          );
          subscription = authSubscription;

          // Also check current session
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          
          if (currentSession) {
            setIsValidToken(true);
          } else if (accessToken) {
            // Try to set session from the hash
            const refreshToken = hashParams.get("refresh_token") || "";
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error("Error setting session:", error);
              setIsValidToken(false);
            } else {
              setIsValidToken(true);
            }
          }
        } else {
          // Check if we already have a valid session (user might have refreshed)
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setIsValidToken(true);
          } else {
            setIsValidToken(false);
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setIsValidToken(false);
      }
    };

    checkSession();

    // Cleanup function
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast({
        title: "Invalid Password",
        description: "Please ensure your password meets all requirements.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);

    if (!error) {
      // Wait a moment then redirect to sign in
      setTimeout(() => {
        navigate("/auth", { replace: true });
      }, 1500);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-white via-blue-50/30 to-green-50/30">
          <Card className="w-full max-w-md border border-gray-200 bg-white shadow-xl">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0066FF] border-t-transparent mx-auto"></div>
                <p className="mt-4 text-gray-600">Verifying reset link...</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-white via-blue-50/30 to-green-50/30">
          <Card className="w-full max-w-md border border-gray-200 bg-white shadow-xl">
            <CardHeader className="space-y-4 text-center">
              <div className="flex justify-center">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Invalid or Expired Link</CardTitle>
              <CardDescription className="text-gray-600">
                This password reset link is invalid or has expired. Please request a new one.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => navigate("/forgot-password")}
                  className="w-full bg-[#CAFF00] hover:bg-[#B8E600] text-gray-900 font-semibold rounded-full"
                >
                  Request New Reset Link
                </Button>
                <Link to="/auth">
                  <Button
                    variant="outline"
                    className="w-full border-gray-300"
                  >
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-white via-blue-50/30 to-green-50/30">
        <Card className="w-full max-w-md border border-gray-200 bg-white shadow-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <img
                src="https://iili.io/fqdZCfn.png"
                alt="Alignr Logo"
                className="h-32 md:h-40 w-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Reset Your Password</CardTitle>
            <CardDescription className="text-gray-600">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900">New Password</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  showPassword={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                  placeholder="Enter new password"
                />

                {/* Password Requirements */}
                {password && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Password Requirements:</p>
                    <ValidationItem isValid={passwordValidation.minLength} text="At least 8 characters" />
                    <ValidationItem isValid={passwordValidation.hasUpperCase} text="One uppercase letter" />
                    <ValidationItem isValid={passwordValidation.hasLowerCase} text="One lowercase letter" />
                    <ValidationItem isValid={passwordValidation.hasNumber} text="One number" />
                    <ValidationItem isValid={passwordValidation.hasSpecialChar} text="One special character" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-gray-900">Confirm Password</Label>
                <PasswordInput
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  showPassword={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                  placeholder="Re-enter your password"
                />

                {/* Password Match Indicator */}
                {confirmPassword && (
                  <div className="mt-1">
                    {passwordsMatch ? (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Passwords match</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span>Passwords do not match</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-[#CAFF00] hover:bg-[#B8E600] text-gray-900 font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !isPasswordValid || !passwordsMatch}
              >
                {loading ? "Updating Password..." : "Update Password"}
              </Button>

              <div className="text-center">
                <Link
                  to="/auth"
                  className="text-sm text-[#0066FF] hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
