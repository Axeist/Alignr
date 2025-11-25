import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, Briefcase, Calendar, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList } from "recharts";

export default function CollegeDashboard() {
  const { user } = useAuth();

  const navItems = [
    { label: "Dashboard", href: "/college/dashboard" },
    { label: "Students", href: "/college/students" },
    { label: "Placement Drives", href: "/college/drives" },
    { label: "Events", href: "/college/events" },
    { label: "Analytics", href: "/college/analytics" },
    { label: "Job Approvals", href: "/college/approvals" },
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
    enabled: !!user
  });

  const collegeId = profile?.college_id;

  // Fetch metrics
  const { data: metrics } = useQuery({
    queryKey: ["college-metrics", collegeId],
    queryFn: async () => {
      if (!collegeId) return null;

      const [studentsResult, jobsResult, eventsResult, applicationsResult] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }).eq("college_id", collegeId).eq("role", "student"),
        supabase.from("jobs").select("id", { count: "exact" }).eq("college_id", collegeId).in("status", ["pending", "active"]),
        supabase.from("college_events").select("id", { count: "exact" }).eq("college_id", collegeId).gte("event_date", new Date().toISOString()),
        supabase.from("applications").select("id", { count: "exact" }).eq("college_id", collegeId)
      ]);

      const totalStudents = studentsResult.count || 0;
      const pendingJobs = jobsResult.count || 0;
      const upcomingEvents = eventsResult.count || 0;
      const totalApplications = applicationsResult.count || 0;

      // Calculate placement rate (simplified)
      const placedStudents = 0; // Would need to query offers/selected students
      const placementRate = totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0;

      return {
        totalStudents,
        pendingJobs,
        upcomingEvents,
        totalApplications,
        placementRate,
        avgCareerScore: 72 // Would calculate from profiles
      };
    },
    enabled: !!collegeId
  });

  // Student engagement data (mock for now)
  const engagementData = [
    { date: "Week 1", active: 120 },
    { date: "Week 2", active: 145 },
    { date: "Week 3", active: 138 },
    { date: "Week 4", active: 162 },
  ];

  // Placement pipeline data
  const pipelineData = [
    { stage: "Registered", value: metrics?.totalStudents || 0 },
    { stage: "Profile Complete", value: Math.round((metrics?.totalStudents || 0) * 0.85) },
    { stage: "Applying", value: Math.round((metrics?.totalStudents || 0) * 0.65) },
    { stage: "Interviewed", value: Math.round((metrics?.totalStudents || 0) * 0.35) },
    { stage: "Offered", value: Math.round((metrics?.totalStudents || 0) * 0.15) },
  ];

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">College Dashboard</h1>
          <p className="text-gray-400">Overview of your placement ecosystem</p>
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
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalStudents || 0}</div>
                <p className="text-xs text-gray-400">Registered students</p>
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
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <TrendingUp className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{engagementData[engagementData.length - 1]?.active || 0}</div>
                <p className="text-xs text-gray-400">This week</p>
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
                <CardTitle className="text-sm font-medium">Avg Career Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.avgCareerScore || 0}</div>
                <p className="text-xs text-gray-400">Student average</p>
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
                <CardTitle className="text-sm font-medium">Upcoming Drives</CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.upcomingEvents || 0}</div>
                <p className="text-xs text-gray-400">Scheduled drives</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Student Engagement */}
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle>Student Engagement</CardTitle>
              <CardDescription>Weekly active users</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #334155" }} />
                  <Line type="monotone" dataKey="active" stroke="#6366F1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Placement Pipeline */}
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle>Placement Pipeline</CardTitle>
              <CardDescription>Student progression stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pipelineData.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{item.stage}</span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${(item.value / pipelineData[0].value) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="glass-hover">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Link to="/college/drives">
                <Button className="w-full gradient-primary" size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Drive
                </Button>
              </Link>
              <Link to="/college/events">
                <Button className="w-full" variant="outline" size="lg">
                  <Calendar className="h-5 w-5 mr-2" />
                  Post Event
                </Button>
              </Link>
              <Link to="/college/analytics">
                <Button className="w-full" variant="outline" size="lg">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  View Analytics
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
