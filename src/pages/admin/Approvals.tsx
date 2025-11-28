import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { 
  Briefcase, 
  Building2, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Clock,
  AlertTriangle,
  Search,
  RefreshCw,
  GraduationCap,
  UserCheck,
  Hash,
  Mail
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminApprovals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("alumni");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedCollege, setSelectedCollege] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedAlumni, setSelectedAlumni] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewAlumniDialogOpen, setViewAlumniDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Approvals", href: "/admin/approvals" },
    { label: "Colleges", href: "/admin/colleges" },
    { label: "Jobs", href: "/admin/jobs" },
    { label: "Users", href: "/admin/users" },
    { label: "Analytics", href: "/admin/analytics" },
  ];

  // Fetch pending alumni/startups across all colleges
  const { data: pendingAlumni, isLoading: alumniLoading } = useQuery({
    queryKey: ["admin-pending-alumni"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, colleges(name)")
        .eq("role", "alumni")
        .or("alumni_verification_status.is.null,alumni_verification_status.eq.pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch verified alumni count
  const { data: verifiedAlumniCount } = useQuery({
    queryKey: ["admin-verified-alumni-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "alumni")
        .eq("alumni_verification_status", "approved");
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch pending jobs
  const { data: pendingJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["admin-pending-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, profiles!jobs_posted_by_fkey(full_name, email, alumni_verification_status, alumni_startup_number), colleges(name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch unverified colleges
  const { data: unverifiedColleges, isLoading: collegesLoading } = useQuery({
    queryKey: ["admin-unverified-colleges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colleges")
        .select("*, profiles!colleges_admin_id_fkey(full_name, email)")
        .eq("is_verified", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch users without roles or pending verification
  const { data: pendingUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-pending-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*, user_roles(role), colleges(name)")
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (profilesError) throw profilesError;

      const filtered = (profiles || []).filter((profile: any) => {
        const hasRoles = profile.user_roles && profile.user_roles.length > 0;
        const isInactive = profile.is_active === false;
        return !hasRoles || isInactive;
      });

      return filtered;
    },
  });

  // Approve alumni mutation
  const approveAlumniMutation = useMutation({
    mutationFn: async (alumniUserId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          alumni_verification_status: "approved",
          alumni_verified_at: new Date().toISOString(),
          alumni_verified_by: user?.id,
        })
        .eq("user_id", alumniUserId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Alumni Verified",
        description: "The alumni/startup has been verified successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-alumni"] });
      queryClient.invalidateQueries({ queryKey: ["admin-verified-alumni-count"] });
      setViewAlumniDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to verify alumni",
        variant: "destructive",
      });
    },
  });

  // Bulk approve alumni mutation
  const bulkApproveAlumniMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          alumni_verification_status: "approved",
          alumni_verified_at: new Date().toISOString(),
          alumni_verified_by: user?.id,
        })
        .in("user_id", userIds);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Alumni Verified",
        description: `${selectedItems.size} alumni/startups have been verified.`,
      });
      setSelectedItems(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-pending-alumni"] });
      queryClient.invalidateQueries({ queryKey: ["admin-verified-alumni-count"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject alumni mutation
  const rejectAlumniMutation = useMutation({
    mutationFn: async ({ alumniUserId, reason }: { alumniUserId: string; reason: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          alumni_verification_status: "rejected",
          alumni_verified_at: new Date().toISOString(),
          alumni_verified_by: user?.id,
          alumni_rejection_reason: reason,
        })
        .eq("user_id", alumniUserId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Alumni Rejected",
        description: "The alumni/startup verification has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-alumni"] });
      setRejectDialogOpen(false);
      setViewAlumniDialogOpen(false);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject alumni",
        variant: "destructive",
      });
    },
  });

  // Bulk approve jobs
  const bulkApproveJobsMutation = useMutation({
    mutationFn: async (jobIds: string[]) => {
      const { error } = await supabase
        .from("jobs")
        .update({ 
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .in("id", jobIds);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Jobs approved",
        description: `${selectedItems.size} job(s) have been approved.`,
      });
      setSelectedItems(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-pending-jobs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk reject jobs
  const bulkRejectJobsMutation = useMutation({
    mutationFn: async (jobIds: string[]) => {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "rejected" })
        .in("id", jobIds);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Jobs rejected",
        description: `${selectedItems.size} job(s) have been rejected.`,
      });
      setSelectedItems(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-pending-jobs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve/reject single job
  const updateJobStatusMutation = useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: string }) => {
      const updateData: any = { status };
      if (status === "approved") {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user?.id;
      }
      const { error } = await supabase
        .from("jobs")
        .update(updateData)
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({
        title: `Job ${variables.status === "approved" ? "approved" : "rejected"}`,
        description: "The job status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-jobs"] });
      setViewDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify college
  const verifyCollegeMutation = useMutation({
    mutationFn: async (collegeId: string) => {
      const { error } = await supabase
        .from("colleges")
        .update({ is_verified: true })
        .eq("id", collegeId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "College verified",
        description: "The college has been verified.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-unverified-colleges"] });
      setViewDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Assign role to user
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as any });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Role assigned",
        description: "The role has been assigned to the user.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-users"] });
      setViewDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Activate user
  const activateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: true })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "User activated",
        description: "The user has been activated.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-users"] });
      setViewDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const stats = {
    pendingAlumni: pendingAlumni?.length || 0,
    verifiedAlumni: verifiedAlumniCount || 0,
    pendingJobs: pendingJobs?.length || 0,
    unverifiedColleges: unverifiedColleges?.length || 0,
    pendingUsers: pendingUsers?.length || 0,
    total: (pendingAlumni?.length || 0) + (pendingJobs?.length || 0) + (unverifiedColleges?.length || 0) + (pendingUsers?.length || 0),
  };

  const filteredAlumni = pendingAlumni?.filter((alumni: any) =>
    alumni.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alumni.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alumni.alumni_startup_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alumni.colleges?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredJobs = pendingJobs?.filter((job: any) =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.colleges?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredColleges = unverifiedColleges?.filter((college: any) =>
    college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    college.location?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredUsers = pendingUsers?.filter((user: any) =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const toggleItemSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const selectAll = () => {
    if (selectedTab === "alumni") {
      const allIds = filteredAlumni.map((a: any) => a.user_id);
      setSelectedItems(new Set(allIds));
    } else if (selectedTab === "jobs") {
      const allIds = filteredJobs.map((j: any) => j.id);
      setSelectedItems(new Set(allIds));
    } else if (selectedTab === "colleges") {
      const allIds = filteredColleges.map((c: any) => c.id);
      setSelectedItems(new Set(allIds));
    }
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Approvals Center</h1>
          <p className="text-gray-400">Review and approve pending items across the platform</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{stats.total}</div>
                <div className="text-sm text-gray-400">Total Pending</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500 mb-1">{stats.pendingAlumni}</div>
                <div className="text-sm text-gray-400">Pending Alumni</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500 mb-1">{stats.pendingJobs}</div>
                <div className="text-sm text-gray-400">Pending Jobs</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-1">{stats.unverifiedColleges}</div>
                <div className="text-sm text-gray-400">Unverified Colleges</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500 mb-1">{stats.pendingUsers}</div>
                <div className="text-sm text-gray-400">Pending Users</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Bulk Actions */}
        <Card className="glass-hover">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {selectedItems.size > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                  >
                    Clear ({selectedItems.size})
                  </Button>
                  {selectedTab === "alumni" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-500 text-green-500 hover:bg-green-500/10"
                      onClick={() => bulkApproveAlumniMutation.mutate(Array.from(selectedItems))}
                      disabled={bulkApproveAlumniMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Verify Selected
                    </Button>
                  )}
                  {selectedTab === "jobs" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-500 text-green-500 hover:bg-green-500/10"
                        onClick={() => bulkApproveJobsMutation.mutate(Array.from(selectedItems))}
                        disabled={bulkApproveJobsMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve Selected
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-500 hover:bg-red-500/10"
                        onClick={() => bulkRejectJobsMutation.mutate(Array.from(selectedItems))}
                        disabled={bulkRejectJobsMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Selected
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={(v) => { setSelectedTab(v); setSelectedItems(new Set()); }}>
          <TabsList className="glass">
            <TabsTrigger value="alumni">
              <GraduationCap className="h-4 w-4 mr-2" />
              Alumni ({stats.pendingAlumni})
            </TabsTrigger>
            <TabsTrigger value="jobs">
              <Briefcase className="h-4 w-4 mr-2" />
              Jobs ({stats.pendingJobs})
            </TabsTrigger>
            <TabsTrigger value="colleges">
              <Building2 className="h-4 w-4 mr-2" />
              Colleges ({stats.unverifiedColleges})
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users ({stats.pendingUsers})
            </TabsTrigger>
          </TabsList>

          {/* Alumni Tab */}
          <TabsContent value="alumni" className="space-y-4 mt-6">
            {alumniLoading ? (
              <div className="text-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="mt-2 text-gray-400">Loading alumni...</p>
              </div>
            ) : filteredAlumni.length === 0 ? (
              <Card className="glass-hover">
                <CardContent className="pt-12 pb-12 text-center">
                  <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pending alumni verifications</h3>
                  <p className="text-gray-400">All alumni and startups have been reviewed.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                </div>
                <div className="space-y-4">
                  {filteredAlumni.map((alumni: any, idx: number) => (
                    <motion.div
                      key={alumni.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="glass-hover">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Checkbox
                              checked={selectedItems.has(alumni.user_id)}
                              onCheckedChange={() => toggleItemSelection(alumni.user_id)}
                              className="mt-1"
                            />
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={alumni.avatar_url} />
                              <AvatarFallback className="bg-primary/20 text-primary">
                                {alumni.full_name?.charAt(0) || "A"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="text-xl font-bold">{alumni.full_name}</h3>
                                  <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Mail className="h-3 w-3" />
                                    {alumni.email}
                                  </div>
                                </div>
                                <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500">
                                  Pending
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm mb-4">
                                <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
                                  <Hash className="h-4 w-4 text-primary" />
                                  <span className="font-medium">{alumni.alumni_startup_number || "No ID"}</span>
                                </div>
                                {alumni.colleges?.name && (
                                  <Badge variant="outline">
                                    <Building2 className="h-3 w-3 mr-1" />
                                    {alumni.colleges.name}
                                  </Badge>
                                )}
                                <div className="flex items-center gap-1 text-gray-400">
                                  <Clock className="h-3 w-3" />
                                  {new Date(alumni.created_at).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAlumni(alumni);
                                    setViewAlumniDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-green-500 text-green-500 hover:bg-green-500/10"
                                  onClick={() => approveAlumniMutation.mutate(alumni.user_id)}
                                  disabled={approveAlumniMutation.isPending}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Verify
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-500 text-red-500 hover:bg-red-500/10"
                                  onClick={() => {
                                    setSelectedAlumni(alumni);
                                    setRejectDialogOpen(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4 mt-6">
            {jobsLoading ? (
              <div className="text-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="mt-2 text-gray-400">Loading jobs...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <Card className="glass-hover">
                <CardContent className="pt-12 pb-12 text-center">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pending jobs</h3>
                  <p className="text-gray-400">All jobs have been reviewed.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                </div>
                <div className="space-y-4">
                  {filteredJobs.map((job: any, idx: number) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="glass-hover">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Checkbox
                              checked={selectedItems.has(job.id)}
                              onCheckedChange={() => toggleItemSelection(job.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="text-xl font-bold">{job.title}</h3>
                                  <p className="text-gray-400">{job.company_name}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500">
                                    Pending
                                  </Badge>
                                  {job.profiles?.alumni_verification_status !== "approved" && (
                                    <Badge variant="outline" className="border-orange-500 text-orange-500">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Unverified Poster
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                                {job.colleges?.name && (
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {job.colleges.name}
                                  </span>
                                )}
                                {job.profiles?.full_name && (
                                  <span>Posted by {job.profiles.full_name}</span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(job.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-300 line-clamp-2 mb-4">{job.description}</p>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedJob(job);
                                    setViewDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-green-500 text-green-500 hover:bg-green-500/10"
                                  onClick={() => updateJobStatusMutation.mutate({ jobId: job.id, status: "approved" })}
                                  disabled={updateJobStatusMutation.isPending}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-500 text-red-500 hover:bg-red-500/10"
                                  onClick={() => updateJobStatusMutation.mutate({ jobId: job.id, status: "rejected" })}
                                  disabled={updateJobStatusMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Colleges Tab */}
          <TabsContent value="colleges" className="space-y-4 mt-6">
            {collegesLoading ? (
              <div className="text-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="mt-2 text-gray-400">Loading colleges...</p>
              </div>
            ) : filteredColleges.length === 0 ? (
              <Card className="glass-hover">
                <CardContent className="pt-12 pb-12 text-center">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No unverified colleges</h3>
                  <p className="text-gray-400">All colleges have been verified.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredColleges.map((college: any, idx: number) => (
                  <motion.div
                    key={college.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="glass-hover">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-1">{college.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                              {college.location && <span>{college.location}</span>}
                              {college.website && (
                                <a href={college.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  {college.website}
                                </a>
                              )}
                              {college.profiles?.full_name && (
                                <span>Admin: {college.profiles.full_name}</span>
                              )}
                            </div>
                            <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Unverified
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCollege(college);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-green-500 text-green-500 hover:bg-green-500/10"
                              onClick={() => verifyCollegeMutation.mutate(college.id)}
                              disabled={verifyCollegeMutation.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Verify
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 mt-6">
            {usersLoading ? (
              <div className="text-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="mt-2 text-gray-400">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <Card className="glass-hover">
                <CardContent className="pt-12 pb-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pending users</h3>
                  <p className="text-gray-400">All users have been processed.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((userItem: any, idx: number) => (
                  <motion.div
                    key={userItem.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="glass-hover">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-1">{userItem.full_name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                              <span>{userItem.email}</span>
                              {userItem.colleges?.name && <span>• {userItem.colleges.name}</span>}
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                              {userItem.user_roles && userItem.user_roles.length > 0 ? (
                                userItem.user_roles.map((ur: any) => (
                                  <Badge key={ur.role} variant="outline">{ur.role}</Badge>
                                ))
                              ) : (
                                <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                                  No Role
                                </Badge>
                              )}
                              {userItem.is_active === false && (
                                <Badge variant="outline" className="border-red-500 text-red-500">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(userItem);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Manage
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* View Alumni Dialog */}
        <Dialog open={viewAlumniDialogOpen} onOpenChange={setViewAlumniDialogOpen}>
          <DialogContent className="max-w-lg">
            {selectedAlumni && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedAlumni.avatar_url} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {selectedAlumni.full_name?.charAt(0) || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div>{selectedAlumni.full_name}</div>
                      <div className="text-sm font-normal text-gray-400">{selectedAlumni.email}</div>
                    </div>
                  </DialogTitle>
                  <DialogDescription>
                    Review alumni/startup verification request
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider">
                      Alumni Enrollment / Startup Certificate Number
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Hash className="h-5 w-5 text-primary" />
                      <span className="text-lg font-semibold">
                        {selectedAlumni.alumni_startup_number || "Not provided"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-400 uppercase tracking-wider">College</Label>
                      <p className="text-sm mt-1">{selectedAlumni.colleges?.name || "Not specified"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400 uppercase tracking-wider">Registration Date</Label>
                      <p className="text-sm mt-1">{new Date(selectedAlumni.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-500">Admin Verification</p>
                        <p className="text-xs text-gray-400 mt-1">
                          As an admin, you can verify this alumni/startup across any institution.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                    onClick={() => setRejectDialogOpen(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => approveAlumniMutation.mutate(selectedAlumni.user_id)}
                    disabled={approveAlumniMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Verify Alumni
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject Alumni Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reject Verification</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this alumni/startup verification.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="e.g., Alumni enrollment number not found in records..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedAlumni) {
                    rejectAlumniMutation.mutate({
                      alumniUserId: selectedAlumni.user_id,
                      reason: rejectionReason,
                    });
                  }
                }}
                disabled={rejectAlumniMutation.isPending || !rejectionReason.trim()}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedTab === "jobs" && selectedJob && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedJob.title}</DialogTitle>
                  <DialogDescription>
                    {selectedJob.company_name} • {selectedJob.colleges?.name || "No college"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {selectedJob.profiles?.alumni_verification_status !== "approved" && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-orange-500">Unverified Poster</p>
                          <p className="text-xs text-gray-400 mt-1">
                            The alumni/startup who posted this job has not been verified yet.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedJob.description && (
                    <div>
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">{selectedJob.description}</p>
                    </div>
                  )}
                  {selectedJob.requirements && (
                    <div>
                      <h4 className="font-semibold mb-2">Requirements</h4>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">{selectedJob.requirements}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => updateJobStatusMutation.mutate({ jobId: selectedJob.id, status: "approved" })}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10"
                      onClick={() => updateJobStatusMutation.mutate({ jobId: selectedJob.id, status: "rejected" })}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </>
            )}

            {selectedTab === "colleges" && selectedCollege && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedCollege.name}</DialogTitle>
                  <DialogDescription>College verification details</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Location</h4>
                    <p className="text-sm text-gray-300">{selectedCollege.location || "Not specified"}</p>
                  </div>
                  {selectedCollege.website && (
                    <div>
                      <h4 className="font-semibold mb-2">Website</h4>
                      <a href={selectedCollege.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                        {selectedCollege.website}
                      </a>
                    </div>
                  )}
                  {selectedCollege.profiles?.full_name && (
                    <div>
                      <h4 className="font-semibold mb-2">Admin</h4>
                      <p className="text-sm text-gray-300">{selectedCollege.profiles.full_name} ({selectedCollege.profiles.email})</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => verifyCollegeMutation.mutate(selectedCollege.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Verify College
                    </Button>
                  </div>
                </div>
              </>
            )}

            {selectedTab === "users" && selectedUser && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedUser.full_name}</DialogTitle>
                  <DialogDescription>User management</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Email</h4>
                    <p className="text-sm text-gray-300">{selectedUser.email}</p>
                  </div>
                  {selectedUser.colleges?.name && (
                    <div>
                      <h4 className="font-semibold mb-2">College</h4>
                      <p className="text-sm text-gray-300">{selectedUser.colleges.name}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold mb-2">Current Roles</h4>
                    <div className="flex gap-2 mb-4">
                      {selectedUser.user_roles && selectedUser.user_roles.length > 0 ? (
                        selectedUser.user_roles.map((ur: any) => (
                          <Badge key={ur.role} variant="outline">{ur.role}</Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-500">No Role</Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold mb-2">Assign Role</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {["student", "alumni", "college", "admin"].map((role) => (
                        <Button
                          key={role}
                          variant="outline"
                          size="sm"
                          onClick={() => assignRoleMutation.mutate({ userId: selectedUser.user_id, role })}
                          disabled={selectedUser.user_roles?.some((ur: any) => ur.role === role)}
                        >
                          Assign {role}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {selectedUser.is_active === false && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => activateUserMutation.mutate(selectedUser.user_id)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Activate User
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
