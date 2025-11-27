import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Trophy, 
  Target, 
  CheckCircle2, 
  Calendar,
  Briefcase,
  Award,
  Sparkles,
  ArrowRight,
  ExternalLink,
  FileText,
  Linkedin,
  Brain,
  BookOpen,
  Zap,
  BarChart3,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock3,
  TrendingDown,
  Activity,
  Star,
  MessageSquare
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function StudentDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const navItems = [
    { label: "Dashboard", href: "/student/dashboard" },
    { label: "Profile", href: "/student/profile" },
    { label: "Resume", href: "/student/resume" },
    { label: "LinkedIn", href: "/student/linkedin" },
    { label: "Job Board", href: "/student/jobs" },
    { label: "My Applications", href: "/student/applications" },
    { label: "Career Quiz", href: "/student/career-quiz" },
    { label: "Career Paths", href: "/student/career-paths" },
    { label: "Skills", href: "/student/skills-recommendations" },
    { label: "Events", href: "/student/events" },
    { label: "Leaderboard", href: "/student/leaderboard" },
  ];

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch resume
  const { data: resume } = useQuery({
    queryKey: ["resume-primary", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_primary", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch LinkedIn
  const { data: linkedin } = useQuery({
    queryKey: ["linkedin-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("linkedin_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch career quiz
  const { data: quiz } = useQuery({
    queryKey: ["career-quiz", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("career_quizzes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch career paths
  const { data: careerPaths } = useQuery({
    queryKey: ["career-paths", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("career_path_suggestions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch skills recommendations
  const { data: skillsRec } = useQuery({
    queryKey: ["skills-recommendations", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("skills_recommendations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch applications
  const { data: applications } = useQuery({
    queryKey: ["applications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("applications")
        .select("*, jobs(*)")
        .eq("user_id", user.id)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch recent jobs
  const { data: recentJobs } = useQuery({
    queryKey: ["recent-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch events
  const { data: events } = useQuery({
    queryKey: ["events", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("college_events")
        .select("*")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Calculate insights
  const careerScore = profile?.career_score || 0;
  const resumeScore = (resume as any)?.ats_score || 0;
  const linkedinScore = linkedin?.completeness_score || 0;
  const quizScore = profile?.quiz_score || 0;
  const totalApplications = applications?.length || 0;
  const pendingApps = applications?.filter((a: any) => a.status === "pending" || a.status === "applied").length || 0;
  const shortlistedApps = applications?.filter((a: any) => a.status === "shortlisted").length || 0;
  const rejectedApps = applications?.filter((a: any) => a.status === "rejected").length || 0;

  // Application status chart data
  const applicationStatusData = [
    { name: "Pending", value: pendingApps, color: "#F59E0B" },
    { name: "Shortlisted", value: shortlistedApps, color: "#10B981" },
    { name: "Rejected", value: rejectedApps, color: "#EF4444" },
  ].filter(item => item.value > 0);

  // Calculate completion percentage
  const completionItems = [
    { name: "Resume", completed: !!resume && resumeScore > 0, score: resumeScore, link: "/student/resume" },
    { name: "LinkedIn", completed: !!linkedin && linkedinScore > 0, score: linkedinScore, link: "/student/linkedin" },
    { name: "Career Quiz", completed: !!quiz, score: quizScore, link: "/student/career-quiz" },
    { name: "Career Paths", completed: !!careerPaths, score: careerPaths?.suggested_paths?.length > 0 ? 100 : 0, link: "/student/career-paths" },
    { name: "Skills Plan", completed: !!skillsRec, score: skillsRec?.recommended_skills?.length > 0 ? 100 : 0, link: "/student/skills-recommendations" },
  ];
  const completionPercentage = Math.round((completionItems.filter(i => i.completed).length / completionItems.length) * 100);

  // Get top recommended skills
  const topSkills = skillsRec?.priority_skills?.slice(0, 5) || [];

  // Get top career path
  const topCareerPath = careerPaths?.top_matches?.primary || null;

  // Quick actions
  const quickActions = [
    { 
      icon: FileText, 
      label: "Resume", 
      href: "/student/resume",
      status: resume ? (resumeScore >= 70 ? "good" : "needs-work") : "missing",
      score: resumeScore
    },
    { 
      icon: Linkedin, 
      label: "LinkedIn", 
      href: "/student/linkedin",
      status: linkedin ? (linkedinScore >= 70 ? "good" : "needs-work") : "missing",
      score: linkedinScore
    },
    { 
      icon: Brain, 
      label: "Career Quiz", 
      href: "/student/career-quiz",
      status: quiz ? "good" : "missing",
      score: quizScore
    },
    { 
      icon: Target, 
      label: "Career Paths", 
      href: "/student/career-paths",
      status: careerPaths ? "good" : "missing"
    },
    { 
      icon: BookOpen, 
      label: "Skills", 
      href: "/student/skills-recommendations",
      status: skillsRec ? "good" : "missing"
    },
    { 
      icon: Briefcase, 
      label: "Job Board", 
      href: "/student/jobs",
      status: "action"
    },
  ];

  // Recalculate career score when data changes
  useEffect(() => {
    if (user && (resume || linkedin || quiz)) {
      supabase.functions.invoke("calculate-career-score", {
        body: { user_id: user.id }
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      }).catch((e) => {
        console.warn("Failed to calculate career score:", e);
      });
    }
  }, [resume?.ats_score, linkedin?.completeness_score, quiz, user?.id]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500/20 border-green-500/50";
    if (score >= 60) return "bg-yellow-500/20 border-yellow-500/50";
    return "bg-red-500/20 border-red-500/50";
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, {profile?.full_name?.split(" ")[0] || "Student"}! 👋
              </h1>
              <p className="text-gray-400">Here's your career overview and insights</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">Career Score</div>
              <div className={`text-5xl font-bold ${getScoreColor(careerScore)}`}>
                {careerScore}
              </div>
              <div className="text-xs text-gray-500 mt-1">out of 100</div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-hover">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Resume Score</div>
                  <div className={`text-2xl font-bold ${getScoreColor(resumeScore)}`}>
                    {resumeScore}
                  </div>
                </div>
                <FileText className={`h-8 w-8 ${getScoreColor(resumeScore)} opacity-50`} />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">LinkedIn Score</div>
                  <div className={`text-2xl font-bold ${getScoreColor(linkedinScore)}`}>
                    {linkedinScore}
                  </div>
                </div>
                <Linkedin className={`h-8 w-8 ${getScoreColor(linkedinScore)} opacity-50`} />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Applications</div>
                  <div className="text-2xl font-bold text-primary">
                    {totalApplications}
                  </div>
                </div>
                <Briefcase className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Profile Complete</div>
                  <div className={`text-2xl font-bold ${getScoreColor(completionPercentage)}`}>
                    {completionPercentage}%
                  </div>
                </div>
                <CheckCircle className={`h-8 w-8 ${getScoreColor(completionPercentage)} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="glass-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Access key features and improve your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickActions.map((action, idx) => (
                <Link key={idx} to={action.href}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-lg glass-hover border-2 transition-all cursor-pointer ${
                      action.status === "good" ? "border-green-500/50 bg-green-500/10" :
                      action.status === "needs-work" ? "border-yellow-500/50 bg-yellow-500/10" :
                      action.status === "missing" ? "border-red-500/50 bg-red-500/10" :
                      "border-primary/50 bg-primary/10"
                    }`}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <action.icon className={`h-6 w-6 ${
                        action.status === "good" ? "text-green-500" :
                        action.status === "needs-work" ? "text-yellow-500" :
                        action.status === "missing" ? "text-red-500" :
                        "text-primary"
                      }`} />
                      <div className="text-sm font-semibold">{action.label}</div>
                      {action.score !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          {action.score}/100
                        </Badge>
                      )}
                      {action.status === "missing" && (
                        <Badge variant="destructive" className="text-xs">Setup</Badge>
                      )}
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Insights */}
          <div className="lg:col-span-2 space-y-6">
            {/* Real Insights */}
            <Card className="glass-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Career Insights
                </CardTitle>
                <CardDescription>Personalized recommendations based on your profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!resume && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/50">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm mb-1">Upload Your Resume</div>
                      <div className="text-xs text-gray-400 mb-2">
                        Your resume is the foundation of your career profile. Upload it to get ATS scoring and personalized recommendations.
                      </div>
                      <Link to="/student/resume">
                        <Button size="sm" variant="outline" className="mt-2">
                          Upload Resume <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {resume && resumeScore < 70 && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/50">
                    <TrendingUp className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm mb-1">Improve Your Resume Score</div>
                      <div className="text-xs text-gray-400 mb-2">
                        Your resume score is {resumeScore}/100. Focus on adding quantified achievements and relevant keywords to boost your ATS score.
                      </div>
                      <Link to="/student/resume">
                        <Button size="sm" variant="outline" className="mt-2">
                          Optimize Resume <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {!quiz && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/50">
                    <Brain className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm mb-1">Take Career Assessment Quiz</div>
                      <div className="text-xs text-gray-400 mb-2">
                        Discover your ideal career path with our personalized quiz. Get AI-powered insights and role recommendations.
                      </div>
                      <Link to="/student/career-quiz">
                        <Button size="sm" variant="outline" className="mt-2">
                          Start Quiz <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {topCareerPath && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/50">
                    <Target className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm mb-1">Your Top Career Path: {topCareerPath}</div>
                      <div className="text-xs text-gray-400 mb-2">
                        Based on your profile and quiz results, this career path matches you best. Explore skills and next steps.
                      </div>
                      <Link to="/student/career-paths">
                        <Button size="sm" variant="outline" className="mt-2">
                          View Career Paths <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {topSkills.length > 0 && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-500/10 border border-purple-500/50">
                    <BookOpen className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm mb-2">Priority Skills to Learn</div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {topSkills.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="outline">{skill}</Badge>
                        ))}
                      </div>
                      <Link to="/student/skills-recommendations">
                        <Button size="sm" variant="outline" className="mt-2">
                          View All Skills <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {totalApplications === 0 && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-500/10 border border-orange-500/50">
                    <Briefcase className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm mb-1">Start Applying to Jobs</div>
                      <div className="text-xs text-gray-400 mb-2">
                        You haven't applied to any jobs yet. Browse the job board and start applying to increase your career score.
                      </div>
                      <Link to="/student/jobs">
                        <Button size="sm" variant="outline" className="mt-2">
                          Browse Jobs <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {totalApplications > 0 && shortlistedApps === 0 && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/50">
                    <MessageSquare className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm mb-1">No Shortlists Yet</div>
                      <div className="text-xs text-gray-400 mb-2">
                        You've applied to {totalApplications} job{totalApplications > 1 ? 's' : ''}, but none have been shortlisted. Consider improving your resume and LinkedIn profile.
                      </div>
                    </div>
                  </div>
                )}

                {shortlistedApps > 0 && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/50">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm mb-1">Great Progress! 🎉</div>
                      <div className="text-xs text-gray-400 mb-2">
                        You've been shortlisted for {shortlistedApps} position{shortlistedApps > 1 ? 's' : ''}! Keep up the momentum.
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile Completion */}
            <Card className="glass-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Profile Completion
                </CardTitle>
                <CardDescription>Track your profile setup progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={completionPercentage} className="h-3" />
                <div className="space-y-2">
                  {completionItems.map((item, idx) => (
                    <Link key={idx} to={item.link}>
                      <div className="flex items-center justify-between p-3 rounded-lg glass-hover cursor-pointer">
                        <div className="flex items-center gap-3">
                          {item.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-gray-500" />
                          )}
                          <span className="text-sm">{item.name}</span>
                        </div>
                        {item.completed && item.score > 0 && (
                          <Badge variant="outline" className={getScoreColor(item.score)}>
                            {item.score}/100
                          </Badge>
                        )}
                        {!item.completed && (
                          <Badge variant="destructive" className="text-xs">Setup</Badge>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Applications */}
            {totalApplications > 0 && (
              <Card className="glass-hover">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        Recent Applications
                      </CardTitle>
                      <CardDescription>Your latest job applications</CardDescription>
                    </div>
                    <Link to="/student/applications">
                      <Button variant="ghost" size="sm">
                        View All <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {applications?.slice(0, 5).map((app: any) => (
                      <div key={app.id} className="flex items-center justify-between p-3 rounded-lg glass">
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{app.jobs?.title || "Job"}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {app.jobs?.company_name || "Company"} • {new Date(app.applied_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge 
                          variant={
                            app.status === "shortlisted" ? "default" :
                            app.status === "rejected" ? "destructive" :
                            "outline"
                          }
                        >
                          {app.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Stats & Activity */}
          <div className="space-y-6">
            {/* Application Status */}
            {totalApplications > 0 && (
              <Card className="glass-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Application Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {applicationStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={applicationStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {applicationStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-sm text-gray-400 text-center py-8">
                      No application data yet
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Score Breakdown */}
            <Card className="glass-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Score Breakdown
                </CardTitle>
                <CardDescription>Components of your career score</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Resume</span>
                    <span className={`text-sm font-semibold ${getScoreColor(resumeScore)}`}>
                      {resumeScore}/100
                    </span>
                  </div>
                  <Progress value={resumeScore} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">LinkedIn</span>
                    <span className={`text-sm font-semibold ${getScoreColor(linkedinScore)}`}>
                      {linkedinScore}/100
                    </span>
                  </div>
                  <Progress value={linkedinScore} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Career Quiz</span>
                    <span className={`text-sm font-semibold ${getScoreColor(quizScore)}`}>
                      {quizScore}/100
                    </span>
                  </div>
                  <Progress value={quizScore} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Activity</span>
                    <span className="text-sm font-semibold text-primary">
                      {Math.min(totalApplications * 10, 100)}/100
                    </span>
                  </div>
                  <Progress value={Math.min(totalApplications * 10, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="glass-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {events && events.length > 0 ? (
                  events.map((event: any) => (
                    <div key={event.id} className="p-3 rounded-lg glass">
                      <div className="font-semibold text-sm">{event.title || event.event_name}</div>
                      <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {new Date(event.event_date).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-400 text-center py-4">
                    No upcoming events
                  </div>
                )}
                <Link to="/student/events">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Events
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="glass-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/student/jobs">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Browse Jobs
                  </Button>
                </Link>
                <Link to="/student/career-paths">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Target className="mr-2 h-4 w-4" />
                    Career Paths
                  </Button>
                </Link>
                <Link to="/student/skills-recommendations">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Skills Recommendations
                  </Button>
                </Link>
                <Link to="/student/leaderboard">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Trophy className="mr-2 h-4 w-4" />
                    Leaderboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
