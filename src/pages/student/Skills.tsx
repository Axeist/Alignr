import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Target, 
  BookOpen,
  Code,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  Play
} from "lucide-react";
import { toast } from "sonner";

export default function SkillPath() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  // Fetch skill paths
  const { data: skillPath } = useQuery({
    queryKey: ["skill-path", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("skill_paths")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user
  });

  // Generate skill path mutation
  const generatePathMutation = useMutation({
    mutationFn: async (targetRole: string) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase.functions.invoke("generate-skill-path", {
        body: {
          user_id: user.id,
          target_role: targetRole,
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Skill path generated successfully!");
      queryClient.invalidateQueries({ queryKey: ["skill-path", user?.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate skill path");
    }
  });

  const milestones = skillPath?.milestones || [];
  const progress = skillPath?.progress_percentage || 0;

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Skill Development Path</h1>
          <p className="text-gray-400">Personalized learning path to your target role</p>
        </motion.div>

        {!skillPath ? (
          <Card className="glass-hover">
            <CardContent className="pt-6 text-center py-12">
              <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">No Skill Path Yet</h3>
              <p className="text-gray-400 mb-6">
                Generate a personalized learning path based on your target role
              </p>
              <Button
                onClick={() => {
                  const targetRole = prompt("Enter your target role (e.g., Software Engineer):");
                  if (targetRole) {
                    generatePathMutation.mutate(targetRole);
                  }
                }}
                className="gradient-primary"
                disabled={generatePathMutation.isPending}
              >
                {generatePathMutation.isPending ? "Generating..." : "Generate Skill Path"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Progress Overview */}
            <Card className="glass-hover">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      {skillPath.target_role}
                    </CardTitle>
                    <CardDescription>Your personalized learning path</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-lg">
                    {progress}% Complete
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="h-3 mb-4" />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{milestones.length}</div>
                    <div className="text-sm text-gray-400">Milestones</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-secondary">
                      {milestones.filter((m: any) => m.completed).length}
                    </div>
                    <div className="text-sm text-gray-400">Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent">
                      {skillPath.recommended_courses?.length || 0}
                    </div>
                    <div className="text-sm text-gray-400">Courses</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Learning Path Timeline */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Learning Path</h2>
              <div className="space-y-4">
                {milestones.map((milestone: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="glass-hover">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              milestone.completed 
                                ? "bg-green-500/20 text-green-500" 
                                : "bg-primary/20 text-primary"
                            }`}>
                              {milestone.completed ? (
                                <CheckCircle2 className="h-6 w-6" />
                              ) : (
                                <span className="font-bold">{idx + 1}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <CardTitle>{milestone.title || `Milestone ${idx + 1}`}</CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1">
                                <Clock className="h-3 w-3" />
                                {milestone.time_estimate || "2-4 weeks"}
                              </CardDescription>
                            </div>
                          </div>
                          {milestone.completed && (
                            <Badge className="bg-green-500/20 text-green-500">
                              Completed
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Skills to Learn */}
                        {milestone.skills && milestone.skills.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <Code className="h-4 w-4" />
                              Skills to Learn
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {milestone.skills.map((skill: string, skillIdx: number) => (
                                <Badge key={skillIdx} variant="outline">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommended Courses */}
                        {milestone.courses && milestone.courses.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              Recommended Courses
                            </h4>
                            <div className="grid md:grid-cols-2 gap-3">
                              {milestone.courses.map((course: any, courseIdx: number) => (
                                <Card key={courseIdx} className="glass">
                                  <CardContent className="pt-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h5 className="font-semibold text-sm">{course.title}</h5>
                                        <p className="text-xs text-gray-400 mt-1">
                                          {course.provider} • {course.duration}
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                          <Badge variant="outline" className="text-xs">
                                            {course.level || "Beginner"}
                                          </Badge>
                                          {course.free && (
                                            <Badge variant="outline" className="text-xs text-green-500">
                                              Free
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => window.open(course.url, "_blank")}
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Project Ideas */}
                        {milestone.projects && milestone.projects.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <Code className="h-4 w-4" />
                              Project Ideas
                            </h4>
                            <div className="space-y-2">
                              {milestone.projects.map((project: any, projectIdx: number) => (
                                <Card key={projectIdx} className="glass">
                                  <CardContent className="pt-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h5 className="font-semibold text-sm">{project.title}</h5>
                                        <p className="text-xs text-gray-400 mt-1">
                                          {project.description}
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          {project.tech_stack?.map((tech: string, techIdx: number) => (
                                            <Badge key={techIdx} variant="outline" className="text-xs">
                                              {tech}
                                            </Badge>
                                          ))}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">
                                          Estimated: {project.hours || "10-20"} hours
                                        </p>
                                      </div>
                                      <Button size="sm" variant="outline">
                                        <Play className="h-4 w-4 mr-2" />
                                        Start
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Mark Complete Button */}
                        {!milestone.completed && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={async () => {
                              // Update milestone as completed
                              toast.success("Milestone marked as complete!");
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark Complete
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Final Capstone Project */}
            {skillPath.final_project && (
              <Card className="glass-hover border-2 border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Final Capstone Project
                  </CardTitle>
                  <CardDescription>
                    Comprehensive project showcasing all learned skills
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">{skillPath.final_project.title}</h4>
                      <p className="text-sm text-gray-300">{skillPath.final_project.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skillPath.final_project.skills?.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <Button className="gradient-primary w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Build This Project
                    </Button>
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
