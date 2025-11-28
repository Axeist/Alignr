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

  // Fetch pending alumni/startups for verification
  const { data: pendingAlumni, isLoading: alumniLoading } = useQuery({
    queryKey: ["pending-alumni", collegeId],
    queryFn: async () => {
      if (!collegeId) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("college_id", collegeId)
        .eq("role", "alumni")
        .or("alumni_verification_status.is.null,alumni_verification_status.eq.pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!collegeId,
  });

  // Fetch verified alumni
  const { data: verifiedAlumni } = useQuery({
    queryKey: ["verified-alumni", collegeId],
    queryFn: async () => {
      if (!collegeId) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("college_id", collegeId)
        .eq("role", "alumni")
        .eq("alumni_verification_status", "approved")
        .order("alumni_verified_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!collegeId,
  });

  // Fetch pending jobs
  const { data: pendingJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["pending-jobs", collegeId],
    queryFn: async () => {
      if (!collegeId) return [];
      const { data, error } = await supabase
        .from("jobs")
        .select("*, profiles!jobs_posted_by_fkey(full_name, email, alumni_verification_status, alumni_startup_number)")
        .eq("college_id", collegeId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!collegeId,
  });

  // Fetch approved jobs count
  const { data: approvedJobsCount } = useQuery({
    queryKey: ["approved-jobs-count", collegeId],
    queryFn: async () => {
      if (!collegeId) return 0;
      const { count, error } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("college_id", collegeId)
        .eq("status", "approved");
      if (error) throw error;
      return count || 0;
    },
    enabled: !!collegeId,
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
      queryClient.invalidateQueries({ queryKey: ["pending-alumni"] });
      queryClient.invalidateQueries({ queryKey: ["verified-alumni"] });
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
      queryClient.invalidateQueries({ queryKey: ["pending-alumni"] });
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

  // Approve job mutation
  const approveJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("jobs")
        .update({ 
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Job Approved",
        description: "The job has been approved and is now visible to students.",
      });
      queryClient.invalidateQueries({ queryKey: ["pending-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["approved-jobs-count"] });
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

  // Reject job mutation
  const rejectJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "rejected" })
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Job Rejected",
        description: "The job has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["pending-jobs"] });
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
    pendingJobs: pendingJobs?.length || 0,
    approvedJobs: approvedJobsCount || 0,
  };

  const filteredAlumni = pendingAlumni?.filter((alumni: any) =>
    alumni.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alumni.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alumni.alumni_startup_number?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredJobs = pendingJobs?.filter((job: any) =>
    job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <div className="p-3 rounded-full bg-blue-500/20">
                  <Briefcase className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-500">{stats.pendingJobs}</div>
                  <div className="text-sm text-gray-400">Pending Jobs</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-500/20">
                  <CheckCircle2 className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-500">{stats.approvedJobs}</div>
                  <div className="text-sm text-gray-400">Active Jobs</div>
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
              Alumni/Startups ({stats.pendingAlumni})
            </TabsTrigger>
            <TabsTrigger value="jobs">
              <Briefcase className="h-4 w-4 mr-2" />
              Job Postings ({stats.pendingJobs})
            </TabsTrigger>
          </TabsList>

          {/* Alumni/Startups Tab */}
          <TabsContent value="alumni" className="space-y-4 mt-6">
            {alumniLoading ? (
              <div className="text-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="mt-2 text-gray-400">Loading alumni...</p>
              </div>
            ) : filteredAlumni.length === 0 ? (
              <Card className="glass-hover">
                <CardContent className="pt-12 pb-12 text-center">
                  <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pending verifications</h3>
                  <p className="text-gray-400">All alumni and startups have been reviewed.</p>
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
                              <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500">
                                Pending Verification
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm mb-4">
                              <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
                                <Hash className="h-4 w-4 text-primary" />
                                <span className="font-medium">{alumni.alumni_startup_number || "No ID provided"}</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-400">
                                <Clock className="h-3 w-3" />
                                Registered {new Date(alumni.created_at).toLocaleDateString()}
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
                                View Details
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
                                disabled={rejectAlumniMutation.isPending}
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
                  <h3 className="text-lg font-semibold mb-2">No pending job approvals</h3>
                  <p className="text-gray-400">All job postings have been reviewed.</p>
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
