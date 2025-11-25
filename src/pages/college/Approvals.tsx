import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Briefcase, MapPin, DollarSign, CheckCircle2, XCircle, Eye, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function JobApprovals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/college/dashboard" },
    { label: "Students", href: "/college/students" },
    { label: "Placement Drives", href: "/college/drives" },
    { label: "Events", href: "/college/events" },
    { label: "Analytics", href: "/college/analytics" },
    { label: "Job Approvals", href: "/college/approvals" },
    { label: "Profile", href: "/college/profile" },
  ];

  // Fetch college data
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

  // Fetch pending jobs
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["pending-jobs", collegeId],
    queryFn: async () => {
      if (!collegeId) return [];
      const { data, error } = await supabase
        .from("jobs")
        .select("*, profiles!jobs_posted_by_fkey(full_name, email)")
        .eq("college_id", collegeId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!collegeId,
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
        description: `The job has been ${variables.status === "approved" ? "approved" : "rejected"}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["pending-jobs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating job status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const stats = {
    pending: jobs?.length || 0,
    approved: 0, // Would need separate query
    rejected: 0, // Would need separate query
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Job Approvals</h1>
          <p className="text-gray-400">Review and approve job postings from alumni</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500 mb-1">{stats.pending}</div>
                <div className="text-sm text-gray-400">Pending Approval</div>
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

        {/* Pending Jobs */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading jobs...</p>
          </div>
        ) : jobs && jobs.length === 0 ? (
          <Card className="glass-hover">
            <CardContent className="pt-12 pb-12 text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No pending approvals</h3>
              <p className="text-gray-400">All job postings have been reviewed.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs?.map((job: any, idx: number) => (
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
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {job.company_name}
                          </div>
                          {job.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <span>Posted by: {job.profiles?.full_name || "Unknown"}</span>
                          </div>
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
                    </div>
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
                    Posted by {selectedJob.profiles?.full_name || "Unknown"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
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
                      className="flex-1 border-green-500 text-green-500 hover:bg-green-500/10"
                      onClick={() => {
                        updateJobStatusMutation.mutate({ jobId: selectedJob.id, status: "approved" });
                        setViewDialogOpen(false);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10"
                      onClick={() => {
                        updateJobStatusMutation.mutate({ jobId: selectedJob.id, status: "rejected" });
                        setViewDialogOpen(false);
                      }}
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
