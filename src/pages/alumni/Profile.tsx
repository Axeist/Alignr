import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useColleges } from "@/hooks/useColleges";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, Save, Lock, GraduationCap, MapPin, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { searchColleges } from "@/lib/colleges";

interface ProfileData {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  college_id: string | null;
  college_changed_count: number | null;
  college: {
    id: string;
    name: string;
    location: string | null;
  } | null;
}

export default function AlumniProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { dbColleges, findOrCreateCollege } = useColleges();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navItems = [
    { label: "Dashboard", href: "/alumni/dashboard" },
    { label: "Post Job", href: "/alumni/post-job" },
    { label: "My Jobs", href: "/alumni/jobs" },
    { label: "Applications", href: "/alumni/applications" },
    { label: "Candidates", href: "/alumni/candidates" },
    { label: "Profile", href: "/alumni/profile" },
  ];

  // Fetch profile data with college information
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async (): Promise<ProfileData | null> => {
      if (!user) return null;
      
      // First fetch the profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (profileError) throw profileError;
      
      // If college_id exists, fetch college details separately
      let collegeData = null;
      if (profileData?.college_id) {
        const { data: college, error: collegeError } = await supabase
          .from("colleges")
          .select("id, name, location")
          .eq("id", profileData.college_id)
          .single();
        
        if (!collegeError && college) {
          collegeData = college;
        }
      }
      
      return {
        user_id: profileData.user_id,
        full_name: profileData.full_name || "",
        email: profileData.email || "",
        phone: profileData.phone || null,
        bio: profileData.bio || null,
        linkedin_url: profileData.linkedin_url || null,
        github_url: profileData.github_url || null,
        portfolio_url: profileData.portfolio_url || null,
        college_id: profileData.college_id || null,
        college_changed_count: (profileData as any).college_changed_count || null,
        college: collegeData,
      };
    },
    enabled: !!user,
  });


  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!user) throw new Error("Not authenticated");
      
      // Separate college update from other updates
      const { college_id, ...otherUpdates } = updates;
      
      // Update basic profile fields
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          ...otherUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
      if (profileError) throw profileError;
      
      // Handle college update separately if changed
      if (college_id && college_id !== profile?.college_id) {
        const { error: collegeError } = await supabase.rpc("update_profile_college", {
          p_user_id: user.id,
          p_college_id: college_id,
          p_role: "alumni",
        });
        if (collegeError) throw collegeError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["db-colleges"] });
      toast({
        title: "Success",
        description: "Profile updated successfully!",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // College creation/selection mutation
  const handleCollegeSelection = async (collegeName: string, location?: string) => {
    if (!user) return;
    
    try {
      // Use the centralized findOrCreateCollege function
      const collegeId = await findOrCreateCollege(collegeName, location);
      
      if (!collegeId) {
        throw new Error("Failed to find or create college");
      }
      
      // Update profile with college using the RPC function
      const { error: updateError } = await supabase.rpc("update_profile_college", {
        p_user_id: user.id,
        p_college_id: collegeId,
        p_role: "alumni",
      });
      
      if (updateError) throw updateError;
      
      setSelectedCollegeId(collegeId);
      setFormData({ ...formData, college_id: collegeId });
      
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["db-colleges"] });
      
      toast({
        title: "Success",
        description: "College updated successfully!",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update college",
        variant: "destructive",
      });
    }
  };

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async ({ currentPwd, newPwd }: { currentPwd: string; newPwd: string }) => {
      if (!user?.email) throw new Error("Not authenticated");

      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPwd,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPwd,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Success",
        description: "Password changed successfully!",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate({ currentPwd: currentPassword, newPwd: newPassword });
  };

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    bio: "",
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
    college_id: "",
  });
  
  const [collegeSearchQuery, setCollegeSearchQuery] = useState("");
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>("");

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        linkedin_url: profile.linkedin_url || "",
        github_url: profile.github_url || "",
        portfolio_url: profile.portfolio_url || "",
        college_id: profile.college_id || "",
      });
      setSelectedCollegeId(profile.college_id || "");
    }
  }, [profile]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">General Information</TabsTrigger>
            <TabsTrigger value="college">College</TabsTrigger>
            <TabsTrigger value="password">Change Password</TabsTrigger>
          </TabsList>

          {/* General Information Tab */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        disabled
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500">Email cannot be changed</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 9876543210"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                      <Input
                        id="linkedin_url"
                        type="url"
                        value={formData.linkedin_url}
                        onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="github_url">GitHub URL</Label>
                      <Input
                        id="github_url"
                        type="url"
                        value={formData.github_url}
                        onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                        placeholder="https://github.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="portfolio_url">Portfolio URL</Label>
                      <Input
                        id="portfolio_url"
                        type="url"
                        value={formData.portfolio_url}
                        onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                        placeholder="https://yourportfolio.com"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* College Tab */}
          <TabsContent value="college" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  College Information
                </CardTitle>
                <CardDescription>
                  {profile?.college_changed_count && profile.college_changed_count > 0
                    ? "College can only be changed once. Contact admin for further changes."
                    : "Select or add your college. You can change it once."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current College Display - Always show if we have college data */}
                {profile?.college && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <GraduationCap className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">Current College</h4>
                        <p className="text-lg font-medium text-blue-700">{profile.college.name}</p>
                        {profile.college.location && (
                          <div className="flex items-center gap-1 mt-1 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">{profile.college.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {profile.college_changed_count && profile.college_changed_count > 0 && (
                      <Alert className="mt-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          College has been changed {profile.college_changed_count} time(s). 
                          Further changes require admin approval.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {/* Show message if no college is set */}
                {!profile?.college && !profile?.college_id && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No college assigned. Please select or add your college below.
                    </AlertDescription>
                  </Alert>
                )}

                {/* College Selection - Only show if can still change */}
                {(!profile?.college_changed_count || profile.college_changed_count === 0) && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{profile?.college ? "Change College" : "Search and Add College"}</Label>
                      <Input
                        placeholder="Search for college..."
                        value={collegeSearchQuery}
                        onChange={(e) => setCollegeSearchQuery(e.target.value)}
                      />
                      {collegeSearchQuery && (
                        <div className="border rounded-lg max-h-60 overflow-y-auto">
                          {searchColleges(collegeSearchQuery).slice(0, 10).map((college) => (
                            <div
                              key={college.id}
                              className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                              onClick={() => {
                                handleCollegeSelection(college.name, college.location);
                                setCollegeSearchQuery("");
                              }}
                            >
                              <p className="font-medium">{college.name}</p>
                              <p className="text-sm text-gray-500">{college.location}, {college.state}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Or select from existing colleges in database</Label>
                      <Select
                        value={selectedCollegeId}
                        onValueChange={(value) => {
                          if (value) {
                            const college = dbColleges?.find(c => c.id === value);
                            if (college) {
                              handleCollegeSelection(college.name, college.location || undefined);
                            }
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select college" />
                        </SelectTrigger>
                        <SelectContent>
                          {dbColleges?.map((college) => (
                            <SelectItem key={college.id} value={college.id}>
                              {college.name} {college.location && `- ${college.location}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Change Password Tab */}
          <TabsContent value="password" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">Must be at least 8 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={changePasswordMutation.isPending}>
                    {changePasswordMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Changing Password...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
