import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Github, Linkedin, Chrome, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";

interface PasswordValidation {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithOAuth, user, userRole, getDashboardPath, fetchUserRole } = useAuth();
  const [loading, setLoading] = useState(false);

  // Sign In State
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up State
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("student");

  // Password validation
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // Validate password
  useEffect(() => {
    if (signUpPassword) {
      setPasswordValidation({
        minLength: signUpPassword.length >= 8,
        hasUpperCase: /[A-Z]/.test(signUpPassword),
        hasLowerCase: /[a-z]/.test(signUpPassword),
        hasNumber: /[0-9]/.test(signUpPassword),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(signUpPassword),
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
  }, [signUpPassword]);

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const passwordsMatch = confirmPassword === signUpPassword && confirmPassword.length > 0;

  // Redirect if already logged in
  useEffect(() => {
    if (user && userRole) {
      navigate(getDashboardPath(userRole), { replace: true });
    }
  }, [user, userRole, navigate, getDashboardPath]);

  if (user && userRole) {
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, data } = await signIn(signInEmail, signInPassword);
    setLoading(false);
    if (!error && data?.user) {
      // Wait for role to be fetched
      const role = await fetchUserRole(data.user.id);
      if (role) {
        navigate(getDashboardPath(role), { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password
    if (!isPasswordValid) {
      return;
    }
    
    // Validate password match
    if (signUpPassword !== confirmPassword) {
      return;
    }

    setLoading(true);
    const { error, data } = await signUp(signUpEmail, signUpPassword, fullName, role);
    setLoading(false);
    if (!error && data?.user) {
      // Wait for role to be fetched
      const fetchedRole = await fetchUserRole(data.user.id);
      if (fetchedRole) {
        navigate(getDashboardPath(fetchedRole), { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  };

  const PasswordInput = ({ 
    id, 
    value, 
    onChange, 
    showPassword, 
    onToggle,
    placeholder = "Enter password",
    className
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
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  };

  const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <div className={cn("flex items-center gap-2 text-sm transition-colors", isValid ? "text-green-600" : "text-gray-500")}>
      {isValid ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-gray-400" />
      )}
      <span>{text}</span>
    </div>
  );

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
            <CardDescription className="text-gray-600 text-base">Your AI-powered career ecosystem</CardDescription>
          </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
              <TabsTrigger value="signin" className="data-[state=active]:bg-white">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-white">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4 mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-gray-900">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    className="border-gray-300 focus:border-[#0066FF] focus:ring-[#0066FF]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-gray-900">Password</Label>
                  <PasswordInput
                    id="signin-password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    showPassword={showSignInPassword}
                    onToggle={() => setShowSignInPassword(!showSignInPassword)}
                    placeholder="Enter your password"
                  />
                </div>
                <Button type="submit" className="w-full bg-[#CAFF00] hover:bg-[#B8E600] text-gray-900 font-semibold rounded-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
                <div className="relative my-4">
                  <Separator />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-white px-2 text-xs text-gray-500">OR</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => signInWithOAuth("google")}
                    className="w-full border-gray-300 hover:border-[#0066FF] hover:text-[#0066FF]"
                  >
                    <Chrome className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => signInWithOAuth("linkedin")}
                    className="w-full border-gray-300 hover:border-[#0066FF] hover:text-[#0066FF]"
                  >
                    <Linkedin className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => signInWithOAuth("github")}
                    className="w-full border-gray-300 hover:border-[#0066FF] hover:text-[#0066FF]"
                  >
                    <Github className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4 mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullname" className="text-gray-900">Full Name</Label>
                  <Input
                    id="fullname"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="border-gray-300 focus:border-[#0066FF] focus:ring-[#0066FF]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-gray-900">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    className="border-gray-300 focus:border-[#0066FF] focus:ring-[#0066FF]"
                  />
                </div>
                
                {/* Password Field with Validation */}
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-gray-900">Password</Label>
                  <PasswordInput
                    id="signup-password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    showPassword={showSignUpPassword}
                    onToggle={() => setShowSignUpPassword(!showSignUpPassword)}
                    placeholder="Create a strong password"
                  />
                  
                  {/* Password Requirements */}
                  {signUpPassword && (
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

                {/* Confirm Password Field */}
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

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-gray-900">I am a...</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                    <SelectTrigger id="role" className="border-gray-300 focus:border-[#0066FF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="alumni">Alumni/Startup</SelectItem>
                      <SelectItem value="college">College/TPO</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-[#CAFF00] hover:bg-[#B8E600] text-gray-900 font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={loading || !isPasswordValid || !passwordsMatch}
                >
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
                
                <div className="relative my-4">
                  <Separator />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-white px-2 text-xs text-gray-500">OR</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => signInWithOAuth("google")}
                    className="w-full border-gray-300 hover:border-[#0066FF] hover:text-[#0066FF]"
                  >
                    <Chrome className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => signInWithOAuth("linkedin")}
                    className="w-full border-gray-300 hover:border-[#0066FF] hover:text-[#0066FF]"
                  >
                    <Linkedin className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => signInWithOAuth("github")}
                    className="w-full border-gray-300 hover:border-[#0066FF] hover:text-[#0066FF]"
                  >
                    <Github className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
      <Footer />
    </div>
  );
}
