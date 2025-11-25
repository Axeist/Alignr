import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, Briefcase, TrendingUp, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

export default function Analytics() {
  const { user } = useAuth();

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

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["college-analytics", collegeId],
    queryFn: async () => {
      if (!collegeId) return null;

      const [studentsResult, jobsResult, applicationsResult, drivesResult] = await Promise.all([
        supabase.from("profiles").select("department, year, career_score").eq("college_id", collegeId),
        supabase.from("jobs").select("status").eq("college_id", collegeId),
        supabase.from("applications").select("status, applied_at").eq("college_id", collegeId),
        supabase.from("placement_drives").select("drive_date").eq("college_id", collegeId),
      ]);

      const students = studentsResult.data || [];
      const jobs = jobsResult.data || [];
      const applications = applicationsResult.data || [];
      const drives = drivesResult.data || [];

      // Department distribution
      const deptDistribution = students.reduce((acc: any, s: any) => {
        const dept = s.department || "Unknown";
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {});

      // Year distribution
      const yearDistribution = students.reduce((acc: any, s: any) => {
        const year = s.year || "Unknown";
        acc[year] = (acc[year] || 0) + 1;
        return acc;
      }, {});

      // Job status distribution
      const jobStatus = jobs.reduce((acc: any, j: any) => {
        acc[j.status] = (acc[j.status] || 0) + 1;
        return acc;
      }, {});

      // Application trends (last 6 months)
      const months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        return date.toISOString().slice(0, 7);
      });

      const applicationTrends = months.map((month) => {
        const count = applications.filter((a: any) => a.applied_at?.startsWith(month)).length;
        return { month, count };
      });

      // Career score distribution
      const scoreRanges = [
        { range: "0-20", min: 0, max: 20 },
        { range: "21-40", min: 21, max: 40 },
        { range: "41-60", min: 41, max: 60 },
        { range: "61-80", min: 61, max: 80 },
        { range: "81-100", min: 81, max: 100 },
      ];

      const scoreDistribution = scoreRanges.map(({ range, min, max }) => ({
        range,
        count: students.filter((s: any) => {
          const score = s.career_score || 0;
          return score >= min && score <= max;
        }).length,
      }));

      return {
        totalStudents: students.length,
        totalJobs: jobs.length,
        totalApplications: applications.length,
        totalDrives: drives.length,
        deptDistribution: Object.entries(deptDistribution).map(([name, value]) => ({ name, value })),
        yearDistribution: Object.entries(yearDistribution).map(([name, value]) => ({ name, value: Number(value) })),
        jobStatus: Object.entries(jobStatus).map(([name, value]) => ({ name, value: Number(value) })),
        applicationTrends,
        scoreDistribution,
        avgCareerScore: students.length
          ? Math.round(students.reduce((sum: number, s: any) => sum + (s.career_score || 0), 0) / students.length)
          : 0,
      };
    },
    enabled: !!collegeId,
  });

  const COLORS = ["#6366F1", "#06B6D4", "#F472B6", "#10B981", "#F59E0B", "#EF4444"];

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">View detailed placement analytics and trends</p>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalStudents || 0}</div>
              <p className="text-xs text-gray-400">Registered students</p>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalJobs || 0}</div>
              <p className="text-xs text-gray-400">Job postings</p>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Target className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalApplications || 0}</div>
              <p className="text-xs text-gray-400">Total applications</p>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Career Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.avgCareerScore || 0}%</div>
              <p className="text-xs text-gray-400">Student average</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Department Distribution */}
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle>Students by Department</CardTitle>
              <CardDescription>Distribution of students across departments</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics?.deptDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(analytics?.deptDistribution || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Year Distribution */}
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle>Students by Year</CardTitle>
              <CardDescription>Distribution across academic years</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.yearDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #334155" }} />
                  <Bar dataKey="value" fill="#6366F1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Application Trends */}
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle>Application Trends</CardTitle>
              <CardDescription>Applications over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.applicationTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #334155" }} />
                  <Line type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Career Score Distribution */}
          <Card className="glass-hover">
          <CardHeader>
              <CardTitle>Career Score Distribution</CardTitle>
              <CardDescription>Distribution of student career scores</CardDescription>
          </CardHeader>
          <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.scoreDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="range" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #334155" }} />
                  <Bar dataKey="count" fill="#10B981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
          </CardContent>
        </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
