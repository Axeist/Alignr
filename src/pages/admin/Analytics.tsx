import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Briefcase, Users, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

export default function AdminAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const [collegesResult, usersResult, jobsResult, applicationsResult] = await Promise.all([
        supabase.from("colleges").select("id, created_at"),
        supabase.from("profiles").select("id, created_at, user_roles(role)"),
        supabase.from("jobs").select("id, status, created_at, college_id"),
        supabase.from("applications").select("id, created_at"),
      ]);

      const colleges = collegesResult.data || [];
      const users = usersResult.data || [];
      const jobs = jobsResult.data || [];
      const applications = applicationsResult.data || [];

      // User growth over time (last 12 months)
      const months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        return date.toISOString().slice(0, 7);
      });

      const userGrowth = months.map((month) => {
        const count = users.filter((u: any) => u.created_at?.startsWith(month)).length;
        return { month, count };
      });

      // Job growth over time
      const jobGrowth = months.map((month) => {
        const count = jobs.filter((j: any) => j.created_at?.startsWith(month)).length;
        return { month, count };
      });

      // Job status distribution
      const jobStatus = jobs.reduce((acc: any, j: any) => {
        acc[j.status] = (acc[j.status] || 0) + 1;
        return acc;
      }, {});

      // Role distribution
      const roleDistribution = users.reduce((acc: any, u: any) => {
        const roles = u.user_roles || [];
        roles.forEach((ur: any) => {
          acc[ur.role] = (acc[ur.role] || 0) + 1;
        });
        return acc;
      }, {});

      // Colleges with most jobs
      const collegeJobCounts = jobs.reduce((acc: any, j: any) => {
        if (j.college_id) {
          acc[j.college_id] = (acc[j.college_id] || 0) + 1;
        }
        return acc;
      }, {});

      return {
        totalColleges: colleges.length,
        totalUsers: users.length,
        totalJobs: jobs.length,
        totalApplications: applications.length,
        userGrowth,
        jobGrowth,
        jobStatus: Object.entries(jobStatus).map(([name, value]) => ({ name, value: Number(value) })),
        roleDistribution: Object.entries(roleDistribution).map(([name, value]) => ({ name, value: Number(value) })),
      };
    },
  });

  const COLORS = ["#6366F1", "#06B6D4", "#F472B6", "#10B981", "#F59E0B", "#EF4444"];

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
          <h1 className="text-4xl font-bold mb-2">Platform Analytics</h1>
          <p className="text-gray-400">View comprehensive platform analytics</p>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Colleges</CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalColleges || 0}</div>
              <p className="text-xs text-gray-400">Registered colleges</p>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
              <p className="text-xs text-gray-400">Platform users</p>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalJobs || 0}</div>
              <p className="text-xs text-gray-400">Job postings</p>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalApplications || 0}</div>
              <p className="text-xs text-gray-400">Total applications</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* User Growth */}
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>New users over the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.userGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #334155" }} />
                  <Line type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Job Growth */}
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle>Job Growth</CardTitle>
              <CardDescription>New jobs posted over the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.jobGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #334155" }} />
                  <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Role Distribution */}
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle>User Role Distribution</CardTitle>
              <CardDescription>Users by role</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics?.roleDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(analytics?.roleDistribution || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Job Status Distribution */}
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle>Job Status Distribution</CardTitle>
              <CardDescription>Jobs by status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.jobStatus || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #334155" }} />
                  <Bar dataKey="value" fill="#6366F1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
