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
import { Search, User, Briefcase, Calendar, Download, Eye, CheckCircle2, XCircle, Clock, Mail } from "lucide-react";
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
        .select("*, jobs(*), profiles(*)")
        .in("job_id", jobIds)
        .order("applied_at", { ascending: false });

      if (jobIdFilter) {
        query = query.eq("job_id", jobIdFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && jobIds.length > 0,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ appId, status }: { appId: string; status: string }) => {
      const { error } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", appId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Application status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["alumni-applications"] });
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
    pending: applications?.filter((a: any) => a.status === "pending").length || 0,
    shortlisted: applications?.filter((a: any) => a.status === "shortlisted").length || 0,
    rejected: applications?.filter((a: any) => a.status === "rejected").length || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "shortlisted":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500">Shortlisted</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500">Rejected</Badge>;
      case "accepted":
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500">Accepted</Badge>;
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
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
                      {app.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-500 text-green-500 hover:bg-green-500/10"
                            onClick={() => updateStatusMutation.mutate({ appId: app.id, status: "shortlisted" })}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Shortlist
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-500/10"
                            onClick={() => updateStatusMutation.mutate({ appId: app.id, status: "rejected" })}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      {app.status === "shortlisted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                          onClick={() => updateStatusMutation.mutate({ appId: app.id, status: "accepted" })}
                        >
                          Accept
                        </Button>
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
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
                    <div>
                      <a
                        href={selectedApplication.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        <Download className="h-4 w-4" />
                        Download Resume
                      </a>
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
