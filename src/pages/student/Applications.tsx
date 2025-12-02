import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Briefcase, 
  Calendar,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Video,
  Phone,
  MapPin
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Install @hello-pangea/dnd if not available - using a simple implementation for now
const KanbanColumn = ({ title, status, applications, onDragEnd, onScheduleInterview }: any) => {
  return (
    <Card className="glass-hover flex-1 min-w-[280px]">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <CardDescription>{applications.length} applications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {applications.map((app: any, idx: number) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="glass cursor-move hover:shadow-lg transition-shadow">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{app.jobs?.title || "Job"}</h4>
                      <p className="text-xs text-gray-400">{app.jobs?.company_name || ""}</p>
                    </div>
                    {app.match_score && (
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: app.match_score < 50 ? "#EF4444" : app.match_score < 76 ? "#F59E0B" : "#10B981"
                        }}
                      >
                        {app.match_score}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {new Date(app.applied_at).toLocaleDateString()}
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        app.status === "accepted"
                          ? "border-emerald-500 text-emerald-500 bg-emerald-500/10"
                          : app.status === "rejected"
                          ? "border-red-500 text-red-500 bg-red-500/10"
                          : app.status === "shortlisted"
                          ? "border-green-500 text-green-500 bg-green-500/10"
                          : ""
                      }`}
                    >
                      {app.status === "accepted" 
                        ? "✓ Accepted" 
                        : app.status === "rejected"
                        ? "✗ Rejected"
                        : app.status === "shortlisted"
                        ? "Shortlisted"
                        : ""}
                    </Badge>
                  </div>
                  {app.status === "shortlisted" && onScheduleInterview && (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-primary text-primary hover:bg-primary/10 text-xs px-2 py-1.5 h-auto min-h-[32px] flex items-center justify-center gap-1.5"
                        onClick={() => onScheduleInterview(app)}
                      >
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="text-xs leading-tight">Schedule Interview</span>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {applications.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400">
            No applications
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function Applications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewMode, setInterviewMode] = useState<string>("");
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("");

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

  // Fetch applications
  const { data: applications, isLoading } = useQuery({
    queryKey: ["applications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("applications")
        .select("*, jobs(*)")
        .eq("user_id", user.id)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ appId, newStatus }: { appId: string; newStatus: string }) => {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", appId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications", user?.id] });
    }
  });

  // Schedule interview mutation
  const scheduleInterviewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedApplication || !user) throw new Error("Missing application or user");
      
      // Get job details to find alumni_id
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("posted_by")
        .eq("id", selectedApplication.job_id)
        .single();
      
      if (jobError || !job) throw new Error("Could not find job details");
      
      // Create interview record
      const { error: interviewError } = await supabase
        .from("interviews")
        .insert({
          application_id: selectedApplication.id,
          student_id: user.id,
          alumni_id: job.posted_by,
          job_id: selectedApplication.job_id,
          interview_date: interviewDate,
          interview_time: interviewTime,
          mode: interviewMode,
          status: "pending",
          meeting_link: interviewMode === "online" || interviewMode === "video_call" ? meetingLink : null,
          location: interviewMode === "offline" ? location : null,
        });
      
      if (interviewError) throw interviewError;
      
      // Update application status to interview_scheduled
      const { error: statusError } = await supabase
        .from("applications")
        .update({ status: "interview_scheduled" })
        .eq("id", selectedApplication.id);
      
      if (statusError) throw statusError;
    },
    onSuccess: () => {
      toast({
        title: "Interview scheduled",
        description: "Your interview has been scheduled successfully.",
      });
      setScheduleDialogOpen(false);
      setInterviewDate("");
      setInterviewTime("");
      setInterviewMode("");
      setMeetingLink("");
      setLocation("");
      setSelectedApplication(null);
      queryClient.invalidateQueries({ queryKey: ["applications", user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error scheduling interview",
        description: error.message || "Failed to schedule interview. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleScheduleInterview = (app: any) => {
    setSelectedApplication(app);
    setScheduleDialogOpen(true);
  };

  const handleSubmitSchedule = () => {
    if (!interviewDate || !interviewTime || !interviewMode) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    if ((interviewMode === "online" || interviewMode === "video_call") && !meetingLink) {
      toast({
        title: "Missing meeting link",
        description: "Please provide a meeting link for online interviews.",
        variant: "destructive",
      });
      return;
    }
    
    if (interviewMode === "offline" && !location) {
      toast({
        title: "Missing location",
        description: "Please provide a location for offline interviews.",
        variant: "destructive",
      });
      return;
    }
    
    scheduleInterviewMutation.mutate();
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const statusMap: Record<string, string> = {
      "applied": "applied",
      "shortlisted": "shortlisted",
      "interview": "interview_scheduled",
      "offer": "offer",
      "rejected": "rejected"
    };

    const newStatus = statusMap[result.destination.droppableId];
    if (newStatus && applications) {
      const app = applications[result.source.index];
      updateStatusMutation.mutate({ appId: app.id, newStatus });
    }
  };

  const columns = [
    {
      id: "applied",
      title: "Applied",
      status: "applied",
      icon: FileText,
      color: "text-blue-500"
    },
    {
      id: "shortlisted",
      title: "Shortlisted",
      status: "shortlisted",
      icon: CheckCircle2,
      color: "text-green-500"
    },
    {
      id: "interview",
      title: "Interview",
      status: "interview_scheduled",
      icon: Calendar,
      color: "text-purple-500"
    },
    {
      id: "accepted",
      title: "Accepted",
      status: "accepted",
      icon: CheckCircle2,
      color: "text-emerald-500"
    },
    {
      id: "rejected",
      title: "Rejected",
      status: "rejected",
      icon: XCircle,
      color: "text-red-500"
    }
  ];

  const getApplicationsByStatus = (status: string) => {
    if (!applications) return [];
    return applications.filter((app: any) => {
      if (status === "interview_scheduled") {
        return app.status === "interview_scheduled" || app.status === "interview";
      }
      if (status === "applied") {
        return app.status === "applied" || app.status === "pending";
      }
      return app.status === status;
    });
  };

  // Calculate stats
  const totalApplications = applications?.length || 0;
  const shortlistedCount = getApplicationsByStatus("shortlisted").length;
  const acceptedCount = getApplicationsByStatus("accepted").length;
  const interviewCount = getApplicationsByStatus("interview_scheduled").length;
  const rejectedCount = getApplicationsByStatus("rejected").length;
  const avgMatchScore = applications?.length
    ? Math.round(
        applications.reduce((sum: number, app: any) => sum + (app.match_score || 0), 0) /
          applications.length
      )
    : 0;

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">My Applications</h1>
          <p className="text-gray-400">Track and manage your job applications</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{totalApplications}</div>
                <div className="text-sm text-gray-400">Total Applications</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-1">{shortlistedCount}</div>
                <div className="text-sm text-gray-400">Shortlisted</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-500 mb-1">{acceptedCount}</div>
                <div className="text-sm text-gray-400">Accepted</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500 mb-1">{rejectedCount}</div>
                <div className="text-sm text-gray-400">Rejected</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading applications...</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((column) => {
              const columnApps = getApplicationsByStatus(column.status);
              return (
                <KanbanColumn
                  key={column.id}
                  title={column.title}
                  status={column.status}
                  applications={columnApps}
                  icon={column.icon}
                  onScheduleInterview={handleScheduleInterview}
                />
              );
            })}
          </div>
        )}

        {/* Application List (Alternative View) */}
        {applications && applications.length > 0 && (
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {applications.slice(0, 5).map((app: any) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3 rounded-lg glass"
                  >
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-semibold">{app.jobs?.title || "Job"}</div>
                        <div className="text-sm text-gray-400">{app.jobs?.company_name || ""}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {app.match_score && (
                        <Badge variant="outline">{app.match_score}% match</Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={
                          app.status === "accepted"
                            ? "border-emerald-500 text-emerald-500 bg-emerald-500/10"
                            : app.status === "shortlisted"
                            ? "border-green-500 text-green-500 bg-green-500/10"
                            : app.status === "rejected"
                            ? "border-red-500 text-red-500 bg-red-500/10"
                            : app.status === "pending"
                            ? "border-yellow-500 text-yellow-500 bg-yellow-500/10"
                            : ""
                        }
                      >
                        {app.status === "accepted" 
                          ? "✓ Accepted" 
                          : app.status === "rejected"
                          ? "✗ Rejected"
                          : app.status === "pending"
                          ? "Pending Review"
                          : app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </Badge>
                      {app.status === "shortlisted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-primary text-primary hover:bg-primary/10"
                          onClick={() => handleScheduleInterview(app)}
                        >
                          <Calendar className="h-3 w-3 mr-2" />
                          Schedule Interview
                        </Button>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(app.applied_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedule Interview Dialog */}
        <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule Interview</DialogTitle>
              <DialogDescription>
                {selectedApplication && `Schedule an interview for ${selectedApplication.jobs?.title} at ${selectedApplication.jobs?.company_name}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interview_date">Interview Date *</Label>
                  <Input
                    id="interview_date"
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interview_time">Interview Time *</Label>
                  <Input
                    id="interview_time"
                    type="time"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interview_mode">Mode of Interview *</Label>
                <Select value={interviewMode} onValueChange={setInterviewMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select interview mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Online
                      </div>
                    </SelectItem>
                    <SelectItem value="video_call">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Video Call
                      </div>
                    </SelectItem>
                    <SelectItem value="offline">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Offline
                      </div>
                    </SelectItem>
                    <SelectItem value="phone">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(interviewMode === "online" || interviewMode === "video_call") && (
                <div className="space-y-2">
                  <Label htmlFor="meeting_link">Meeting Link *</Label>
                  <Input
                    id="meeting_link"
                    type="url"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              )}
              {interviewMode === "offline" && (
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter interview location"
                  />
                </div>
              )}
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setScheduleDialogOpen(false);
                    setInterviewDate("");
                    setInterviewTime("");
                    setInterviewMode("");
                    setMeetingLink("");
                    setLocation("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitSchedule}
                  disabled={scheduleInterviewMutation.isPending}
                >
                  {scheduleInterviewMutation.isPending ? "Scheduling..." : "Schedule Interview"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
