import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Briefcase, Users, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function AdminDashboard() {
  // Fetch global metrics
  const { data: metrics } = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      const [collegesResult, usersResult, jobsResult, applicationsResult] = await Promise.all([
        supabase.from("colleges").select("id", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("jobs").select("id", { count: "exact" }),
        supabase.from("applications").select("id", { count: "exact" })
      ]);

      return {
        totalColleges: collegesResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalJobs: jobsResult.count || 0,
        totalApplications: applicationsResult.count || 0,
      };
    }
  });

  // Fetch flagged content
  const { data: flaggedJobs } = useQuery({
    queryKey: ["flagged-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "pending")
        .limit(5);
      if (error) throw error;
      return data || [];
    }
  });

  // User distribution by role
  const { data: userDistribution } = useQuery({
    queryKey: ["user-distribution"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role");
      if (error) throw error;

      const distribution = data?.reduce((acc: any, item: any) => {
        acc[item.role] = (acc[item.role] || 0) + 1;
        return acc;
      }, {});

      return [
        { name: "Students", value: distribution?.student || 0 },
        { name: "Alumni", value: distribution?.alumni || 0 },
        { name: "Colleges", value: distribution?.college || 0 },
        { name: "Admins", value: distribution?.admin || 0 },
      ];
    }
  });

  const COLORS = ["#6366F1", "#06B6D4", "#F472B6", "#10B981"];

  return (
    <DashboardLayout navItems={[
      { label: "Dashboard", href: "/admin/dashboard" },
      { label: "Colleges", href: "/admin/colleges" },
      { label: "Jobs", href: "/admin/jobs" },
      { label: "Users", href: "/admin/users" },
      { label: "Analytics", href: "/admin/analytics" },
    ]}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Platform overview and management</p>
        </motion.div>

        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Colleges</CardTitle>
                <Building2 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalColleges || 0}</div>
                <p className="text-xs text-gray-400">Registered colleges</p>
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
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
                <p className="text-xs text-gray-400">Platform users</p>
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
                <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                <Briefcase className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalJobs || 0}</div>
                <p className="text-xs text-gray-400">Job postings</p>
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
                <CardTitle className="text-sm font-medium">Applications</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalApplications || 0}</div>
                <p className="text-xs text-gray-400">Total applications</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* User Distribution */}
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
              <CardDescription>Users by role</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(userDistribution || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Platform status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg glass">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Database</span>
                </div>
                <Badge className="bg-green-500/20 text-green-500">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg glass">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm">API Services</span>
                </div>
                <Badge className="bg-green-500/20 text-green-500">Operational</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg glass">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Storage</span>
                </div>
                <Badge className="bg-green-500/20 text-green-500">Normal</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Flagged Content */}
        {flaggedJobs && flaggedJobs.length > 0 && (
          <Card className="glass-hover border-yellow-500/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Pending Job Approvals
                  </CardTitle>
                  <CardDescription>Jobs awaiting moderation</CardDescription>
                </div>
                <Link to="/admin/jobs">
                  <Button variant="outline" size="sm">
                    Review All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {flaggedJobs.slice(0, 3).map((job: any) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 rounded-lg glass"
                  >
                    <div>
                      <div className="font-semibold text-sm">{job.title}</div>
                      <div className="text-xs text-gray-400">{job.company_name}</div>
                    </div>
                    <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                      Pending
                    </Badge>
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
            <div className="grid md:grid-cols-3 gap-4">
              <Link to="/admin/colleges">
                <Button className="w-full" variant="outline" size="lg">
                  <Building2 className="h-5 w-5 mr-2" />
                  Manage Colleges
                </Button>
              </Link>
              <Link to="/admin/jobs">
                <Button className="w-full" variant="outline" size="lg">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Moderate Jobs
                </Button>
              </Link>
              <Link to="/admin/analytics">
                <Button className="w-full" variant="outline" size="lg">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
