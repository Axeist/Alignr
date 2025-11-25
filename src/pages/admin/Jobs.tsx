import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Briefcase, Search, CheckCircle2, XCircle, Eye } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminJobs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Colleges", href: "/admin/colleges" },
    { label: "Jobs", href: "/admin/jobs" },
    { label: "Users", href: "/admin/users" },
    { label: "Analytics", href: "/admin/analytics" },
  ];

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["admin-jobs", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select("*, colleges(name), profiles!jobs_posted_by_fkey(full_name)")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const updateJobStatusMutation = useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: string }) => {
      const { error } = await supabase
        .from("jobs")
        .update({ status })
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({
        title: `Job ${variables.status === "approved" ? "approved" : "rejected"}`,
        description: `The job status has been updated.`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredJobs = jobs?.filter((job: any) =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const stats = {
    total: jobs?.length || 0,
    pending: jobs?.filter((j: any) => j.status === "pending").length || 0,
    approved: jobs?.filter((j: any) => j.status === "approved" || j.status === "active").length || 0,
    rejected: jobs?.filter((j: any) => j.status === "rejected").length || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
      case "approved":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500">Rejected</Badge>;
      case "closed":
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
          <h1 className="text-4xl font-bold mb-2">Job Management</h1>
          <p className="text-gray-400">Monitor and manage all job postings across the platform</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{stats.total}</div>
                <div className="text-sm text-gray-400">Total Jobs</div>
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
                <div className="text-3xl font-bold text-green-500 mb-1">{stats.approved}</div>
                <div className="text-sm text-gray-400">Approved</div>
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
                  placeholder="Search jobs..."
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
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="glass-hover">
            <CardContent className="pt-12 pb-12 text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
              <p className="text-gray-400">Try adjusting your filters.</p>
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
                          {getStatusBadge(job.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>{job.company_name}</span>
                          {job.colleges?.name && (
                            <>
                              <span>•</span>
                              <span>{job.colleges.name}</span>
                            </>
                          )}
                          {job.profiles?.full_name && (
                            <>
                              <span>•</span>
                              <span>Posted by {job.profiles.full_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedJob(job);
                            setViewDialogOpen(true);
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
                              onClick={() => updateJobStatusMutation.mutate({ jobId: job.id, status: "approved" })}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500 text-red-500 hover:bg-red-500/10"
                              onClick={() => updateJobStatusMutation.mutate({ jobId: job.id, status: "rejected" })}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-300 line-clamp-2">{job.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* View Job Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedJob && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedJob.title}</DialogTitle>
                  <DialogDescription>
                    {selectedJob.company_name} • {selectedJob.colleges?.name || "No college"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
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
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
