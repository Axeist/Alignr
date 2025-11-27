import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  FileText, 
  Download, 
  Share2, 
  Sparkles,
  TrendingUp,
  Target,
  Award,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";

export default function CareerReport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

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

  const { data: resume, refetch: refetchResume } = useQuery({
    queryKey: ["resume-primary", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // First try to get primary resume
      const { data: primaryData, error: primaryError } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_primary", true)
        .maybeSingle();
      
      if (primaryData) {
        return primaryData;
      }
      
      // If no primary resume, get the most recent one
      if (primaryError && primaryError.code === "PGRST116") {
        const { data: allResumes, error: allError } = await supabase
          .from("resumes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);
        
        if (allError) {
          console.error("Error fetching resumes:", allError);
          return null;
        }
        
        return allResumes?.[0] || null;
      }
      
      if (primaryError) {
        console.error("Error fetching primary resume:", primaryError);
        return null;
      }
      
      return null;
    },
    enabled: !!user,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  const { data: linkedin } = useQuery({
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

  // Refetch resume data when component mounts
  useEffect(() => {
    if (user) {
      refetchResume();
    }
  }, [user?.id, refetchResume]);

  // Automatically recalculate career score when resume has ATS score
  useEffect(() => {
    const recalculateCareerScore = async () => {
      if (!user) return;
      
      // Type assertion for resume - the ats_score exists at runtime even if types don't reflect it
      const resumeWithScore = resume as any;
      if (!resumeWithScore?.ats_score) return;
      
      // Only recalculate if resume has an ATS score but career score might be outdated
      // This ensures the career score reflects the current resume score
      try {
        await supabase.functions.invoke("calculate-career-score", {
          body: { user_id: user.id }
        });
        // Refresh profile and resume to get updated scores
        queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
        await refetchResume();
      } catch (e) {
        console.warn("Failed to recalculate career score:", e);
      }
    };

    recalculateCareerScore();
  }, [user?.id, resume, queryClient, refetchResume]);

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      setGenerating(true);

      // First, calculate/update career score
      try {
        await supabase.functions.invoke("calculate-career-score", {
          body: { user_id: user.id }
        });
      } catch (e) {
        console.warn("Failed to calculate career score:", e);
        // Continue anyway - not critical
      }

      // Call Supabase Edge Function to generate report
      const { data, error } = await supabase.functions.invoke("generate-career-report", {
        body: { user_id: user.id }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      setReportUrl(data.report_url);
      toast.success("Career report generated successfully!");
      setGenerating(false);
      // Refresh profile and resume to get updated scores
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      await refetchResume();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate report");
      setGenerating(false);
    }
  });

  const reportSections = [
    { title: "Career Summary & Goals", icon: FileText, completed: true },
    { title: "Profile Scores", icon: TrendingUp, completed: true },
    { title: "Recommended Roles", icon: Target, completed: true },
    { title: "Skills Gap Analysis", icon: Award, completed: true },
    { title: "Learning Resources", icon: Sparkles, completed: true },
    { title: "30/60/90-Day Action Plan", icon: CheckCircle2, completed: true }
  ];

  // Function to download report as PDF
  const downloadReportAsPDF = async () => {
    if (!reportUrl) return;
    
    try {
      toast.loading("Converting report to PDF...", { id: "pdf-conversion" });
      
      // Fetch the HTML content
      const response = await fetch(reportUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch report");
      }
      const htmlContent = await response.text();
      
      // Create a temporary iframe to render the HTML properly
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.left = "-9999px";
      iframe.style.width = "210mm"; // A4 width
      iframe.style.height = "297mm"; // A4 height
      document.body.appendChild(iframe);
      
      // Write HTML to iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error("Failed to access iframe document");
      }
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
      
      // Wait for content to load
      await new Promise((resolve) => {
        if (iframe.contentWindow) {
          iframe.contentWindow.onload = resolve;
          setTimeout(resolve, 1000); // Fallback timeout
        } else {
          resolve(undefined);
        }
      });
      
      // Get the body element from iframe
      const element = iframeDoc.body;
      
      // Configure PDF options
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `career-report-${user?.id}-${Date.now()}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: 800
        },
        jsPDF: { 
          unit: "mm" as const, 
          format: "a4" as const, 
          orientation: "portrait" as const
        }
      };
      
      // Convert to PDF and download
      await (html2pdf as any)().set(opt).from(element).save();
      
      // Clean up
      document.body.removeChild(iframe);
      
      toast.success("PDF downloaded successfully!", { id: "pdf-conversion" });
    } catch (error: any) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF. Opening HTML instead...", { id: "pdf-conversion" });
      // Fallback to opening HTML
      window.open(reportUrl, "_blank");
    }
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Career Report</h1>
          <p className="text-gray-400">Generate a comprehensive career analysis report</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Report Preview */}
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Report Preview
              </CardTitle>
              <CardDescription>Live preview of your career report structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reportSections.map((section, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg glass"
                >
                  <section.icon className="h-5 w-5 text-primary" />
                  <span className="flex-1 text-sm">{section.title}</span>
                  {section.completed && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Report Controls */}
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle>Generate Report</CardTitle>
              <CardDescription>Create your personalized career report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {generating ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                    <p className="text-lg font-semibold mb-2">Generating Report...</p>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-400">Analyzing Profile...</div>
                      <Progress value={33} className="h-2" />
                      <div className="text-sm text-gray-400">Generating Insights...</div>
                      <Progress value={66} className="h-2" />
                      <div className="text-sm text-gray-400">Creating Report...</div>
                      <Progress value={100} className="h-2" />
                    </div>
                  </div>
                </div>
              ) : reportUrl ? (
                <div className="space-y-4">
                  <div className="text-center p-6 rounded-lg glass">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="text-lg font-semibold mb-2">Report Ready!</p>
                    <p className="text-sm text-gray-400 mb-4">
                      Your career report has been generated successfully.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      className="w-full gradient-primary glow-primary"
                      onClick={downloadReportAsPDF}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        navigator.clipboard.writeText(reportUrl);
                        toast.success("Report link copied!");
                      }}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share with Counselor
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setReportUrl(null);
                        generateReportMutation.mutate();
                      }}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Regenerate Report
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg glass">
                    <p className="text-sm text-gray-300 mb-4">
                      Generate a comprehensive career report that includes:
                    </p>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        Career summary and goals
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        Profile scores (Resume, LinkedIn, Career Score)
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        Recommended roles with match percentages
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        Skills gap analysis
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        Learning resources and courses
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        30/60/90-day action plan
                      </li>
                    </ul>
                  </div>
                  <Button
                    className="w-full gradient-primary glow-primary"
                    onClick={() => generateReportMutation.mutate()}
                    disabled={generateReportMutation.isPending}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Report Stats */}
        {profile && (
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="glass-hover">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {profile.career_score || 0}
                  </div>
                  <div className="text-sm text-gray-400">Career Score</div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-hover">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary mb-1">
                    {(resume as any)?.ats_score ?? 0}
                  </div>
                  <div className="text-sm text-gray-400">Resume Score</div>
                  {resume && !(resume as any)?.ats_score && (
                    <div className="text-xs text-yellow-500 mt-1">
                      Resume not analyzed yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="glass-hover">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent mb-1">
                    {linkedin?.completeness_score || 0}
                  </div>
                  <div className="text-sm text-gray-400">LinkedIn Score</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

