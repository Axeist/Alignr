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
import { Search, User, Calendar, Clock, Video, Phone, MapPin, CheckCircle2, XCircle, AlertCircle, Eye } from "lucide-react";
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

export default function AlumniInterviews() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

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
                      {interview.status === "pending" && (
                        <>
                          <Select
                            value={interview.status}
                            onValueChange={(value) =>
                              updateStatusMutation.mutate({
                                interviewId: interview.id,
                                status: value,
                              })
                            }
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="completed">Mark as Completed</SelectItem>
                              <SelectItem value="selected">Select Candidate</SelectItem>
                              <SelectItem value="rejected">Reject</SelectItem>
                              <SelectItem value="cancelled">Cancel</SelectItem>
                            </SelectContent>
                          </Select>
                        </>
                      )}
                      {interview.status === "completed" && (
                        <>
                          <Select
                            value={interview.status}
                            onValueChange={(value) =>
                              updateStatusMutation.mutate({
                                interviewId: interview.id,
                                status: value,
                              })
                            }
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="selected">Select Candidate</SelectItem>
                              <SelectItem value="rejected">Reject</SelectItem>
                            </SelectContent>
                          </Select>
                        </>
                      )}
                      {(interview.status === "selected" ||
                        interview.status === "rejected" ||
                        interview.status === "cancelled") && (
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
      </div>
    </DashboardLayout>
  );
}

