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
  FileText
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useState } from "react";

// Install @hello-pangea/dnd if not available - using a simple implementation for now
const KanbanColumn = ({ title, status, applications, onDragEnd }: any) => {
  return (
    <Card className="glass-hover flex-1 min-w-[250px]">
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
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="h-3 w-3" />
                    {new Date(app.applied_at).toLocaleDateString()}
                  </div>
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
      id: "offer",
      title: "Offer",
      status: "offer",
      icon: TrendingUp,
      color: "text-yellow-500"
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
      return app.status === status;
    });
  };

  // Calculate stats
  const totalApplications = applications?.length || 0;
  const shortlistedCount = getApplicationsByStatus("shortlisted").length;
  const interviewCount = getApplicationsByStatus("interview_scheduled").length;
  const offerCount = getApplicationsByStatus("offer").length;
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
                <div className="text-3xl font-bold text-purple-500 mb-1">{interviewCount}</div>
                <div className="text-sm text-gray-400">Interviews</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500 mb-1">{avgMatchScore}%</div>
                <div className="text-sm text-gray-400">Avg Match Score</div>
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
                          app.status === "shortlisted"
                            ? "border-green-500 text-green-500"
                            : app.status === "rejected"
                            ? "border-red-500 text-red-500"
                            : ""
                        }
                      >
                        {app.status}
                      </Badge>
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
      </div>
    </DashboardLayout>
  );
}
