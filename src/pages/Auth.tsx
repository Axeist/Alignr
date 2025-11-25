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
import { Github, Linkedin, Chrome } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithOAuth, user, userRole, getDashboardPath, fetchUserRole } = useAuth();
  const [loading, setLoading] = useState(false);

  // Sign In State
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up State
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("student");

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

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-white/20 bg-[#0F172A]/80 backdrop-blur-md glass">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <img
                src="https://iili.io/fqdZCfn.png"
                alt="Alignr Logo"
                className="h-16 w-auto"
              />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#CAFF00] via-[#FFFF00] to-[#CAFF00] bg-clip-text text-transparent">
              Alignr
            </CardTitle>
            <CardDescription className="text-gray-400">Your AI-powered career ecosystem</CardDescription>
          </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    className="glass border-white/20 focus:border-[#CAFF00] focus:ring-[#CAFF00]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    className="glass border-white/20 focus:border-[#CAFF00] focus:ring-[#CAFF00]"
                  />
                </div>
                <Button type="submit" className="w-full gradient-accent text-black font-semibold glow-neon" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
                <div className="relative my-4">
                  <Separator />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-background px-2 text-xs text-muted-foreground">OR</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => signInWithOAuth("google")}
                    className="w-full border-white/20 hover:border-[#CAFF00] hover:text-[#CAFF00]"
                  >
                    <Chrome className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => signInWithOAuth("linkedin")}
                    className="w-full border-white/20 hover:border-[#CAFF00] hover:text-[#CAFF00]"
                  >
                    <Linkedin className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => signInWithOAuth("github")}
                    className="w-full border-white/20 hover:border-[#CAFF00] hover:text-[#CAFF00]"
                  >
                    <Github className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullname">Full Name</Label>
                  <Input
                    id="fullname"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="glass border-white/20 focus:border-[#CAFF00] focus:ring-[#CAFF00]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    className="glass border-white/20 focus:border-[#CAFF00] focus:ring-[#CAFF00]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                    minLength={6}
                    className="glass border-white/20 focus:border-[#CAFF00] focus:ring-[#CAFF00]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">I am a...</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                    <SelectTrigger id="role" className="glass border-white/20 focus:border-[#CAFF00]">
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
                <Button type="submit" className="w-full gradient-accent text-black font-semibold glow-neon" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
                <div className="relative my-4">
                  <Separator />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-background px-2 text-xs text-muted-foreground">OR</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => signInWithOAuth("google")}
                    className="w-full border-white/20 hover:border-[#CAFF00] hover:text-[#CAFF00]"
                  >
                    <Chrome className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => signInWithOAuth("linkedin")}
                    className="w-full border-white/20 hover:border-[#CAFF00] hover:text-[#CAFF00]"
                  >
                    <Linkedin className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => signInWithOAuth("github")}
                    className="w-full border-white/20 hover:border-[#CAFF00] hover:text-[#CAFF00]"
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
