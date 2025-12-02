import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, Users, TrendingUp, Plus, ArrowRight, CheckCircle2, Clock, AlertTriangle, ShieldCheck, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AlumniDashboard() {
  const { user } = useAuth();

  const navItems = [
    { label: "Dashboard", href: "/alumni/dashboard" },
    { label: "Post Job", href: "/alumni/post-job" },
    { label: "My Jobs", href: "/alumni/jobs" },
    { label: "Applications", href: "/alumni/applications" },
    { label: "Interviews", href: "/alumni/interviews" },
    { label: "Candidates", href: "/alumni/candidates" },
    { label: "Profile", href: "/alumni/profile" },
  ];

  // Fetch profile with verification status
  const { data: profile } = useQuery({
    queryKey: ["alumni-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*, colleges(name)")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const verificationStatus = profile?.alumni_verification_status;
  const collegeName = profile?.colleges?.name;

  // Fetch posted jobs
  const { data: jobs } = useQuery({
    queryKey: ["alumni-jobs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("posted_by", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch applications
  const { data: applications } = useQuery({
    queryKey: ["alumni-applications", user?.id],
    queryFn: async () => {
      if (!user || !jobs) return [];
      const jobIds = jobs.map(j => j.id);
      if (jobIds.length === 0) return [];

      try {
        const { data, error } = await supabase
          .from("applications")
          .select("*, jobs(*)")
          .in("job_id", jobIds);
        if (error) {
          console.error("Error fetching applications:", error);
          return [];
        }
        return data || [];
      } catch (error) {
        console.error("Error in applications query:", error);
        return [];
      }
    },
    enabled: !!user && !!jobs
  });

  const activeJobs = jobs?.filter(j => j.status === "active" || j.status === "approved") || [];
  const totalApplications = applications?.length || 0;
  const shortlistedCount = applications?.filter(a => a.status === "shortlisted").length || 0;
  const avgMatchScore = applications?.length
    ? Math.round(applications.reduce((sum: number, app: any) => sum + (app.match_score || 0), 0) / applications.length)
    : 0;

  // Application pipeline data
  const pipelineData = [
    { stage: "Applied", value: applications?.filter(a => a.status === "applied" || a.status === "pending").length || 0 },
    { stage: "Shortlisted", value: shortlistedCount },
    { stage: "Interview", value: applications?.filter(a => a.status === "interview_scheduled").length || 0 },
    { stage: "Hired", value: applications?.filter(a => a.status === "offer" || a.status === "accepted").length || 0 },
  ];

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Alumni Dashboard</h1>
          <p className="text-gray-400">Manage your job postings and candidates</p>
        </motion.div>

        {/* Verification Status Banner */}
        {verificationStatus === "pending" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert className="bg-yellow-500/10 border-yellow-500/30 mb-6">
              <Clock className="h-5 w-5 text-yellow-500" />
              <AlertTitle className="text-yellow-500">Verification Pending</AlertTitle>
              <AlertDescription className="text-gray-300">
                Your alumni/startup account is pending verification by {collegeName || "your college representative"}. 
                Once verified, your job postings will be visible to students from your institution.
                You can still post jobs, but they will require approval before students can view them.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {verificationStatus === "approved" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert className="bg-green-500/10 border-green-500/30 mb-6">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <AlertTitle className="text-green-500">Verified Alumni</AlertTitle>
              <AlertDescription className="text-gray-300">
                Your account is verified by {collegeName || "your institution"}. 
                Your approved job postings are visible to students from your institution.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {verificationStatus === "rejected" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert className="bg-red-500/10 border-red-500/30 mb-6">
              <XCircle className="h-5 w-5 text-red-500" />
              <AlertTitle className="text-red-500">Verification Rejected</AlertTitle>
              <AlertDescription className="text-gray-300">
                Your alumni verification was rejected. 
                {profile?.alumni_rejection_reason && (
                  <span className="block mt-1">Reason: {profile.alumni_rejection_reason}</span>
                )}
                Please contact your college representative or update your profile with correct information.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                <Briefcase className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeJobs.length}</div>
                <p className="text-xs text-gray-400">Job postings</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                <Users className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalApplications}</div>
                <p className="text-xs text-gray-400">Received</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Match Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgMatchScore}%</div>
                <p className="text-xs text-gray-400">Candidate quality</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Shortlisted</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{shortlistedCount}</div>
                <p className="text-xs text-gray-400">Candidates</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Application Pipeline */}
        <Card className="glass-hover">
          <CardHeader>
            <CardTitle>Application Pipeline</CardTitle>
            <CardDescription>Candidate progression stages</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="stage" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #334155" }} />
                <Bar dataKey="value" fill="#6366F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Applications */}
        {applications && applications.length > 0 && (
          <Card className="glass-hover">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Applications</CardTitle>
                  <CardDescription>Latest candidate applications</CardDescription>
                </div>
                <Link to="/alumni/applications">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {applications.slice(0, 5).map((app: any) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3 rounded-lg glass"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Candidate</div>
                        <div className="text-xs text-gray-400">{app.jobs?.title || "Job"}</div>
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

        {/* Quick Actions */}
        <Card className="glass-hover">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Link to="/alumni/post-job">
                <Button className="w-full gradient-primary" size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Post New Job
                </Button>
              </Link>
              <Link to="/alumni/applications">
                <Button className="w-full" variant="outline" size="lg">
                  <Users className="h-5 w-5 mr-2" />
                  View All Applications
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
