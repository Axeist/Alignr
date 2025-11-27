import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Briefcase, MapPin, DollarSign, Calendar, Plus, Search, Edit, Trash2, Eye, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AlumniJobs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  const navItems = [
    { label: "Dashboard", href: "/alumni/dashboard" },
    { label: "Post Job", href: "/alumni/post-job" },
    { label: "My Jobs", href: "/alumni/jobs" },
    { label: "Applications", href: "/alumni/applications" },
    { label: "Candidates", href: "/alumni/candidates" },
    { label: "Profile", href: "/alumni/profile" },
  ];

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["alumni-jobs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: jobsData, error } = await supabase
        .from("jobs")
        .select("*, colleges(name)")
        .eq("posted_by", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Get application counts for each job
      const jobsWithCounts = await Promise.all(
        (jobsData || []).map(async (job) => {
          try {
            const { count, error: countError } = await supabase
              .from("applications")
              .select("*", { count: "exact", head: true })
              .eq("job_id", job.id);
            
            if (countError) {
              console.error(`Error fetching application count for job ${job.id}:`, countError);
              return {
                ...job,
                application_count: 0,
              };
            }
            
            return {
              ...job,
              application_count: count || 0,
            };
          } catch (error) {
            console.error(`Error processing job ${job.id}:`, error);
            return {
              ...job,
              application_count: 0,
            };
          }
        })
      );
      
      return jobsWithCounts;
    },
    enabled: !!user,
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!user) throw new Error("Not authenticated");
      
      // Delete the job and verify it was actually deleted
      const { data, error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId)
        .eq("posted_by", user.id) // Ensure user owns the job
        .select();
      
      if (error) throw error;
      
      // Check if any rows were deleted
      if (!data || data.length === 0) {
        throw new Error("Failed to delete job. You may not have permission to delete this job.");
      }
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Job deleted",
        description: "The job posting has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["alumni-jobs"] });
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
      case "approved":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500">Active</Badge>;
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

  const filteredJobs = jobs?.filter((job: any) => {
    if (!job) return false;
    const title = job.title?.toLowerCase() || "";
    const company = job.company_name?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return title.includes(query) || company.includes(query);
  }) || [];

  const stats = {
    total: jobs?.length || 0,
    active: jobs?.filter((j: any) => j.status === "active" || j.status === "approved").length || 0,
    pending: jobs?.filter((j: any) => j.status === "pending").length || 0,
    totalApplications: jobs?.reduce((sum: number, job: any) => sum + (job.application_count || 0), 0) || 0,
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">My Job Postings</h1>
              <p className="text-gray-400">Manage your job postings and track applications</p>
            </div>
            <Link to="/alumni/post-job">
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Post New Job
              </Button>
            </Link>
          </div>
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
                <div className="text-3xl font-bold text-green-500 mb-1">{stats.active}</div>
                <div className="text-sm text-gray-400">Active</div>
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
                <div className="text-3xl font-bold text-blue-500 mb-1">{stats.totalApplications}</div>
                <div className="text-sm text-gray-400">Total Applications</div>
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
                placeholder="Search jobs by title or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
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
              <p className="text-gray-400 mb-6">
                {searchQuery ? "Try a different search term" : "Get started by posting your first job"}
              </p>
              {!searchQuery && (
                <Link to="/alumni/post-job">
                  <Button className="gradient-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Post Your First Job
                  </Button>
                </Link>
              )}
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
                          {job.job_type && (
                            <Badge variant="outline">{job.job_type}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={`/alumni/applications?job_id=${job.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Applications
                          </Button>
                        </Link>
                        <Link to={`/alumni/post-job?edit=${job.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setJobToDelete(job.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-300 mb-4 line-clamp-2">{job.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        {job.salary_range && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <DollarSign className="h-4 w-4" />
                            {job.salary_range}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-gray-400">
                          <Calendar className="h-4 w-4" />
                          Posted {new Date(job.created_at).toLocaleDateString()}
                        </div>
                        {job.application_count > 0 && (
                          <Badge variant="outline">
                            {job.application_count} applications
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the job posting.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => jobToDelete && deleteJobMutation.mutate(jobToDelete)}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
