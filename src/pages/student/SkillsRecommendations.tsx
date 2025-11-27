import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import { 
  BookOpen, 
  Target,
  Sparkles,
  ExternalLink,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Code
} from "lucide-react";
import { toast } from "sonner";

export default function SkillsRecommendations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [targetRole, setTargetRole] = useState(searchParams.get("role") || "");

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

  // Fetch skills recommendations
  const { data: skillsData, isLoading, refetch } = useQuery({
    queryKey: ["skills-recommendations", user?.id, targetRole],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("skills_recommendations")
        .select("*")
        .eq("user_id", user.id)
        .eq("target_role", targetRole || "")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user && !!targetRole
  });

  // Fetch user profile to get default target role
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

  // Set default target role from profile
  useEffect(() => {
    if (!targetRole && profile?.target_roles && profile.target_roles.length > 0) {
      setTargetRole(profile.target_roles[0]);
    }
  }, [profile, targetRole]);

  // Generate skills recommendations mutation
  const generateSkillsMutation = useMutation({
    mutationFn: async (role: string) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase.functions.invoke("recommend-skills", {
        body: {
          user_id: user.id,
          target_role: role
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      toast.success("Skills recommendations generated!");
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["skills-recommendations", user?.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate skills recommendations");
    }
  });

  const handleGenerate = () => {
    if (!targetRole.trim()) {
      toast.error("Please enter a target role");
      return;
    }
    generateSkillsMutation.mutate(targetRole.trim());
  };

  if (isLoading || generateSkillsMutation.isPending) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="space-y-6 p-6">
          <Card className="glass-hover">
            <CardContent className="pt-6 text-center py-12">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
              <h3 className="text-xl font-semibold mb-2">
                {generateSkillsMutation.isPending ? "Generating Recommendations..." : "Loading..."}
              </h3>
              <p className="text-gray-400">
                Analyzing your profile to recommend the best skills to learn
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const recommendations = skillsData?.recommended_skills || [];
  const skillGaps = skillsData?.skill_gaps || [];
  const learningResources = skillsData?.learning_resources || [];
  const prioritySkills = skillsData?.priority_skills || [];
  const roadmap = skillsData?.learning_roadmap || {};

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Skills Recommendations</h1>
          <p className="text-gray-400">Personalized skill recommendations for your career goals</p>
        </motion.div>

        {/* Target Role Input */}
        <Card className="glass-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Target Role
            </CardTitle>
            <CardDescription>Enter the role you want to prepare for</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Software Engineer, Data Scientist, Product Manager"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleGenerate();
                  }
                }}
              />
              <Button
                className="gradient-primary"
                onClick={handleGenerate}
                disabled={generateSkillsMutation.isPending || !targetRole.trim()}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate
              </Button>
            </div>
            {profile?.target_roles && profile.target_roles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Or select from your profile:</p>
                <div className="flex flex-wrap gap-2">
                  {profile.target_roles.map((role: string, idx: number) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/20"
                      onClick={() => {
                        setTargetRole(role);
                        generateSkillsMutation.mutate(role);
                      }}
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {!skillsData && targetRole && (
          <Card className="glass-hover">
            <CardContent className="pt-6 text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">No Recommendations Yet</h3>
              <p className="text-gray-400 mb-6">
                Generate personalized skill recommendations for {targetRole}
              </p>
              <Button
                className="gradient-primary"
                onClick={handleGenerate}
                disabled={generateSkillsMutation.isPending}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Recommendations
              </Button>
            </CardContent>
          </Card>
        )}

        {skillsData && (
          <>
            {/* Priority Skills */}
            {prioritySkills && prioritySkills.length > 0 && (
              <Card className="glass-hover border-2 border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Priority Skills
                  </CardTitle>
                  <CardDescription>Focus on these skills first</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {prioritySkills.map((skill: string, idx: number) => (
                      <Badge key={idx} className="bg-primary/20 text-primary text-base px-4 py-2">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommended Skills */}
            {recommendations.length > 0 && (
              <Card className="glass-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Recommended Skills
                  </CardTitle>
                  <CardDescription>Skills to learn for {targetRole}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recommendations.map((skill: any, idx: number) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card className="glass">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">{skill.skill}</h4>
                                  <Badge variant="outline">{skill.category}</Badge>
                                  <Badge 
                                    variant="outline"
                                    className={
                                      skill.priority === "high" ? "bg-red-500/20 text-red-500" :
                                      skill.priority === "medium" ? "bg-yellow-500/20 text-yellow-500" :
                                      "bg-blue-500/20 text-blue-500"
                                    }
                                  >
                                    {skill.priority || "low"} priority
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-400 mb-2">{skill.description}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {skill.learning_time || "2-4 weeks"}
                                  </span>
                                  <span>
                                    {skill.current_level || "Beginner"} → {skill.target_level || "Intermediate"}
                                  </span>
                                  <span>Importance: {skill.importance || 0}%</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Skill Gaps */}
            {skillGaps.length > 0 && (
              <Card className="glass-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    Skill Gaps
                  </CardTitle>
                  <CardDescription>Critical skills you need to develop</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {skillGaps.map((gap: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg glass">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{gap.skill}</h4>
                          <Badge
                            variant="outline"
                            className={
                              gap.gap_severity === "critical" ? "bg-red-500/20 text-red-500" :
                              gap.gap_severity === "high" ? "bg-orange-500/20 text-orange-500" :
                              "bg-yellow-500/20 text-yellow-500"
                            }
                          >
                            {gap.gap_severity || "medium"} gap
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400">{gap.impact}</p>
                        {gap.urgency && (
                          <p className="text-xs text-gray-500 mt-1">Urgency: {gap.urgency}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Learning Resources */}
            {learningResources.length > 0 && (
              <Card className="glass-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" />
                    Learning Resources
                  </CardTitle>
                  <CardDescription>Recommended courses, tutorials, and projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {learningResources.map((resource: any, idx: number) => (
                      <div key={idx}>
                        <h4 className="font-semibold mb-3">{resource.skill}</h4>
                        <div className="grid md:grid-cols-2 gap-3">
                          {resource.resources?.map((res: any, resIdx: number) => (
                            <Card key={resIdx} className="glass">
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-sm">{res.title}</h5>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {res.provider} • {res.duration}
                                    </p>
                                    <div className="flex gap-2 mt-2">
                                      <Badge variant="outline" className="text-xs">
                                        {res.type}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {res.level || "Beginner"}
                                      </Badge>
                                      {res.cost === "free" && (
                                        <Badge variant="outline" className="text-xs text-green-500">
                                          Free
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  {res.url && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => window.open(res.url, "_blank")}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Learning Roadmap */}
            {roadmap && Object.keys(roadmap).length > 0 && (
              <Card className="glass-hover">
                <CardHeader>
                  <CardTitle>Learning Roadmap</CardTitle>
                  <CardDescription>Structured learning path for {targetRole}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.entries(roadmap).map(([phase, data]: [string, any], idx: number) => (
                      <div key={idx} className="border-l-2 border-primary/50 pl-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-primary">{phase.replace("_", " ").toUpperCase()}</Badge>
                          <span className="text-sm text-gray-400">{data.duration}</span>
                        </div>
                        <h4 className="font-semibold mb-2">{data.focus}</h4>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {data.skills?.map((skill: string, skillIdx: number) => (
                            <Badge key={skillIdx} variant="outline">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

