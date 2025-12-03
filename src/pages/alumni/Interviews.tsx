import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Search, User, Calendar, Clock, Video, Phone, MapPin, CheckCircle2, XCircle, AlertCircle, Eye, Check, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";

export default function AlumniInterviews() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rescheduleMeetingLink, setRescheduleMeetingLink] = useState("");

  const navItems = [
    { label: "Dashboard", href: "/alumni/dashboard" },
    { label: "Post Job", href: "/alumni/post-job" },
    { label: "My Jobs", href: "/alumni/jobs" },
    { label: "Applications", href: "/alumni/applications" },
    { label: "Interviews", href: "/alumni/interviews" },
    { label: "Candidates", href: "/alumni/candidates" },
    { label: "Profile", href: "/alumni/profile" },
  ];

  // Fetch interviews for alumni's jobs
  const { data: interviews, isLoading } = useQuery({
    queryKey: ["alumni-interviews", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // First get all jobs posted by this alumni
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id")
        .eq("posted_by", user.id);
      
      if (jobsError) throw jobsError;
      if (!jobs || jobs.length === 0) return [];
      
      const jobIds = jobs.map(j => j.id);
      
      // Fetch interviews for these jobs
      const { data: interviewsData, error: interviewsError } = await supabase
        .from("interviews")
        .select("*, applications(*, jobs(*))")
        .in("job_id", jobIds)
        .order("interview_date", { ascending: true })
        .order("interview_time", { ascending: true });
      
      if (interviewsError) throw interviewsError;
      
      // Fetch profiles separately for each student
      if (interviewsData && interviewsData.length > 0) {
        const studentIds = [...new Set(interviewsData.map((i: any) => i.student_id).filter(Boolean))];
        
        let profilesMap = new Map();
        if (studentIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("user_id, full_name, email, avatar_url")
            .in("user_id", studentIds);
          
          if (!profilesError && profilesData) {
            profilesMap = new Map(profilesData.map((p: any) => [p.user_id, p]));
          }
        }
        
        // Map profiles to interviews
        return interviewsData.map((interview: any) => ({
          ...interview,
          profiles: profilesMap.get(interview.student_id) || null,
        }));
      }
      
      return interviewsData || [];
    },
    enabled: !!user
  });

  // Update interview status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ interviewId, status }: { interviewId: string; status: string }) => {
      const { error } = await supabase
        .from("interviews")
        .update({ status })
        .eq("id", interviewId);
      
      if (error) throw error;
      
      // If status is selected, also update the application status
      if (status === "selected") {
        const interview = interviews?.find((i: any) => i.id === interviewId);
        if (interview?.application_id) {
          const { error: appError } = await supabase
            .from("applications")
            .update({ status: "accepted" })
            .eq("id", interview.application_id);
          
          if (appError) throw appError;
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Interview status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["alumni-interviews", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["alumni-applications", user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating status",
        description: error.message || "Failed to update interview status.",
        variant: "destructive",
      });
    },
  });

  // Accept reschedule mutation
  const acceptRescheduleMutation = useMutation({
    mutationFn: async ({ interviewId, meetingLink }: { interviewId: string; meetingLink?: string }) => {
      const interview = interviews?.find((i: any) => i.id === interviewId);
      if (!interview) throw new Error("Interview not found");

      // Update interview with requested details
      const updateData: any = {
        interview_date: interview.requested_date,
        interview_time: interview.requested_time,
        mode: interview.requested_mode,
        location: interview.requested_location || null,
        meeting_link: (interview.requested_mode === "online" || interview.requested_mode === "video_call") 
          ? (meetingLink || interview.meeting_link || null)
          : null,
        reschedule_status: "accepted",
        requested_date: null,
        requested_time: null,
        requested_mode: null,
        requested_location: null,
        requested_meeting_link: null,
      };

      const { error: interviewError } = await supabase
        .from("interviews")
        .update(updateData)
        .eq("id", interviewId);

      if (interviewError) throw interviewError;

      // Update application status back to interview_scheduled
      if (interview.application_id) {
        const { error: appError } = await supabase
          .from("applications")
          .update({ status: "interview_scheduled" })
          .eq("id", interview.application_id);

        if (appError) throw appError;
      }
    },
    onSuccess: () => {
      toast({
        title: "Reschedule accepted",
        description: "The interview has been rescheduled successfully.",
      });
      setAcceptDialogOpen(false);
      setRescheduleMeetingLink("");
      queryClient.invalidateQueries({ queryKey: ["alumni-interviews", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["alumni-applications", user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error accepting reschedule",
        description: error.message || "Failed to accept reschedule request.",
        variant: "destructive",
      });
    },
  });

  // Reject reschedule mutation
  const rejectRescheduleMutation = useMutation({
    mutationFn: async ({ interviewId }: { interviewId: string }) => {
      const interview = interviews?.find((i: any) => i.id === interviewId);
      if (!interview) throw new Error("Interview not found");

      // Clear all reschedule request fields and reset status
      const updateData: any = {
        reschedule_status: null,
        requested_date: null,
        requested_time: null,
        requested_mode: null,
        requested_location: null,
        requested_meeting_link: null,
      };

      const { error: interviewError } = await supabase
        .from("interviews")
        .update(updateData)
        .eq("id", interviewId);

      if (interviewError) throw interviewError;

      // Update application status back to interview_scheduled
      if (interview.application_id) {
        const { error: appError } = await supabase
          .from("applications")
          .update({ status: "interview_scheduled" })
          .eq("id", interview.application_id);

        if (appError) throw appError;
      }
    },
    onSuccess: () => {
      toast({
        title: "Reschedule rejected",
        description: "The reschedule request has been rejected. Original interview schedule retained.",
      });
      queryClient.invalidateQueries({ queryKey: ["alumni-interviews", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["alumni-applications", user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error rejecting reschedule",
        description: error.message || "Failed to reject reschedule request.",
        variant: "destructive",
      });
    },
  });

  const filteredInterviews = interviews?.filter((interview: any) => {
    const studentName = interview.profiles?.full_name || "";
    const jobTitle = interview.applications?.jobs?.title || "";
    const matchesSearch =
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || interview.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const stats = {
    total: interviews?.length || 0,
    pending: interviews?.filter((i: any) => i.status === "pending").length || 0,
    completed: interviews?.filter((i: any) => i.status === "completed").length || 0,
    selected: interviews?.filter((i: any) => i.status === "selected").length || 0,
    rejected: interviews?.filter((i: any) => i.status === "rejected").length || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "selected":
        return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500">Selected</Badge>;
      case "completed":
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500">Rejected</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-500/20 text-gray-500 border-gray-500">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "online":
      case "video_call":
        return <Video className="h-4 w-4" />;
      case "phone":
        return <Phone className="h-4 w-4" />;
      case "offline":
        return <MapPin className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Interviews</h1>
          <p className="text-gray-400">Manage scheduled interviews with candidates</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{stats.total}</div>
                <div className="text-sm text-gray-400">Total Interviews</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500 mb-1">{stats.pending}</div>
                <div className="text-sm text-gray-400">Pending</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500 mb-1">{stats.completed}</div>
                <div className="text-sm text-gray-400">Completed</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-500 mb-1">{stats.selected}</div>
                <div className="text-sm text-gray-400">Selected</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500 mb-1">{stats.rejected}</div>
                <div className="text-sm text-gray-400">Rejected</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-hover">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by candidate name or job title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="selected">Selected</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Interviews List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading interviews...</p>
          </div>
        ) : filteredInterviews.length === 0 ? (
          <Card className="glass-hover">
            <CardContent className="pt-12 pb-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No interviews found</h3>
              <p className="text-gray-400">
                {interviews?.length === 0
                  ? "Interviews will appear here once students schedule them for your job postings."
                  : "No interviews match your current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredInterviews.map((interview: any, idx: number) => (
              <motion.div
                key={interview.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="glass-hover">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar>
                          <AvatarFallback>
                            {interview.profiles?.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg">
                              {interview.profiles?.full_name || "Unknown Candidate"}
                            </CardTitle>
                            {getStatusBadge(interview.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {interview.applications?.jobs?.title || "Job"}
                            </div>
                            <div className="flex items-center gap-1">
                              {getModeIcon(interview.mode)}
                              {interview.mode.charAt(0).toUpperCase() + interview.mode.slice(1)}
                            </div>
                          </div>
                          {interview.reschedule_status === "pending" ? (
                            <div className="space-y-2">
                              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                                  <span className="text-sm font-semibold text-yellow-500">Reschedule Request Pending</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <div className="text-gray-400 mb-1">Current Date & Time:</div>
                                    <div className="flex items-center gap-1 text-gray-300">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(interview.interview_date)} at {formatTime(interview.interview_time)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-gray-400 mb-1">Requested Date & Time:</div>
                                    <div className="flex items-center gap-1 text-yellow-400 font-semibold">
                                      <Calendar className="h-3 w-3" />
                                      {interview.requested_date ? formatDate(interview.requested_date) : "N/A"} at {interview.requested_time ? formatTime(interview.requested_time) : "N/A"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4 text-sm text-gray-300">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(interview.interview_date)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatTime(interview.interview_time)}
                              </div>
                              {interview.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {interview.location}
                                </div>
                              )}
                              {interview.meeting_link && (
                                <a
                                  href={interview.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-primary hover:underline"
                                >
                                  <Video className="h-4 w-4" />
                                  Join Meeting
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInterview(interview);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 flex-wrap">
                      {interview.reschedule_status === "pending" && (
                        <div className="flex items-center gap-2 w-full">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedInterview(interview);
                              setAcceptDialogOpen(true);
                            }}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Accept Reschedule
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm("Are you sure you want to reject this reschedule request? The original interview schedule will be retained.")) {
                                rejectRescheduleMutation.mutate({ interviewId: interview.id });
                              }
                            }}
                            disabled={rejectRescheduleMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject Reschedule
                          </Button>
                        </div>
                      )}
                      {interview.status === "pending" && interview.reschedule_status !== "pending" && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                interviewId: interview.id,
                                status: "completed",
                              })
                            }
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark as Completed
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-500 text-emerald-500 hover:bg-emerald-500/10"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                interviewId: interview.id,
                                status: "selected",
                              })
                            }
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Select Candidate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-500/10"
                            onClick={() => {
                              if (confirm("Are you sure you want to reject this interview?")) {
                                updateStatusMutation.mutate({
                                  interviewId: interview.id,
                                  status: "rejected",
                                });
                              }
                            }}
                            disabled={updateStatusMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-500 text-gray-500 hover:bg-gray-500/10"
                            onClick={() => {
                              if (confirm("Are you sure you want to cancel this interview?")) {
                                updateStatusMutation.mutate({
                                  interviewId: interview.id,
                                  status: "cancelled",
                                });
                              }
                            }}
                            disabled={updateStatusMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      )}
                      {interview.status === "completed" && interview.reschedule_status !== "pending" && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-500 text-emerald-500 hover:bg-emerald-500/10"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                interviewId: interview.id,
                                status: "selected",
                              })
                            }
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Select Candidate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-500/10"
                            onClick={() => {
                              if (confirm("Are you sure you want to reject this candidate?")) {
                                updateStatusMutation.mutate({
                                  interviewId: interview.id,
                                  status: "rejected",
                                });
                              }
                            }}
                            disabled={updateStatusMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                      {(interview.status === "selected" ||
                        interview.status === "rejected" ||
                        interview.status === "cancelled") && interview.reschedule_status !== "pending" && (
                        <p className="text-sm text-gray-400 italic">
                          {interview.status === "selected"
                            ? "Candidate has been selected"
                            : interview.status === "rejected"
                            ? "Interview has been rejected"
                            : "Interview has been cancelled"}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* View Interview Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            {selectedInterview && (
              <>
                <DialogHeader>
                  <DialogTitle>Interview Details</DialogTitle>
                  <DialogDescription>
                    Interview with {selectedInterview.profiles?.full_name} for{" "}
                    {selectedInterview.applications?.jobs?.title}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {selectedInterview.reschedule_status === "pending" && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                        <h4 className="font-semibold text-yellow-500">Reschedule Request Pending</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400 mb-1">Current Date:</div>
                          <div className="text-gray-300">{formatDate(selectedInterview.interview_date)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 mb-1">Current Time:</div>
                          <div className="text-gray-300">{formatTime(selectedInterview.interview_time)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 mb-1">Requested Date:</div>
                          <div className="text-yellow-400 font-semibold">
                            {selectedInterview.requested_date ? formatDate(selectedInterview.requested_date) : "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 mb-1">Requested Time:</div>
                          <div className="text-yellow-400 font-semibold">
                            {selectedInterview.requested_time ? formatTime(selectedInterview.requested_time) : "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Date</h4>
                      <p className="text-sm text-gray-300">
                        {formatDate(selectedInterview.interview_date)}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Time</h4>
                      <p className="text-sm text-gray-300">
                        {formatTime(selectedInterview.interview_time)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Mode</h4>
                    <div className="flex items-center gap-2">
                      {getModeIcon(selectedInterview.mode)}
                      <p className="text-sm text-gray-300">
                        {selectedInterview.mode.charAt(0).toUpperCase() +
                          selectedInterview.mode.slice(1)}
                      </p>
                    </div>
                  </div>
                  {selectedInterview.location && (
                    <div>
                      <h4 className="font-semibold mb-2">Location</h4>
                      <p className="text-sm text-gray-300">{selectedInterview.location}</p>
                    </div>
                  )}
                  {selectedInterview.meeting_link && (
                    <div>
                      <h4 className="font-semibold mb-2">Meeting Link</h4>
                      <a
                        href={selectedInterview.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {selectedInterview.meeting_link}
                      </a>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold mb-2">Status</h4>
                    {getStatusBadge(selectedInterview.status)}
                  </div>
                  {selectedInterview.notes && (
                    <div>
                      <h4 className="font-semibold mb-2">Notes</h4>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">
                        {selectedInterview.notes}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Accept Reschedule Dialog */}
        <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
          <DialogContent className="max-w-2xl">
            {selectedInterview && (
              <>
                <DialogHeader>
                  <DialogTitle>Accept Reschedule Request</DialogTitle>
                  <DialogDescription>
                    Accept the reschedule request from {selectedInterview.profiles?.full_name} for{" "}
                    {selectedInterview.applications?.jobs?.title}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold text-sm mb-3">Reschedule Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400 mb-1">New Date:</div>
                        <div className="text-gray-300 font-semibold">
                          {selectedInterview.requested_date ? formatDate(selectedInterview.requested_date) : "N/A"}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">New Time:</div>
                        <div className="text-gray-300 font-semibold">
                          {selectedInterview.requested_time ? formatTime(selectedInterview.requested_time) : "N/A"}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">Mode:</div>
                        <div className="text-gray-300">
                          {selectedInterview.requested_mode ? selectedInterview.requested_mode.charAt(0).toUpperCase() + selectedInterview.requested_mode.slice(1) : "N/A"}
                        </div>
                      </div>
                      {selectedInterview.requested_location && (
                        <div>
                          <div className="text-gray-400 mb-1">Location:</div>
                          <div className="text-gray-300">{selectedInterview.requested_location}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  {(selectedInterview.requested_mode === "online" || selectedInterview.requested_mode === "video_call") && (
                    <div className="space-y-2">
                      <Label htmlFor="reschedule_meeting_link">Meeting Link *</Label>
                      <Input
                        id="reschedule_meeting_link"
                        type="url"
                        value={rescheduleMeetingLink}
                        onChange={(e) => setRescheduleMeetingLink(e.target.value)}
                        placeholder="https://meet.google.com/..."
                      />
                      <p className="text-xs text-gray-400">
                        Provide the meeting link for the rescheduled interview.
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAcceptDialogOpen(false);
                        setRescheduleMeetingLink("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if ((selectedInterview.requested_mode === "online" || selectedInterview.requested_mode === "video_call") && !rescheduleMeetingLink) {
                          toast({
                            title: "Meeting link required",
                            description: "Please provide a meeting link for online/video call interviews.",
                            variant: "destructive",
                          });
                          return;
                        }
                        acceptRescheduleMutation.mutate({
                          interviewId: selectedInterview.id,
                          meetingLink: rescheduleMeetingLink || undefined,
                        });
                      }}
                      disabled={acceptRescheduleMutation.isPending}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      {acceptRescheduleMutation.isPending ? "Accepting..." : "Accept Reschedule"}
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

