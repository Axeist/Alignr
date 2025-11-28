import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Clock,
  Users,
  GraduationCap,
  Building2,
  Search,
  UserCheck,
  UserX,
  AlertTriangle,
  Mail,
  Hash
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";

export default function CollegeApprovals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("alumni");
  const [searchQuery, setSearchQuery] = useState("");
  const [alumniFilter, setAlumniFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [jobsFilter, setJobsFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedAlumni, setSelectedAlumni] = useState<any>(null);
  const [viewJobDialogOpen, setViewJobDialogOpen] = useState(false);
  const [viewAlumniDialogOpen, setViewAlumniDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const navItems = [
    { label: "Dashboard", href: "/college/dashboard" },
    { label: "Students", href: "/college/students" },
    { label: "Placement Drives", href: "/college/drives" },
    { label: "Events", href: "/college/events" },
    { label: "Analytics", href: "/college/analytics" },
    { label: "Approvals", href: "/college/approvals" },
    { label: "Profile", href: "/college/profile" },
  ];

  // Fetch college profile
  const { data: profile } = useQuery({
    queryKey: ["college-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*, colleges(*)")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const collegeId = profile?.college_id;

  // Fetch all alumni/startups for the college (both pending and verified)
  const { data: allAlumni, isLoading: alumniLoading, refetch: refetchAlumni } = useQuery({
    queryKey: ["all-alumni", collegeId],
    queryFn: async () => {
      if (!collegeId) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("college_id", collegeId)
        .eq("role", "alumni")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!collegeId,
  });

  // Separate alumni by status
  const pendingAlumni = allAlumni?.filter(
    (alumni: any) => !alumni.alumni_verification_status || alumni.alumni_verification_status === "pending"
  ) || [];
  
  const verifiedAlumni = allAlumni?.filter(
    (alumni: any) => alumni.alumni_verification_status === "approved"
  ) || [];

  const rejectedAlumni = allAlumni?.filter(
    (alumni: any) => alumni.alumni_verification_status === "rejected"
  ) || [];

  // Fetch all jobs using the database function that ensures college match
  const { data: allJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["all-jobs", collegeId],
    queryFn: async () => {
      if (!collegeId) return [];
      const { data, error } = await supabase
        .rpc("get_all_jobs_for_college", { p_college_id: collegeId });
      if (error) throw error;
      // Transform the data to match the expected format
      return (data || []).map((job: any) => ({
        ...job,
        profiles: {
          full_name: job.poster_full_name,
          email: job.poster_email,
          alumni_verification_status: job.poster_alumni_status,
          alumni_startup_number: job.poster_alumni_number,
        },
      }));
    },
    enabled: !!collegeId,
  });

  // Separate jobs by status
  const pendingJobs = allJobs?.filter((job: any) => job.status === "pending") || [];
  const approvedJobs = allJobs?.filter((job: any) => job.status === "approved") || [];
  const rejectedJobs = allJobs?.filter((job: any) => job.status === "rejected") || [];


  // Approve alumni mutation
  const approveAlumniMutation = useMutation({
    mutationFn: async (alumniUserId: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      try {
        // Use RPC function for proper permission handling
        const { data, error } = await supabase.rpc("approve_alumni", {
          p_user_id: alumniUserId,
          p_approver_id: user.id,
        });
        
        if (error) {
          console.error("Approve alumni RPC error:", error);
          throw error;
        }
        
        if (data !== true) {
          console.warn("Approve alumni returned unexpected value:", data);
        }
        
        // Also ensure profile is active
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ is_active: true })
          .eq("user_id", alumniUserId);
        
        if (updateError) {
          console.error("Failed to activate profile:", updateError);
          throw updateError;
        }
      } catch (err: any) {
        console.error("Approve alumni mutation error:", err);
        throw err;
      }
    },
    onMutate: async (alumniUserId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["all-alumni", collegeId] });
      
      // Snapshot the previous value
      const previousAlumni = queryClient.getQueryData(["all-alumni", collegeId]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(["all-alumni", collegeId], (old: any) => {
        if (!old) return old;
        return old.map((alumni: any) =>
          alumni.user_id === alumniUserId
            ? {
                ...alumni,
                alumni_verification_status: "approved",
                alumni_verified_at: new Date().toISOString(),
                alumni_verified_by: user?.id,
                is_active: true,
              }
            : alumni
        );
      });
      
      return { previousAlumni };
    },
    onSuccess: async () => {
      toast({
        title: "Alumni Verified",
        description: "The alumni/startup has been verified successfully.",
      });
      // Refetch to ensure we have the latest data
      await queryClient.refetchQueries({ queryKey: ["all-alumni", collegeId] });
      setViewAlumniDialogOpen(false);
    },
    onError: (error: any, alumniUserId: string, context: any) => {
      // Rollback on error
      if (context?.previousAlumni) {
        queryClient.setQueryData(["all-alumni", collegeId], context.previousAlumni);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to verify alumni",
        variant: "destructive",
      });
    },
  });

  // Reject alumni mutation
  const rejectAlumniMutation = useMutation({
    mutationFn: async ({ alumniUserId, reason }: { alumniUserId: string; reason: string }) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      try {
        // Use RPC function for proper permission handling
        const { data, error } = await supabase.rpc("reject_alumni", {
          p_user_id: alumniUserId,
          p_approver_id: user.id,
          p_reason: reason || null,
        });
        
        if (error) {
          console.error("Reject alumni RPC error:", error);
          throw error;
        }
        
        if (data !== true) {
          console.warn("Reject alumni returned unexpected value:", data);
        }
      } catch (err: any) {
        console.error("Reject alumni mutation error:", err);
        throw err;
      }
    },
    onMutate: async ({ alumniUserId }: { alumniUserId: string; reason: string }) => {
      await queryClient.cancelQueries({ queryKey: ["all-alumni", collegeId] });
      const previousAlumni = queryClient.getQueryData(["all-alumni", collegeId]);
      
      queryClient.setQueryData(["all-alumni", collegeId], (old: any) => {
        if (!old) return old;
        return old.map((alumni: any) =>
          alumni.user_id === alumniUserId
            ? {
                ...alumni,
                alumni_verification_status: "rejected",
                alumni_verified_at: new Date().toISOString(),
                alumni_verified_by: user?.id,
              }
            : alumni
        );
      });
      
      return { previousAlumni };
    },
    onSuccess: async () => {
      toast({
        title: "Alumni Rejected",
        description: "The alumni/startup verification has been rejected.",
      });
      await queryClient.refetchQueries({ queryKey: ["all-alumni", collegeId] });
      setRejectDialogOpen(false);
      setViewAlumniDialogOpen(false);
      setRejectionReason("");
    },
    onError: (error: any, variables: any, context: any) => {
      if (context?.previousAlumni) {
        queryClient.setQueryData(["all-alumni", collegeId], context.previousAlumni);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to reject alumni",
        variant: "destructive",
      });
    },
  });

  // Deactivate alumni mutation
  const deactivateAlumniMutation = useMutation({
    mutationFn: async (alumniUserId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_active: false,
        })
        .eq("user_id", alumniUserId);
      if (error) throw error;
    },
    onMutate: async (alumniUserId: string) => {
      await queryClient.cancelQueries({ queryKey: ["all-alumni", collegeId] });
      const previousAlumni = queryClient.getQueryData(["all-alumni", collegeId]);
      
      queryClient.setQueryData(["all-alumni", collegeId], (old: any) => {
        if (!old) return old;
        return old.map((alumni: any) =>
          alumni.user_id === alumniUserId
            ? { ...alumni, is_active: false }
            : alumni
        );
      });
      
      return { previousAlumni };
    },
    onSuccess: async () => {
      toast({
        title: "Alumni Deactivated",
        description: "The alumni/startup profile has been deactivated.",
      });
      await queryClient.refetchQueries({ queryKey: ["all-alumni", collegeId] });
    },
    onError: (error: any, alumniUserId: string, context: any) => {
      if (context?.previousAlumni) {
        queryClient.setQueryData(["all-alumni", collegeId], context.previousAlumni);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate alumni",
        variant: "destructive",
      });
    },
  });

  // Approve job mutation using the database function
  const approveJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .rpc("approve_job", {
          p_job_id: jobId,
          p_approver_id: user.id,
        });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Job Approved",
        description: "The job has been approved and is now visible to students.",
      });
      queryClient.invalidateQueries({ queryKey: ["all-jobs", collegeId] });
      queryClient.invalidateQueries({ queryKey: ["alumni-jobs"] }); // Invalidate alumni jobs so they see the status update
      setViewJobDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve job",
        variant: "destructive",
      });
    },
  });

  // Reject job mutation using the database function
  const rejectJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .rpc("reject_job", {
          p_job_id: jobId,
          p_approver_id: user.id,
          p_reason: null, // Can be extended to accept a reason
        });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Job Rejected",
        description: "The job has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["all-jobs", collegeId] });
      queryClient.invalidateQueries({ queryKey: ["alumni-jobs"] }); // Invalidate alumni jobs so they see the status update
      setViewJobDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject job",
        variant: "destructive",
      });
    },
  });

  const stats = {
    pendingAlumni: pendingAlumni?.length || 0,
    verifiedAlumni: verifiedAlumni?.length || 0,
    rejectedAlumni: rejectedAlumni?.length || 0,
    totalAlumni: allAlumni?.length || 0,
    pendingJobs: pendingJobs?.length || 0,
    approvedJobs: approvedJobs?.length || 0,
    rejectedJobs: rejectedJobs?.length || 0,
    totalJobs: allJobs?.length || 0,
  };

  // Filter alumni based on selected filter
  const getFilteredAlumni = () => {
    let filtered = allAlumni || [];
    
    if (alumniFilter === "pending") {
      filtered = pendingAlumni;
    } else if (alumniFilter === "approved") {
      filtered = verifiedAlumni;
    } else if (alumniFilter === "rejected") {
      filtered = rejectedAlumni;
    }
    
    // Apply search filter
    return filtered.filter((alumni: any) =>
      alumni.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alumni.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alumni.alumni_startup_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredAlumni = getFilteredAlumni();

  // Filter jobs based on selected filter
  const getFilteredJobs = () => {
    let filtered = allJobs || [];
    
    if (jobsFilter === "pending") {
      filtered = pendingJobs;
    } else if (jobsFilter === "approved") {
      filtered = approvedJobs;
    } else if (jobsFilter === "rejected") {
      filtered = rejectedJobs;
    }
    
    // Apply search filter
    return filtered.filter((job: any) =>
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredJobs = getFilteredJobs();

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Approvals Center</h1>
          <p className="text-gray-400">
            Verify alumni/startups and approve job postings for your institution
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-500/20">
                  <UserCheck className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-500">{stats.pendingAlumni}</div>
                  <div className="text-sm text-gray-400">Pending Alumni</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/20">
                  <GraduationCap className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-500">{stats.verifiedAlumni}</div>
                  <div className="text-sm text-gray-400">Verified Alumni</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-red-500/20">
                  <UserX className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-500">{stats.rejectedAlumni}</div>
                  <div className="text-sm text-gray-400">Rejected Alumni</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/20">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-500">{stats.totalAlumni}</div>
                  <div className="text-sm text-gray-400">Total Alumni</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-500/20">
                  <Briefcase className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-500">{stats.pendingJobs}</div>
                  <div className="text-sm text-gray-400">Pending Jobs</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/20">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-500">{stats.approvedJobs}</div>
                  <div className="text-sm text-gray-400">Approved Jobs</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-red-500/20">
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-500">{stats.rejectedJobs}</div>
                  <div className="text-sm text-gray-400">Rejected Jobs</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-500/20">
                  <Briefcase className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-500">{stats.totalJobs}</div>
                  <div className="text-sm text-gray-400">Total Jobs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="glass-hover">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search alumni, startups, or jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="glass">
            <TabsTrigger value="alumni">
              <Users className="h-4 w-4 mr-2" />
              Alumni/Startups ({stats.totalAlumni})
            </TabsTrigger>
            <TabsTrigger value="jobs">
              <Briefcase className="h-4 w-4 mr-2" />
              Job Postings ({stats.totalJobs})
            </TabsTrigger>
          </TabsList>

          {/* Alumni/Startups Tab */}
          <TabsContent value="alumni" className="space-y-4 mt-6">
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={alumniFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setAlumniFilter("all")}
              >
                All ({stats.totalAlumni})
              </Button>
              <Button
                variant={alumniFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setAlumniFilter("pending")}
                className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 border-yellow-500"
              >
                Pending ({stats.pendingAlumni})
              </Button>
              <Button
                variant={alumniFilter === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => setAlumniFilter("approved")}
                className="bg-green-500/20 hover:bg-green-500/30 text-green-500 border-green-500"
              >
                Verified ({stats.verifiedAlumni})
              </Button>
              <Button
                variant={alumniFilter === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setAlumniFilter("rejected")}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-500 border-red-500"
              >
                Rejected ({stats.rejectedAlumni})
              </Button>
            </div>
            {alumniLoading ? (
              <div className="text-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="mt-2 text-gray-400">Loading alumni...</p>
              </div>
            ) : filteredAlumni.length === 0 ? (
              <Card className="glass-hover">
                <CardContent className="pt-12 pb-12 text-center">
                  <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No alumni found</h3>
                  <p className="text-gray-400">
                    {searchQuery ? "No alumni match your search criteria." : "No alumni or startups have registered yet."}
                  </p>
                </CardContent>
              </Card>
            ) : (
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
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={alumni.avatar_url} />
                            <AvatarFallback className="bg-primary/20 text-primary text-lg">
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
                              {alumni.alumni_verification_status === "approved" ? (
                                <Badge className="bg-green-500/20 text-green-500 border-green-500">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : alumni.alumni_verification_status === "rejected" ? (
                                <Badge className="bg-red-500/20 text-red-500 border-red-500">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Rejected
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500">
                                  Pending Verification
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm mb-4">
                              <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
                                <Hash className="h-4 w-4 text-primary" />
                                <span className="font-medium">{alumni.alumni_startup_number || "No ID provided"}</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-400">
                                <Clock className="h-3 w-3" />
                                {alumni.alumni_verified_at 
                                  ? `Verified ${new Date(alumni.alumni_verified_at).toLocaleDateString()}`
                                  : `Registered ${new Date(alumni.created_at).toLocaleDateString()}`
                                }
                              </div>
                              {alumni.is_active === false && (
                                <Badge variant="outline" className="border-gray-500 text-gray-500">
                                  Inactive
                                </Badge>
                              )}
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
                                View Details
                              </Button>
                              {alumni.alumni_verification_status === "approved" ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-green-500 text-green-500 bg-green-500/10"
                                    disabled
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Verified
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                                    onClick={() => deactivateAlumniMutation.mutate(alumni.user_id)}
                                    disabled={deactivateAlumniMutation.isPending || alumni.is_active === false}
                                  >
                                    <UserX className="h-4 w-4 mr-2" />
                                    {alumni.is_active === false ? "Deactivated" : "Deactivate"}
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="border-green-500 text-green-500 hover:bg-green-500/10"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      approveAlumniMutation.mutate(alumni.user_id);
                                    }}
                                    disabled={approveAlumniMutation.isPending || rejectAlumniMutation.isPending}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Verify
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSelectedAlumni(alumni);
                                      setRejectDialogOpen(true);
                                    }}
                                    disabled={approveAlumniMutation.isPending || rejectAlumniMutation.isPending}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4 mt-6">
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={jobsFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setJobsFilter("all")}
              >
                All ({stats.totalJobs})
              </Button>
              <Button
                variant={jobsFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setJobsFilter("pending")}
                className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 border-yellow-500"
              >
                Pending ({stats.pendingJobs})
              </Button>
              <Button
                variant={jobsFilter === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => setJobsFilter("approved")}
                className="bg-green-500/20 hover:bg-green-500/30 text-green-500 border-green-500"
              >
                Approved ({stats.approvedJobs})
              </Button>
              <Button
                variant={jobsFilter === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setJobsFilter("rejected")}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-500 border-red-500"
              >
                Rejected ({stats.rejectedJobs})
              </Button>
            </div>
            {jobsLoading ? (
              <div className="text-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="mt-2 text-gray-400">Loading jobs...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <Card className="glass-hover">
                <CardContent className="pt-12 pb-12 text-center">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                  <p className="text-gray-400">
                    {searchQuery ? "No jobs match your search criteria." : "No job postings found for the selected filter."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job: any, idx: number) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="glass-hover">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-xl">{job.title}</CardTitle>
                              {job.status === "approved" ? (
                                <Badge className="bg-green-500/20 text-green-500 border-green-500">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Approved
                                </Badge>
                              ) : job.status === "rejected" ? (
                                <Badge className="bg-red-500/20 text-red-500 border-red-500">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Rejected
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500">
                                  Pending
                                </Badge>
                              )}
                              {job.profiles?.alumni_verification_status !== "approved" && (
                                <Badge variant="outline" className="border-orange-500 text-orange-500">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Unverified Poster
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {job.company_name}
                              </div>
                              {job.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {job.location}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                Posted by: {job.profiles?.full_name || "Unknown"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedJob(job);
                                setViewJobDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {job.status === "pending" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-green-500 text-green-500 hover:bg-green-500/10"
                              onClick={() => approveJobMutation.mutate(job.id)}
                              disabled={approveJobMutation.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-500 text-red-500 hover:bg-red-500/10"
                                  onClick={() => rejectJobMutation.mutate(job.id)}
                                  disabled={rejectJobMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-300 line-clamp-2 mb-4">{job.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          {job.salary_range && (
                            <div className="flex items-center gap-1 text-gray-400">
                              <DollarSign className="h-4 w-4" />
                              {job.salary_range}
                            </div>
                          )}
                          {job.job_type && (
                            <Badge variant="outline">{job.job_type}</Badge>
                          )}
                          <div className="flex items-center gap-1 text-gray-400">
                            <Clock className="h-4 w-4" />
                            Posted {new Date(job.created_at).toLocaleDateString()}
                          </div>
                          {job.profiles?.alumni_startup_number && (
                            <div className="flex items-center gap-1 text-gray-400">
                              <Hash className="h-4 w-4" />
                              {job.profiles.alumni_startup_number}
                            </div>
                          )}
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
                      <Label className="text-xs text-gray-400 uppercase tracking-wider">
                        Registration Date
                      </Label>
                      <p className="text-sm mt-1">
                        {new Date(selectedAlumni.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400 uppercase tracking-wider">
                        Status
                      </Label>
                      <div className="mt-1">
                        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500">
                          Pending Verification
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {selectedAlumni.bio && (
                    <div>
                      <Label className="text-xs text-gray-400 uppercase tracking-wider">Bio</Label>
                      <p className="text-sm mt-1">{selectedAlumni.bio}</p>
                    </div>
                  )}

                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-500">Verification Required</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Please verify the alumni enrollment number or startup certificate number
                          against your institution's records before approving.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                    onClick={() => {
                      setRejectDialogOpen(true);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    type="button"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      approveAlumniMutation.mutate(selectedAlumni.user_id);
                    }}
                    disabled={approveAlumniMutation.isPending || rejectAlumniMutation.isPending}
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
                type="button"
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (selectedAlumni && rejectionReason.trim()) {
                    rejectAlumniMutation.mutate({
                      alumniUserId: selectedAlumni.user_id,
                      reason: rejectionReason,
                    });
                  }
                }}
                disabled={rejectAlumniMutation.isPending || approveAlumniMutation.isPending || !rejectionReason.trim()}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Job Dialog */}
        <Dialog open={viewJobDialogOpen} onOpenChange={setViewJobDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedJob && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedJob.title}</DialogTitle>
                  <DialogDescription>
                    Posted by {selectedJob.profiles?.full_name || "Unknown"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Poster verification status */}
                  {selectedJob.profiles?.alumni_verification_status !== "approved" && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-orange-500">Unverified Poster</p>
                          <p className="text-xs text-gray-400 mt-1">
                            The alumni/startup who posted this job has not been verified yet.
                            Consider verifying them first or proceed with caution.
                          </p>
                          {selectedJob.profiles?.alumni_startup_number && (
                            <p className="text-xs text-gray-400 mt-1">
                              Their ID: {selectedJob.profiles.alumni_startup_number}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-2">Company</h4>
                    <p className="text-sm text-gray-300">{selectedJob.company_name}</p>
                  </div>
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
                  <div className="grid grid-cols-2 gap-4">
                    {selectedJob.location && (
                      <div>
                        <h4 className="font-semibold mb-2">Location</h4>
                        <p className="text-sm text-gray-300">{selectedJob.location}</p>
                      </div>
                    )}
                    {selectedJob.job_type && (
                      <div>
                        <h4 className="font-semibold mb-2">Job Type</h4>
                        <p className="text-sm text-gray-300">{selectedJob.job_type}</p>
                      </div>
                    )}
                    {selectedJob.salary_range && (
                      <div>
                        <h4 className="font-semibold mb-2">Salary Range</h4>
                        <p className="text-sm text-gray-300">{selectedJob.salary_range}</p>
                      </div>
                    )}
                    {selectedJob.experience_level && (
                      <div>
                        <h4 className="font-semibold mb-2">Experience Level</h4>
                        <p className="text-sm text-gray-300">{selectedJob.experience_level}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => approveJobMutation.mutate(selectedJob.id)}
                      disabled={approveJobMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10"
                      onClick={() => rejectJobMutation.mutate(selectedJob.id)}
                      disabled={rejectJobMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
