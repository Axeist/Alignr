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
import { Link } from "react-router-dom";
import { Github, Linkedin, Chrome, Eye, EyeOff, CheckCircle2, XCircle, Check, ChevronsUpDown, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { colleges, collegeCategories, getCollegesByCategory, type CollegeCategory, getCollegeById } from "@/lib/colleges";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface PasswordValidation {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

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
        className={cn("border-gray-200 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 pr-10 transition-all duration-300 bg-white/80 backdrop-blur-sm", className)}
      />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <EyeOff className="h-5 w-5" />
        ) : (
          <Eye className="h-5 w-5" />
        )}
      </button>
    </div>
  );
};

const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className={cn("flex items-center gap-2 text-sm transition-colors duration-300", isValid ? "text-green-600" : "text-gray-500")}
  >
    {isValid ? (
      <CheckCircle2 className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-400" />
    )}
    <span className={cn("font-light", isValid && "font-medium")}>{text}</span>
  </motion.div>
);

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithOAuth, user, userRole, getDashboardPath, fetchUserRole } = useAuth();
  const { toast } = useToast();
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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<string>("");
  const [collegeCategoryFilter, setCollegeCategoryFilter] = useState<CollegeCategory | "all">("all");
  const [collegeSearchOpen, setCollegeSearchOpen] = useState(false);
  const [alumniStartupNumber, setAlumniStartupNumber] = useState("");

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
    
    if (!isPasswordValid) {
      return;
    }
    
    if (signUpPassword !== confirmPassword) {
      return;
    }

    if (role !== "admin" && !selectedCollege) {
      toast({
        title: "College Required",
        description: "Please select your college.",
        variant: "destructive",
      });
      return;
    }

    if (role === "alumni" && !alumniStartupNumber.trim()) {
      toast({
        title: "Enrollment/Certificate Number Required",
        description: "Please enter your Alumni Enrollment Number or Startup Certificate Number.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error, data } = await signUp(signUpEmail, signUpPassword, fullName, role, selectedCollege, role === "alumni" ? alumniStartupNumber : undefined);
    setLoading(false);
    if (!error && data?.user) {
      const fetchedRole = await fetchUserRole(data.user.id);
      if (fetchedRole) {
        navigate(getDashboardPath(fetchedRole), { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4 relative">
        {/* Premium Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/20 to-green-50/20 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full backdrop-blur-2xl"
              style={{
                width: Math.random() * 500 + 200,
                height: Math.random() * 500 + 200,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: `linear-gradient(135deg, rgba(0,102,255,${0.03 + Math.random() * 0.05}), rgba(202,255,0,${0.03 + Math.random() * 0.05}))`,
                filter: 'blur(80px)',
              }}
              animate={{
                y: [0, -50, 0],
                x: [0, Math.random() * 40 - 20, 0],
                scale: [1, 1.4, 1],
                opacity: [0.15, 0.3, 0.15],
              }}
              transition={{
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="border border-gray-200/60 bg-white/90 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-green-50/30 opacity-50" />
            
            <CardHeader className="space-y-6 text-center relative z-10 pb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                className="flex justify-center"
              >
                <motion.img
                  src="https://iili.io/fqdZCfn.png"
                  alt="Alignr Logo"
                  className="h-28 md:h-32 w-auto drop-shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <CardDescription className="text-gray-600 text-base font-light tracking-wide">
                  Your AI-powered career ecosystem
                </CardDescription>
              </motion.div>
            </CardHeader>
            
            <CardContent className="relative z-10">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100/80 backdrop-blur-sm border border-gray-200/60 rounded-xl p-1">
                  <TabsTrigger 
                    value="signin" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-300 font-medium"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-300 font-medium"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="space-y-5 mt-6">
                  <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleSignIn}
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-gray-900 font-medium">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        required
                        className="border-gray-200 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="signin-password" className="text-gray-900 font-medium">Password</Label>
                        <Link
                          to="/forgot-password"
                          className="text-sm text-[#0066FF] hover:underline font-medium transition-colors"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <PasswordInput
                        id="signin-password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        showPassword={showSignInPassword}
                        onToggle={() => setShowSignInPassword(!showSignInPassword)}
                        placeholder="Enter your password"
                      />
                    </div>
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-[#CAFF00] to-[#B8E600] hover:from-[#B8E600] hover:to-[#CAFF00] text-gray-900 font-semibold rounded-full h-12 text-base transition-all duration-300 shadow-lg hover:shadow-xl border-0" 
                        disabled={loading}
                      >
                        {loading ? "Signing in..." : "Sign In"}
                      </Button>
                    </motion.div>
                    <div className="relative my-6">
                      <Separator className="bg-gray-200" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-white/90 backdrop-blur-sm px-3 text-xs text-gray-500 font-medium">OR</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => signInWithOAuth("google")}
                          className="w-full border-gray-200 hover:border-[#0066FF] hover:text-[#0066FF] hover:bg-blue-50/50 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        >
                          <Chrome className="h-5 w-5" />
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => signInWithOAuth("linkedin")}
                          className="w-full border-gray-200 hover:border-[#0066FF] hover:text-[#0066FF] hover:bg-blue-50/50 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        >
                          <Linkedin className="h-5 w-5" />
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => signInWithOAuth("github")}
                          className="w-full border-gray-200 hover:border-[#0066FF] hover:text-[#0066FF] hover:bg-blue-50/50 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        >
                          <Github className="h-5 w-5" />
                        </Button>
                      </motion.div>
                    </div>
                  </motion.form>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-5 mt-6">
                  <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleSignUp}
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="fullname" className="text-gray-900 font-medium">Full Name</Label>
                      <Input
                        id="fullname"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="border-gray-200 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-gray-900 font-medium">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        required
                        className="border-gray-200 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      />
                    </div>
                    
                    {/* Password Field with Validation */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-gray-900 font-medium">Password</Label>
                      <PasswordInput
                        id="signup-password"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        showPassword={showSignUpPassword}
                        onToggle={() => setShowSignUpPassword(!showSignUpPassword)}
                        placeholder="Create a strong password"
                      />
                      
                      {/* Password Requirements */}
                      <AnimatePresence>
                        {signUpPassword && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/60 space-y-2"
                          >
                            <p className="text-xs font-semibold text-gray-700 mb-3">Password Requirements:</p>
                            <ValidationItem isValid={passwordValidation.minLength} text="At least 8 characters" />
                            <ValidationItem isValid={passwordValidation.hasUpperCase} text="One uppercase letter" />
                            <ValidationItem isValid={passwordValidation.hasLowerCase} text="One lowercase letter" />
                            <ValidationItem isValid={passwordValidation.hasNumber} text="One number" />
                            <ValidationItem isValid={passwordValidation.hasSpecialChar} text="One special character" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-gray-900 font-medium">Confirm Password</Label>
                      <PasswordInput
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        showPassword={showConfirmPassword}
                        onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                        placeholder="Re-enter your password"
                      />
                      
                      {/* Password Match Indicator */}
                      <AnimatePresence>
                        {confirmPassword && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-2"
                          >
                            {passwordsMatch ? (
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="font-medium">Passwords match</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-red-600">
                                <XCircle className="h-4 w-4" />
                                <span>Passwords do not match</span>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-gray-900 font-medium">I am a...</Label>
                      <Select value={role} onValueChange={(value) => {
                        setRole(value as UserRole);
                        if (value === "admin") {
                          setSelectedCollege("");
                        }
                        if (value !== "alumni") {
                          setAlumniStartupNumber("");
                        }
                      }}>
                        <SelectTrigger id="role" className="border-gray-200 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 bg-white/80 backdrop-blur-sm">
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

                    {/* Alumni Enrollment / Startup Certificate Number */}
                    <AnimatePresence>
                      {role === "alumni" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2"
                        >
                          <Label htmlFor="alumni-startup-number" className="text-gray-900 font-medium">
                            Alumni Enrollment Number / Startup Certificate Number
                          </Label>
                          <Input
                            id="alumni-startup-number"
                            type="text"
                            placeholder="Enter your enrollment or certificate number"
                            value={alumniStartupNumber}
                            onChange={(e) => setAlumniStartupNumber(e.target.value)}
                            required
                            className="border-gray-200 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                          />
                          <p className="text-xs text-gray-500 font-light">
                            Enter your Alumni Enrollment Number or Startup Certificate Number
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* College Selection */}
                    <AnimatePresence>
                      {role !== "admin" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2"
                        >
                          <Label htmlFor="college" className="text-gray-900 font-medium">
                            {role === "college" ? "College (Cannot be changed later)" : "College"}
                          </Label>
                          <div className="space-y-2">
                            {/* Category Filter */}
                            <Select
                              value={collegeCategoryFilter}
                              onValueChange={(value) => setCollegeCategoryFilter(value as CollegeCategory | "all")}
                            >
                              <SelectTrigger className="border-gray-200 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 bg-white/80 backdrop-blur-sm">
                                <SelectValue placeholder="Filter by category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {collegeCategories.map((cat) => (
                                  <SelectItem key={cat.value} value={cat.value}>
                                    {cat.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {/* College Search Combobox */}
                            <Popover open={collegeSearchOpen} onOpenChange={setCollegeSearchOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={collegeSearchOpen}
                                  className="w-full justify-between border-gray-200 focus:border-[#0066FF] bg-white/80 backdrop-blur-sm hover:bg-gray-50/80"
                                >
                                  {selectedCollege
                                    ? getCollegeById(selectedCollege)?.name || "Select college..."
                                    : "Select college..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Search college..." />
                                  <CommandList>
                                    <CommandEmpty>No college found.</CommandEmpty>
                                    {(() => {
                                      const filteredColleges = collegeCategoryFilter === "all"
                                        ? colleges
                                        : getCollegesByCategory(collegeCategoryFilter);
                                      
                                      const grouped = filteredColleges.reduce((acc, college) => {
                                        if (!acc[college.category]) {
                                          acc[college.category] = [];
                                        }
                                        acc[college.category].push(college);
                                        return acc;
                                      }, {} as Record<CollegeCategory, typeof colleges>);
                                      
                                      return Object.entries(grouped).map(([category, categoryColleges]) => {
                                        const categoryLabel = collegeCategories.find(c => c.value === category)?.label || category;
                                        return (
                                          <CommandGroup key={category} heading={categoryLabel}>
                                            {categoryColleges.map((college) => (
                                              <CommandItem
                                                key={college.id}
                                                value={`${college.name} ${college.location} ${college.state}`}
                                                onSelect={() => {
                                                  setSelectedCollege(college.id);
                                                  setCollegeSearchOpen(false);
                                                }}
                                              >
                                                <Check
                                                  className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedCollege === college.id ? "opacity-100" : "opacity-0"
                                                  )}
                                                />
                                                <div className="flex flex-col">
                                                  <span>{college.name}</span>
                                                  <span className="text-xs text-gray-500">{college.location}, {college.state}</span>
                                                </div>
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        );
                                      });
                                    })()}
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Terms and Conditions Checkbox */}
                    <div className="flex items-start gap-3 pt-2">
                      <Checkbox
                        id="terms-checkbox"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                        className="mt-0.5 border-gray-300 data-[state=checked]:bg-[#0066FF] data-[state=checked]:border-[#0066FF]"
                      />
                      <Label
                        htmlFor="terms-checkbox"
                        className="text-sm text-gray-700 leading-relaxed cursor-pointer font-normal"
                      >
                        I agree to the{" "}
                        <Link
                          to="/terms"
                          className="text-[#0066FF] hover:underline font-semibold"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          Terms of Service
                        </Link>
                        {" "}and{" "}
                        <Link
                          to="/privacy"
                          className="text-[#0066FF] hover:underline font-semibold"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>
                    
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-[#CAFF00] to-[#B8E600] hover:from-[#B8E600] hover:to-[#CAFF00] text-gray-900 font-semibold rounded-full h-12 text-base transition-all duration-300 shadow-lg hover:shadow-xl border-0 disabled:opacity-50 disabled:cursor-not-allowed" 
                        disabled={loading || !isPasswordValid || !passwordsMatch || !agreedToTerms || (role !== "admin" && !selectedCollege) || (role === "alumni" && !alumniStartupNumber.trim())}
                      >
                        {loading ? "Creating account..." : "Sign Up"}
                      </Button>
                    </motion.div>
                    
                    <div className="relative my-6">
                      <Separator className="bg-gray-200" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-white/90 backdrop-blur-sm px-3 text-xs text-gray-500 font-medium">OR</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => signInWithOAuth("google")}
                          className="w-full border-gray-200 hover:border-[#0066FF] hover:text-[#0066FF] hover:bg-blue-50/50 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        >
                          <Chrome className="h-5 w-5" />
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => signInWithOAuth("linkedin")}
                          className="w-full border-gray-200 hover:border-[#0066FF] hover:text-[#0066FF] hover:bg-blue-50/50 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        >
                          <Linkedin className="h-5 w-5" />
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => signInWithOAuth("github")}
                          className="w-full border-gray-200 hover:border-[#0066FF] hover:text-[#0066FF] hover:bg-blue-50/50 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        >
                          <Github className="h-5 w-5" />
                        </Button>
                      </motion.div>
                    </div>
                  </motion.form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
