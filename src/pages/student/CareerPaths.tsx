import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Target, 
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Briefcase
} from "lucide-react";
import { toast } from "sonner";

export default function CareerPaths() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedPath, setSelectedPath] = useState<any>(null);

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

  // Fetch career path suggestions
  const { data: careerPaths, isLoading, refetch } = useQuery({
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

  // Generate career path suggestions mutation
  const generatePathsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase.functions.invoke("suggest-career-paths", {
        body: { user_id: user.id }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      toast.success("Career paths generated successfully!");
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["career-paths", user?.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate career paths");
    }
  });

  const paths = careerPaths?.suggested_paths || [];
  const topMatches = careerPaths?.top_matches || {};

  if (isLoading || generatePathsMutation.isPending) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="space-y-6 p-6">
          <Card className="glass-hover">
            <CardContent className="pt-6 text-center py-12">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
              <h3 className="text-xl font-semibold mb-2">
                {generatePathsMutation.isPending ? "Generating Career Paths..." : "Loading..."}
              </h3>
              <p className="text-gray-400">
                Analyzing your profile to suggest the best career paths for you
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!careerPaths || paths.length === 0) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="space-y-6 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold mb-2">Career Path Suggestions</h1>
            <p className="text-gray-400">Discover personalized career paths based on your profile</p>
          </motion.div>

          <Card className="glass-hover">
            <CardContent className="pt-6 text-center py-12">
              <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">No Career Paths Yet</h3>
              <p className="text-gray-400 mb-6">
                Generate personalized career path suggestions based on your profile, resume, and quiz results
              </p>
              <Button
                className="gradient-primary"
                onClick={() => generatePathsMutation.mutate()}
                disabled={generatePathsMutation.isPending}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {generatePathsMutation.isPending ? "Generating..." : "Generate Career Paths"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

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
              <h1 className="text-4xl font-bold mb-2">Career Path Suggestions</h1>
              <p className="text-gray-400">Personalized career paths based on your profile</p>
            </div>
            <Button
              variant="outline"
              onClick={() => generatePathsMutation.mutate()}
              disabled={generatePathsMutation.isPending}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
          </div>
        </motion.div>

        {/* Top Matches Summary */}
        {topMatches && (topMatches.primary || topMatches.secondary) && (
          <Card className="glass-hover border-2 border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Top Matches
              </CardTitle>
              <CardDescription>Your best career path matches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {topMatches.primary && (
                  <div className="p-4 rounded-lg glass">
                    <Badge className="mb-2 bg-primary">Primary Match</Badge>
                    <h4 className="font-semibold">{topMatches.primary}</h4>
                  </div>
                )}
                {topMatches.secondary && (
                  <div className="p-4 rounded-lg glass">
                    <Badge className="mb-2 bg-secondary">Secondary Match</Badge>
                    <h4 className="font-semibold">{topMatches.secondary}</h4>
                  </div>
                )}
                {topMatches.exploratory && (
                  <div className="p-4 rounded-lg glass">
                    <Badge className="mb-2 bg-accent">Exploratory</Badge>
                    <h4 className="font-semibold">{topMatches.exploratory}</h4>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Career Paths List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">All Suggested Paths</h2>
          {paths.map((path: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card 
                className={`glass-hover cursor-pointer transition-all ${
                  selectedPath?.career_path === path.career_path ? "border-2 border-primary" : ""
                }`}
                onClick={() => setSelectedPath(selectedPath?.career_path === path.career_path ? null : path)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        {path.career_path}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {path.description}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className="text-lg">
                        {path.match_percentage}% Match
                      </Badge>
                      <Progress value={path.match_percentage} className="w-24 h-2" />
                    </div>
                  </div>
                </CardHeader>
                {selectedPath?.career_path === path.career_path && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Growth Potential
                        </h4>
                        <Badge variant="outline">
                          {path.growth_potential || "Medium"}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Salary Range</h4>
                        <p className="text-sm text-gray-400">{path.salary_range || "Varies"}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Education Requirements</h4>
                        <p className="text-sm text-gray-400">{path.education_requirements || "Varies"}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Why This Matches</h4>
                        <p className="text-sm text-gray-400">{path.why_match || "Based on your profile"}</p>
                      </div>
                    </div>

                    {path.required_skills && path.required_skills.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Required Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {path.required_skills.map((skill: string, skillIdx: number) => (
                            <Badge key={skillIdx} variant="outline">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {path.next_steps && path.next_steps.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Next Steps</h4>
                        <ul className="space-y-2">
                          {path.next_steps.map((step: string, stepIdx: number) => (
                            <li key={stepIdx} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button
                      className="w-full gradient-primary"
                      onClick={() => {
                        navigate(`/student/skills-recommendations?role=${encodeURIComponent(path.career_path)}`);
                      }}
                    >
                      Get Skills Recommendations
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Analysis Summary */}
        {careerPaths.analysis_data?.analysis_summary && (
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle>Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">{careerPaths.analysis_data.analysis_summary}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

