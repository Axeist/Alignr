import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

// Career Orb Component
const CareerOrb = ({ score }: { score: number }) => {
  const [hovered, setHovered] = useState(false);
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (score / 100) * circumference;
  
  const getColor = () => {
    if (score < 50) return "#EF4444"; // red
    if (score < 76) return "#F59E0B"; // yellow
    return "#10B981"; // green
  };

  const subScores = [
    { label: "Resume", value: 85 },
    { label: "LinkedIn", value: 70 },
    { label: "Skills Match", value: 65 },
    { label: "Activity", value: 80 }
  ];

  return (
    <motion.div
      className="relative"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <div className="relative w-64 h-64 mx-auto">
        <svg className="transform -rotate-90 w-64 h-64">
          <circle
            cx="128"
            cy="128"
            r="70"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="12"
            fill="none"
          />
          <motion.circle
            cx="128"
            cy="128"
            r="70"
            stroke={getColor()}
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="text-5xl font-bold"
              style={{ color: getColor() }}
            >
              {score}
            </motion.div>
            <div className="text-sm text-gray-400 mt-1">Career Score</div>
          </div>
        </div>
      </div>
      
      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 glass rounded-lg p-4 min-w-[200px] z-10"
        >
          <div className="space-y-2">
            {subScores.map((sub, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{sub.label}</span>
                <span className="font-semibold" style={{ color: getColor() }}>
                  {sub.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Skill Gap Radar Chart
const SkillGapRadar = () => {
  const data = [
    { skill: "Technical", current: 70, target: 90 },
    { skill: "Tools", current: 60, target: 85 },
    { skill: "Soft Skills", current: 75, target: 80 },
    { skill: "Languages", current: 65, target: 75 },
    { skill: "Certifications", current: 50, target: 70 }
  ];

  return (
    <Card className="glass-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Skill Gap Analysis
        </CardTitle>
        <CardDescription>Current skills vs target role requirements</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="skill" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar
              name="Current"
              dataKey="current"
              stroke="#6366F1"
              fill="#6366F1"
              fillOpacity={0.6}
            />
            <Radar
              name="Target"
              dataKey="target"
              stroke="#06B6D4"
              fill="#06B6D4"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Next Best Actions Component
const NextActions = () => {
  const actions = [
    {
      id: 1,
      title: "Add 2 quantified achievements to your latest role",
      completed: false,
      priority: "high"
    },
    {
      id: 2,
      title: "Complete LinkedIn About section",
      completed: false,
      priority: "medium"
    },
    {
      id: 3,
      title: "Apply to 3 matching jobs this week",
      completed: false,
      priority: "high"
    },
    {
      id: 4,
      title: "Complete Python certification course",
      completed: true,
      priority: "medium"
    }
  ];

  return (
    <Card className="glass-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Next Best Actions
        </CardTitle>
        <CardDescription>Priority tasks to improve your profile</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, idx) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`flex items-center gap-3 p-3 rounded-lg glass ${
              action.completed ? "opacity-60" : ""
            }`}
          >
            <div className="flex-shrink-0">
              {action.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className={`text-sm ${action.completed ? "line-through" : ""}`}>
                {action.title}
              </div>
            </div>
            {!action.completed && (
              <Badge variant={action.priority === "high" ? "destructive" : "secondary"}>
                {action.priority}
              </Badge>
            )}
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};

// XP & Level Display
const XPDisplay = ({ xp, level }: { xp: number; level: string }) => {
  const xpForNextLevel = 1000;
  const currentLevelXP = xp % xpForNextLevel;
  const progress = (currentLevelXP / xpForNextLevel) * 100;

  return (
    <Card className="glass-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          XP & Level
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-300">Level {level}</span>
            <span className="text-primary">{currentLevelXP} / {xpForNextLevel} XP</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="text-sm text-gray-400">
          {xpForNextLevel - currentLevelXP} XP needed for next level
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge className="bg-primary/20 text-primary">Resume Master</Badge>
          <Badge className="bg-secondary/20 text-secondary">Job Seeker</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [careerScore, setCareerScore] = useState(72);
  const [xp, setXp] = useState(750);
  const [level, setLevel] = useState("Explorer");

  const navItems = [
    { label: "Dashboard", href: "/student/dashboard" },
    { label: "Profile", href: "/student/profile" },
    { label: "Resume", href: "/student/resume" },
    { label: "LinkedIn", href: "/student/linkedin" },
    { label: "Job Board", href: "/student/jobs" },
    { label: "My Applications", href: "/student/applications" },
    { label: "Skill Path", href: "/student/skills" },
    { label: "Career Report", href: "/student/career-report" },
    { label: "Events", href: "/student/events" },
    { label: "Leaderboard", href: "/student/leaderboard" },
  ];

  // Fetch user profile data
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

  // Fetch recent applications
  const { data: applications } = useQuery({
    queryKey: ["applications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("applications")
        .select("*, jobs(*)")
        .eq("user_id", user.id)
        .order("applied_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch upcoming events
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

  useEffect(() => {
    if (profile) {
      setCareerScore(profile.career_score || 0);
      setXp(profile.xp_points || 0);
      setLevel(profile.level || "Beginner");
    }
  }, [profile]);

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-400">Welcome back! Here's your career overview.</p>
        </motion.div>

        {/* Career Orb Section */}
        <div className="flex justify-center mb-8">
          <CareerOrb score={careerScore} />
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Skill Gap Radar */}
          <SkillGapRadar />

          {/* Next Best Actions */}
          <NextActions />
        </div>

        {/* Bottom Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* XP & Level */}
          <XPDisplay xp={xp} level={level} />

          {/* College Events */}
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
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(event.event_date).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-400">No upcoming events</div>
              )}
              <Link to="/student/events">
                <Button variant="outline" size="sm" className="w-full">
                  View All Events
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Applications */}
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Recent Applications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {applications && applications.length > 0 ? (
                applications.map((app: any) => (
                  <div key={app.id} className="p-3 rounded-lg glass">
                    <div className="font-semibold text-sm">{app.jobs?.title || "Job"}</div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        {app.status}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(app.applied_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-400">No applications yet</div>
              )}
              <Link to="/student/applications">
                <Button variant="outline" size="sm" className="w-full">
                  View All Applications
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard Preview */}
        <Card className="glass-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  College Leaderboard
                </CardTitle>
                <CardDescription>Top performers in your college</CardDescription>
              </div>
              <Link to="/student/leaderboard">
                <Button variant="ghost" size="sm">
                  View Full <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((rank) => (
                <div key={rank} className="flex items-center justify-between p-2 rounded-lg glass">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                      {rank}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Student {rank}</div>
                      <div className="text-xs text-gray-400">Computer Science</div>
                    </div>
                  </div>
                  <Badge className="bg-primary/20 text-primary">Score: {95 - rank * 2}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
