import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useColleges } from "@/hooks/useColleges";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, Save, Lock, GraduationCap, MapPin } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { collegeCategories, getCollegesByCategory, type CollegeCategory } from "@/lib/colleges";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

interface ProfileData {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  year: number | null;
  department: string | null;
  college_id: string | null;
  registration_number: string | null;
  college: {
    id: string;
    name: string;
    location: string | null;
  } | null;
}

export default function StudentProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { staticColleges, getCollegeById, findOrCreateCollege, findStaticCollegeByName } = useColleges();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [collegeSearchOpen, setCollegeSearchOpen] = useState(false);
  const [collegeCategoryFilter, setCollegeCategoryFilter] = useState<CollegeCategory | "all">("all");

  const navItems = [
    { label: "Dashboard", href: "/student/dashboard" },
    { label: "Profile", href: "/student/profile" },
    { label: "Resume", href: "/student/resume" },
    { label: "LinkedIn", href: "/student/linkedin" },
    { label: "Job Board", href: "/student/jobs" },
    { label: "My Applications", href: "/student/applications" },
    { label: "Career Quiz", href: "/student/career-quiz" },
    { label: "Career Paths", href: "/student/career-paths" },
    { label: "Skills", href: "/student/skills-recommendations" },
    { label: "Events", href: "/student/events" },
    { label: "Leaderboard", href: "/student/leaderboard" },
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
        year: (profileData as any).year || null,
        department: (profileData as any).department || null,
        college_id: profileData.college_id || null,
        registration_number: (profileData as any).registration_number || null,
        college: collegeData,
      };
    },
    enabled: !!user,
  });

  // Track selected college for the dropdown (using static college ID)
  const [selectedCollege, setSelectedCollege] = useState<string>("");
  
  // Update selected college when profile changes - find matching static college
  useEffect(() => {
    if (profile?.college) {
      // Try to find a matching static college by name
      const matchingStaticCollege = findStaticCollegeByName(profile.college.name);
      if (matchingStaticCollege) {
        setSelectedCollege(matchingStaticCollege.id);
      } else {
        // If no match found in static list, clear selection (will show database college name)
        setSelectedCollege("");
      }
    } else {
      setSelectedCollege("");
    }
  }, [profile, findStaticCollegeByName]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
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

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async ({ currentPwd, newPwd }: { currentPwd: string; newPwd: string }) => {
      if (!user?.email) throw new Error("Not authenticated");

      // Verify current password by attempting to sign in
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

  // College update mutation
  const updateCollegeMutation = useMutation({
    mutationFn: async (collegeId: string) => {
      if (!user) throw new Error("Not authenticated");
      const college = getCollegeById(collegeId);
      if (!college) throw new Error("College not found");

      // Use the centralized findOrCreateCollege function
      const finalCollegeId = await findOrCreateCollege(college.name, college.location);

      if (!finalCollegeId) {
        throw new Error("Failed to find or create college");
      }

      // Update profile with college_id
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          college_id: finalCollegeId,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      setCollegeSearchOpen(false);
      toast({
        title: "Success",
        description: "College updated successfully!",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update college",
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
    year: undefined as number | undefined,
    department: "",
  });

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
        year: profile.year || undefined,
        department: profile.department || "",
      });
    }
  }, [profile]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  // Get the display name for the current college
  const getCurrentCollegeDisplayName = () => {
    // If we have a selected college from the static list
    if (selectedCollege) {
      const staticCollege = getCollegeById(selectedCollege);
      if (staticCollege) return staticCollege.name;
    }
    
    // Otherwise, use the database college name directly
    if (profile?.college?.name) {
      return profile.college.name;
    }
    
    return "Select college...";
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

                  {profile?.registration_number && (
                    <div className="space-y-2">
                      <Label htmlFor="registration_number">Registration Number</Label>
                      <Input
                        id="registration_number"
                        value={profile.registration_number}
                        disabled
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500">Registration number cannot be changed</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <Label htmlFor="year">Year</Label>
                      <Select
                        value={formData.year?.toString() || ""}
                        onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) || undefined })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st Year</SelectItem>
                          <SelectItem value="2">2nd Year</SelectItem>
                          <SelectItem value="3">3rd Year</SelectItem>
                          <SelectItem value="4">4th Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g., Computer Science, Mechanical Engineering"
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
                <CardTitle>College Information</CardTitle>
                <CardDescription>Select or change your college</CardDescription>
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
                  </div>
                )}

                {/* Show message if no college is set */}
                {!profile?.college && !profile?.college_id && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-yellow-800 text-sm">
                      No college is currently set. Please select your college below.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>College Category</Label>
                    <Select
                      value={collegeCategoryFilter}
                      onValueChange={(value) => setCollegeCategoryFilter(value as CollegeCategory | "all")}
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                  </div>

                  <div className="space-y-2">
                    <Label>Select College</Label>
                    <Popover open={collegeSearchOpen} onOpenChange={setCollegeSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={collegeSearchOpen}
                          className="w-full justify-between"
                        >
                          {getCurrentCollegeDisplayName()}
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
                                ? staticColleges
                                : getCollegesByCategory(collegeCategoryFilter);
                              
                              const grouped = filteredColleges.reduce((acc, college) => {
                                if (!acc[college.category]) {
                                  acc[college.category] = [];
                                }
                                acc[college.category].push(college);
                                return acc;
                              }, {} as Record<CollegeCategory, typeof staticColleges>);
                              
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
                                          updateCollegeMutation.mutate(college.id);
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
                    {updateCollegeMutation.isPending && (
                      <p className="text-sm text-gray-500 flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating college...
                      </p>
                    )}
                  </div>
                </div>
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
