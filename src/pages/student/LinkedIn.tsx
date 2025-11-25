import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Linkedin, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Sparkles,
  TrendingUp,
  Target,
  Award
} from "lucide-react";
import { toast } from "sonner";

export default function LinkedInAnalysis() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inputMethod, setInputMethod] = useState<"url" | "text">("url");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [profileText, setProfileText] = useState("");

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

  // Fetch existing LinkedIn profile
  const { data: linkedinProfile } = useQuery({
    queryKey: ["linkedin-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("linkedin_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user
  });

  // Analyze LinkedIn profile mutation
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const payload = inputMethod === "url" 
        ? { linkedin_url: linkedinUrl, user_id: user.id }
        : { profile_text: profileText, user_id: user.id };

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke("analyze-linkedin", {
        body: payload
      });

      // Check if response contains an error (even if error object is null)
      if (data?.error) {
        const customError = new Error(data.error);
        (customError as any).code = data.code;
        (customError as any).details = data.details;
        throw customError;
      }

      if (error) {
        // Try to extract error details from error object
        let errorData = {};
        try {
          // Error might have context or message with JSON
          if (error.context?.body) {
            errorData = error.context.body;
          } else if (error.message) {
            // Try to parse error message as JSON
            const jsonMatch = error.message.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              errorData = JSON.parse(jsonMatch[0]);
            }
          }
        } catch {
          // If parsing fails, use error as-is
        }

        if (errorData.code === "QUOTA_EXCEEDED" || errorData.code === "SERVICE_UNAVAILABLE") {
          const customError = new Error(errorData.error || error.message);
          (customError as any).code = errorData.code;
          (customError as any).details = errorData.details;
          throw customError;
        }
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      toast.success("LinkedIn profile analyzed successfully!");
      queryClient.invalidateQueries({ queryKey: ["linkedin-profile", user?.id] });
    },
    onError: (error: any) => {
      // Handle specific error types with better messages
      if (error.code === "QUOTA_EXCEEDED") {
        toast.error(
          error.details || "AI service is currently at capacity. Please try again in a few minutes.",
          { duration: 6000 }
        );
      } else if (error.code === "SERVICE_UNAVAILABLE") {
        toast.error(
          "AI service is temporarily unavailable. Please try again in a few moments.",
          { duration: 5000 }
        );
      } else {
        toast.error(error.message || "Failed to analyze profile");
      }
    }
  });

  const completenessScore = linkedinProfile?.completeness_score || 0;
  const analysis = linkedinProfile?.analysis_result || {};

  const getScoreColor = (score: number) => {
    if (score < 50) return "text-red-500";
    if (score < 75) return "text-yellow-500";
    return "text-green-500";
  };

  const sectionScores = [
    { name: "Headline", score: analysis.headline?.score || 0, feedback: analysis.headline?.feedback || "" },
    { name: "About", score: analysis.about?.score || 0, feedback: analysis.about?.feedback || "" },
    { name: "Experience", score: analysis.experience?.score || 0, feedback: analysis.experience?.feedback || "" },
    { name: "Skills", score: analysis.skills?.score || 0, feedback: analysis.skills?.feedback || "" }
  ];

  const recommendedHeadlines = analysis.recommended_headlines || [];
  const missingSkills = analysis.missing_skills || [];
  const checklist = analysis.checklist || [];

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">LinkedIn Profile Analysis</h1>
          <p className="text-gray-400">Optimize your LinkedIn profile with AI-powered insights</p>
        </motion.div>

        {/* Input Section */}
        <Card className="glass-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Linkedin className="h-5 w-5 text-primary" />
              Analyze Your Profile
            </CardTitle>
            <CardDescription>Paste your LinkedIn URL or profile text</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={inputMethod === "url" ? "default" : "outline"}
                onClick={() => setInputMethod("url")}
                className="flex-1"
              >
                LinkedIn URL
              </Button>
              <Button
                variant={inputMethod === "text" ? "default" : "outline"}
                onClick={() => setInputMethod("text")}
                className="flex-1"
              >
                Paste Profile Text
              </Button>
            </div>

            {inputMethod === "url" ? (
              <Input
                placeholder="https://linkedin.com/in/your-profile"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="glass"
              />
            ) : (
              <Textarea
                placeholder="Paste your LinkedIn profile text here..."
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                className="glass min-h-[200px]"
              />
            )}

            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending || (inputMethod === "url" ? !linkedinUrl : !profileText)}
              className="w-full gradient-primary glow-primary"
            >
              {analyzeMutation.isPending ? (
                <>Analyzing... <Sparkles className="ml-2 h-4 w-4 animate-spin" /></>
              ) : (
                <>Analyze Profile <Sparkles className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </CardContent>
        </Card>

        {linkedinProfile && (
          <>
            {/* Completeness Score */}
            <Card className="glass-hover">
              <CardHeader>
                <CardTitle>Profile Completeness</CardTitle>
                <CardDescription>Overall LinkedIn profile score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-48 h-48">
                    <svg className="transform -rotate-90 w-48 h-48">
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="12"
                        fill="none"
                      />
                      <motion.circle
                        cx="96"
                        cy="96"
                        r="80"
                        stroke={completenessScore < 50 ? "#EF4444" : completenessScore < 75 ? "#F59E0B" : "#10B981"}
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={502}
                        strokeDashoffset={502 - (completenessScore / 100) * 502}
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: 502 }}
                        animate={{ strokeDashoffset: 502 - (completenessScore / 100) * 502 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${getScoreColor(completenessScore)}`}>
                          {completenessScore}
                        </div>
                        <div className="text-sm text-gray-400">/ 100</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section Analysis */}
            <div className="grid md:grid-cols-2 gap-6">
              {sectionScores.map((section, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="glass-hover">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{section.name}</CardTitle>
                        <Badge className={getScoreColor(section.score).replace("text-", "bg-").replace("-500", "/20")}>
                          {section.score}/100
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Progress value={section.score} className="mb-3" />
                      {section.feedback && (
                        <p className="text-sm text-gray-300">{section.feedback}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* AI Suggestions */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recommended Headlines */}
              <Card className="glass-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Recommended Headlines
                  </CardTitle>
                  <CardDescription>AI-generated headline suggestions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recommendedHeadlines.length > 0 ? (
                    recommendedHeadlines.map((headline: string, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg glass">
                        <p className="text-sm mb-2">{headline}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(headline);
                            toast.success("Headline copied!");
                          }}
                        >
                          <Copy className="h-3 w-3 mr-2" />
                          Copy
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">No recommendations yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Missing Skills */}
              <Card className="glass-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Missing Skills
                  </CardTitle>
                  <CardDescription>Skills to add based on target roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {missingSkills.length > 0 ? (
                      missingSkills.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-sm">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No missing skills identified</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* About Section Rewrite */}
            {(analysis.about?.rewrite || analysis.about_rewrite) && (
              <Card className="glass-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Optimized About Section
                  </CardTitle>
                  <CardDescription>AI-enhanced version of your About section</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg glass">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                      {analysis.about?.rewrite || analysis.about_rewrite}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const rewriteText = analysis.about?.rewrite || analysis.about_rewrite || "";
                        navigator.clipboard.writeText(rewriteText);
                        toast.success("About section copied!");
                      }}
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline">Edit</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Priority Checklist */}
            <Card className="glass-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Priority Checklist
                </CardTitle>
                <CardDescription>Ordered improvements for your profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {checklist.length > 0 ? (
                  checklist.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg glass">
                      <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>
                      <span className="text-sm flex-1">{item}</span>
                      <Button size="sm" variant="ghost">
                        Mark Complete
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No checklist items</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

