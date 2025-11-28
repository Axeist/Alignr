import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Search, User, Briefcase, Calendar, Download, Eye, CheckCircle2, XCircle, X, Clock, Mail } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AlumniApplications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const jobIdFilter = searchParams.get("job_id");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/alumni/dashboard" },
    { label: "Post Job", href: "/alumni/post-job" },
    { label: "My Jobs", href: "/alumni/jobs" },
    { label: "Applications", href: "/alumni/applications" },
    { label: "Candidates", href: "/alumni/candidates" },
    { label: "Profile", href: "/alumni/profile" },
  ];

  // Fetch posted jobs
  const { data: jobs } = useQuery({
    queryKey: ["alumni-jobs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("jobs")
        .select("id")
        .eq("posted_by", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const jobIds = jobs?.map((j) => j.id) || [];

  // Fetch applications
  const { data: applications, isLoading } = useQuery({
    queryKey: ["alumni-applications", user?.id, jobIdFilter],
    queryFn: async () => {
      if (!user || jobIds.length === 0) return [];
      let query = supabase
        .from("applications")
        .select("*, jobs(*)")
        .in("job_id", jobIds)
        .order("applied_at", { ascending: false });

      if (jobIdFilter) {
        query = query.eq("job_id", jobIdFilter);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching applications:", error);
        throw error;
      }
      
      // Fetch profiles and resumes separately for each application
      if (data && data.length > 0) {
        const studentIds = [...new Set(data.map((app: any) => app.student_id || app.user_id).filter(Boolean))];
        const resumeIds = [...new Set(data.map((app: any) => app.resume_id).filter(Boolean))];
        
        // Fetch profiles
        let profilesMap = new Map();
        if (studentIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("user_id, full_name, email, avatar_url")
            .in("user_id", studentIds);
          
          if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
            // Continue without profiles rather than failing completely
          } else {
            profilesMap = new Map(profilesData?.map((p: any) => [p.user_id, p]) || []);
          }
        }
        
        // Fetch resumes
        let resumesMap = new Map();
        if (resumeIds.length > 0) {
          const { data: resumesData, error: resumesError } = await supabase
            .from("resumes")
            .select("id, file_url, version_label")
            .in("id", resumeIds);
          
          if (resumesError) {
            console.error("Error fetching resumes:", resumesError);
            // Continue without resumes rather than failing completely
          } else {
            resumesMap = new Map(resumesData?.map((r: any) => [r.id, r]) || []);
          }
        }
        
        // Map profiles and resumes to applications
        return data.map((app: any) => {
          const resume = app.resume_id ? resumesMap.get(app.resume_id) : null;
          // Use resume file_url if available, otherwise fall back to resume_url
          const resumeUrl = resume?.file_url || app.resume_url || null;
          
          return {
            ...app,
            profiles: profilesMap.get(app.student_id || app.user_id) || null,
            resume: resume,
            resume_url: resumeUrl,
          };
        });
      }
      
      return data || [];
    },
    enabled: !!user && jobIds.length > 0,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ appId, status, studentId }: { appId: string; status: string; studentId?: string }) => {
      const { error } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", appId);
      if (error) throw error;
      return { studentId };
    },
    onSuccess: (data, variables) => {
      const statusMessages: Record<string, string> = {
        shortlisted: "Application has been shortlisted. The student will be notified.",
        rejected: "Application has been rejected. The student will be notified.",
        accepted: "Application has been accepted. The student will be notified.",
      };
      
      toast({
        title: "Status updated",
        description: statusMessages[variables.status] || "Application status has been updated.",
      });
      
      // Invalidate alumni applications query
      queryClient.invalidateQueries({ queryKey: ["alumni-applications"] });
      
      // Invalidate student's applications query if we have studentId
      if (variables.studentId) {
        queryClient.invalidateQueries({ queryKey: ["applications", variables.studentId] });
      }
      
      // Also invalidate all applications queries to ensure sync
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredApplications = applications?.filter((app: any) => {
    const matchesSearch =
      app.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobs?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const stats = {
    total: applications?.length || 0,
    pending: applications?.filter((a: any) => a.status === "pending" || a.status === "applied").length || 0,
    shortlisted: applications?.filter((a: any) => a.status === "shortlisted").length || 0,
    accepted: applications?.filter((a: any) => a.status === "accepted").length || 0,
    rejected: applications?.filter((a: any) => a.status === "rejected").length || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500">✓ Accepted</Badge>;
      case "shortlisted":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500">Shortlisted</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500">✗ Rejected</Badge>;
      case "applied":
      case "pending":
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500">Pending</Badge>;
    }
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Job Applications</h1>
          <p className="text-gray-400">Review and manage candidate applications</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{stats.total}</div>
                <div className="text-sm text-gray-400">Total Applications</div>
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
                <div className="text-3xl font-bold text-green-500 mb-1">{stats.shortlisted}</div>
                <div className="text-sm text-gray-400">Shortlisted</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-500 mb-1">{stats.accepted}</div>
                <div className="text-sm text-gray-400">Accepted</div>
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
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <Card className="glass-hover">
            <CardContent className="pt-12 pb-12 text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No applications found</h3>
              <p className="text-gray-400">Applications will appear here once candidates apply to your jobs.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app: any, idx: number) => (
              <motion.div
                key={app.id}
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
                            {app.profiles?.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg">{app.profiles?.full_name || "Unknown"}</CardTitle>
                            {getStatusBadge(app.status)}
                            {app.match_score && (
                              <Badge variant="outline">{app.match_score}% match</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {app.jobs?.title || "Job"}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Applied {new Date(app.applied_at).toLocaleDateString()}
                            </div>
                          </div>
                          {app.cover_letter && (
                            <p className="text-sm text-gray-300 line-clamp-2">{app.cover_letter}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(app);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {app.resume_url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={app.resume_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {(app.status === "pending" || app.status === "applied") && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-500 text-green-500 hover:bg-green-500/10"
                            onClick={() => updateStatusMutation.mutate({ 
                              appId: app.id, 
                              status: "shortlisted",
                              studentId: app.student_id || app.user_id 
                            })}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Shortlist
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-500/10"
                            onClick={() => updateStatusMutation.mutate({ 
                              appId: app.id, 
                              status: "rejected",
                              studentId: app.student_id || app.user_id 
                            })}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      {app.status === "shortlisted" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-500 text-green-500 bg-green-500/10"
                            disabled
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Shortlisted
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                            onClick={() => updateStatusMutation.mutate({ 
                              appId: app.id, 
                              status: "applied",
                              studentId: app.student_id || app.user_id 
                            })}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove from Shortlist
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-500 text-emerald-500 hover:bg-emerald-500/10"
                            onClick={() => updateStatusMutation.mutate({ 
                              appId: app.id, 
                              status: "accepted",
                              studentId: app.student_id || app.user_id 
                            })}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                        </>
                      )}
                      {(app.status === "accepted" || app.status === "rejected") && (
                        <p className="text-sm text-gray-400 italic">
                          {app.status === "accepted" 
                            ? "Application has been accepted" 
                            : "Application has been rejected"}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* View Application Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedApplication && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedApplication.profiles?.full_name || "Application Details"}</DialogTitle>
                  <DialogDescription>
                    Application for {selectedApplication.jobs?.title}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Cover Letter</h4>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                      {selectedApplication.cover_letter || "No cover letter provided."}
                    </p>
                  </div>
                  {selectedApplication.resume_url && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Resume</h4>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a
                              href={selectedApplication.resume_url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.open(selectedApplication.resume_url, "_blank");
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Open in New Tab
                          </Button>
                        </div>
                      </div>
                      <div className="border rounded-lg overflow-hidden bg-gray-900/50">
                        <iframe
                          src={`${selectedApplication.resume_url}#toolbar=0`}
                          className="w-full h-[600px]"
                          title="Resume Preview"
                          style={{ border: "none" }}
                        />
                        <p className="text-xs text-gray-500 p-2 bg-gray-800/50">
                          If the resume doesn't load, use the "Open in New Tab" button above.
                        </p>
                      </div>
                      {selectedApplication.resume?.version_label && (
                        <p className="text-xs text-gray-400">
                          Resume Version: {selectedApplication.resume.version_label}
                        </p>
                      )}
                    </div>
                  )}
                  {!selectedApplication.resume_url && (
                    <div className="text-sm text-gray-400 italic">
                      No resume provided with this application.
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
