import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Sparkles,
  TrendingUp,
  Download,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  Trash2,
  X
} from "lucide-react";
import { toast } from "sonner";

export default function ResumeBuilder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedResume, setSelectedResume] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState("summary");
  const [jobDescription, setJobDescription] = useState("");
  const [comparingVersions, setComparingVersions] = useState(false);
  const [version1, setVersion1] = useState<string | null>(null);
  const [version2, setVersion2] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);

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

  // Fetch user resumes
  const { data: resumes } = useQuery({
    queryKey: ["resumes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const primaryResume = resumes?.find(r => r.is_primary) || resumes?.[0];
  const currentResume = selectedResume 
    ? resumes?.find(r => r.id === selectedResume) 
    : primaryResume;

  // Upload resume mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not authenticated");
      setUploading(true);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("resumes")
        .getPublicUrl(fileName);

      // Create resume record
      const { data, error } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          file_url: publicUrl,
          version_label: file.name.replace(/\.[^/.]+$/, ""),
        })
        .select()
        .single();

      if (error) throw error;

      // Analyze resume
      const { data: analyzeData, error: analyzeError } = await supabase.functions.invoke("analyze-resume", {
        body: { resume_url: publicUrl, user_id: user.id, resume_id: data.id }
      });

      if (analyzeError) {
        console.error("Analysis error:", analyzeError);
        // Check if it's a configuration error
        const errorMsg = analyzeError?.message || (analyzeData?.error || "");
        if (errorMsg.includes("GROQ_API_KEY")) {
          toast.error("AI analysis failed: GROQ_API_KEY not configured. Please contact support.");
        }
        // Don't throw - resume is uploaded even if analysis fails
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Resume uploaded and analyzed!");
      queryClient.invalidateQueries({ queryKey: ["resumes", user?.id] });
      setUploading(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload resume");
      setUploading(false);
    }
  });

  // Delete resume mutation
  const deleteMutation = useMutation({
    mutationFn: async (resumeId: string) => {
      if (!user) throw new Error("Not authenticated");
      
      const resume = resumes?.find(r => r.id === resumeId);
      if (!resume) throw new Error("Resume not found");

      // Extract file path from URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/resumes/[path]
      // Try multiple methods to extract the path
      let filePath: string | null = null;
      try {
        const url = new URL(resume.file_url);
        // Extract path after /resumes/
        const pathMatch = url.pathname.match(/\/resumes\/(.+)$/);
        if (pathMatch) {
          filePath = pathMatch[1];
        } else {
          // Fallback: split method
          const urlParts = resume.file_url.split('/resumes/');
          filePath = urlParts.length > 1 ? urlParts[1].split('?')[0] : null;
        }
      } catch {
        // If URL parsing fails, try simple split
        const urlParts = resume.file_url.split('/resumes/');
        filePath = urlParts.length > 1 ? urlParts[1].split('?')[0] : null;
      }

      // Delete from storage if file path exists
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from("resumes")
          .remove([filePath]);
        
        if (storageError) {
          console.error("Storage delete error:", storageError);
          // Continue with DB deletion even if storage deletion fails
        }
      }

      // Delete from database
      const { error } = await supabase
        .from("resumes")
        .delete()
        .eq("id", resumeId);

      if (error) throw error;

      // If deleted resume was primary and there are other resumes, set another as primary
      if (resume.is_primary && resumes && resumes.length > 1) {
        const otherResumes = resumes.filter(r => r.id !== resumeId);
        if (otherResumes.length > 0) {
          await supabase
            .from("resumes")
            .update({ is_primary: true })
            .eq("id", otherResumes[0].id);
        }
      }

      return resumeId;
    },
    onSuccess: () => {
      toast.success("Resume deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["resumes", user?.id] });
      setDeleteDialogOpen(false);
      setResumeToDelete(null);
      // Reset selected resume if it was deleted
      if (selectedResume === resumeToDelete) {
        setSelectedResume(null);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete resume");
    }
  });

  // Delete all resumes mutation
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      if (!user || !resumes || resumes.length === 0) throw new Error("No resumes to delete");

      // Delete all files from storage
      const filePaths = resumes
        .map(resume => {
          try {
            const url = new URL(resume.file_url);
            const pathMatch = url.pathname.match(/\/resumes\/(.+)$/);
            if (pathMatch) {
              return pathMatch[1];
            } else {
              const urlParts = resume.file_url.split('/resumes/');
              return urlParts.length > 1 ? urlParts[1].split('?')[0] : null;
            }
          } catch {
            const urlParts = resume.file_url.split('/resumes/');
            return urlParts.length > 1 ? urlParts[1].split('?')[0] : null;
          }
        })
        .filter((path): path is string => path !== null);

      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("resumes")
          .remove(filePaths);
        
        if (storageError) {
          console.error("Storage delete error:", storageError);
          // Continue with DB deletion even if storage deletion fails
        }
      }

      // Delete all from database
      const { error } = await supabase
        .from("resumes")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      return true;
    },
    onSuccess: () => {
      toast.success("All resumes deleted. You can start fresh!");
      queryClient.invalidateQueries({ queryKey: ["resumes", user?.id] });
      setDeleteAllDialogOpen(false);
      setSelectedResume(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete resumes");
    }
  });

  // AI Rewrite mutation
  const rewriteMutation = useMutation({
    mutationFn: async (originalText: string) => {
      if (!user || !currentResume) throw new Error("Missing data");
      
      const { data, error } = await supabase.functions.invoke("rewrite-bullet", {
        body: {
          original_text: originalText,
          context: currentResume.extracted_data,
          job_description: jobDescription || undefined
        }
      });

      if (error) {
        // Try to extract error message from response
        const errorMessage = error.message || (typeof error === 'string' ? error : 'Unknown error');
        throw new Error(errorMessage);
      }
      
      // Check if response has error field
      if (data && data.error) {
        throw new Error(data.error);
      }
      
      return data;
    },
    onSuccess: (data) => {
      toast.success("AI suggestions generated!");
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.error || "Failed to generate suggestions. Please check if GROQ_API_KEY is configured.";
      toast.error(errorMessage);
      console.error("Rewrite error:", error);
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf" && !file.name.endsWith(".docx")) {
        toast.error("Please upload a PDF or DOCX file");
        return;
      }
      uploadMutation.mutate(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const atsScore = currentResume?.ats_score || 0;
  const analysis = currentResume?.analysis_result || {};
  const extractedData = currentResume?.extracted_data || {};

  const getScoreColor = (score: number) => {
    if (score < 50) return "#EF4444";
    if (score < 76) return "#F59E0B";
    return "#10B981";
  };

  const scoreBreakdown = [
    { label: "Keywords", score: analysis.keywords_score || 0 },
    { label: "Formatting", score: analysis.formatting_score || 0 },
    { label: "Achievements", score: analysis.achievements_score || 0 },
    { label: "Action Verbs", score: analysis.action_verbs_score || 0 }
  ];

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Resume Analysis</h1>
          <p className="text-gray-400">Upload and optimize your resume with AI-powered insights</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Upload & Analysis */}
          <div className="space-y-6">
            {/* Resume Versions Tabs */}
            {resumes && resumes.length > 0 && (
              <Card className="glass-hover">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Resume Versions</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteAllDialogOpen(true)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete All
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={selectedResume || primaryResume?.id || ""} onValueChange={setSelectedResume}>
                    <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${resumes.length}, 1fr)` }}>
                      {resumes.map((resume) => (
                        <TabsTrigger 
                          key={resume.id} 
                          value={resume.id}
                          className="relative group"
                        >
                          <span className="flex items-center gap-2">
                            {resume.version_label}
                            {resume.is_primary && (
                              <Badge className="ml-1" variant="secondary">Primary</Badge>
                            )}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              setResumeToDelete(resume.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Upload Zone */}
            <Card className="glass-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Upload Resume
                </CardTitle>
                <CardDescription>Support PDF and DOCX formats</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-primary/50 rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors glass"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <p className="text-lg font-semibold mb-2">
                    {uploading ? "Uploading..." : "Drag & drop or click to upload"}
                  </p>
                  <p className="text-sm text-gray-400">PDF or DOCX up to 10MB</p>
                  {uploading && (
                    <Progress value={50} className="mt-4" />
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    New Version
                  </Button>
                  {resumes && resumes.length > 0 && (
                    <Button
                      variant="outline"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/50"
                      onClick={() => setDeleteAllDialogOpen(true)}
                      disabled={uploading || deleteAllMutation.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Start Fresh
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ATS Score Display */}
            {currentResume && (
              <Card className="glass-hover">
                <CardHeader>
                  <CardTitle>ATS Score</CardTitle>
                  <CardDescription>Applicant Tracking System compatibility</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center mb-6">
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
                          stroke={getScoreColor(atsScore)}
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={502}
                          strokeDashoffset={502 - (atsScore / 100) * 502}
                          strokeLinecap="round"
                          initial={{ strokeDashoffset: 502 }}
                          animate={{ strokeDashoffset: 502 - (atsScore / 100) * 502 }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl font-bold" style={{ color: getScoreColor(atsScore) }}>
                            {atsScore}
                          </div>
                          <div className="text-sm text-gray-400">/ 100</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="space-y-3">
                    {scoreBreakdown.map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">{item.label}</span>
                          <span style={{ color: getScoreColor(item.score) }}>
                            {item.score}/100
                          </span>
                        </div>
                        <Progress value={item.score} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Strengths & Gaps */}
            {currentResume && (
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="glass-hover">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-500">
                      <CheckCircle2 className="h-5 w-5" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(analysis.strengths || []).slice(0, 5).map((strength: string, idx: number) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="glass-hover">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-500">
                      <AlertCircle className="h-5 w-5" />
                      Gaps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(analysis.gaps || []).slice(0, 5).map((gap: string, idx: number) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Suggested Target Roles */}
            {currentResume && analysis.target_roles && (
              <Card className="glass-hover">
                <CardHeader>
                  <CardTitle>Suggested Target Roles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.target_roles.map((role: any, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-sm">
                        {role.name} ({role.match}% match)
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - AI Tools */}
          <div className="space-y-6">
            {/* AI Rewrite Tool */}
            <Card className="glass-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Rewrite Tool
                </CardTitle>
                <CardDescription>Optimize resume sections with AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary</SelectItem>
                    <SelectItem value="experience">Experience</SelectItem>
                    <SelectItem value="projects">Projects</SelectItem>
                    <SelectItem value="skills">Skills</SelectItem>
                  </SelectContent>
                </Select>

                <Textarea
                  placeholder="Paste job description for tailored optimization (optional)"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="glass min-h-[100px]"
                />

                <Textarea
                  placeholder="Paste the text you want to rewrite..."
                  className="glass min-h-[150px]"
                />

                <Button
                  className="w-full gradient-primary glow-primary"
                  onClick={() => {
                    const text = (document.querySelector('textarea[placeholder*="Paste the text"]') as HTMLTextAreaElement)?.value;
                    if (text) {
                      rewriteMutation.mutate(text);
                    } else {
                      toast.error("Please enter text to rewrite");
                    }
                  }}
                  disabled={rewriteMutation.isPending}
                >
                  {rewriteMutation.isPending ? (
                    <>Generating... <Sparkles className="ml-2 h-4 w-4 animate-spin" /></>
                  ) : (
                    <>Generate Suggestions <Sparkles className="ml-2 h-4 w-4" /></>
                  )}
                </Button>

                {rewriteMutation.data && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">AI Suggestions:</p>
                    {rewriteMutation.data.rewrites?.map((rewrite: string, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg glass">
                        <p className="text-sm mb-2">{rewrite}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(rewrite);
                            toast.success("Copied!");
                          }}
                        >
                          <Copy className="h-3 w-3 mr-2" />
                          Copy
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Version Comparison */}
            {resumes && resumes.length >= 2 && (
              <Card className="glass-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5 text-primary" />
                    Version Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={version1 || ""} onValueChange={setVersion1}>
                      <SelectTrigger>
                        <SelectValue placeholder="Version 1" />
                      </SelectTrigger>
                      <SelectContent>
                        {resumes.map((resume) => (
                          <SelectItem key={resume.id} value={resume.id}>
                            {resume.version_label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={version2 || ""} onValueChange={setVersion2}>
                      <SelectTrigger>
                        <SelectValue placeholder="Version 2" />
                      </SelectTrigger>
                      <SelectContent>
                        {resumes.map((resume) => (
                          <SelectItem key={resume.id} value={resume.id}>
                            {resume.version_label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {version1 && version2 && (
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-lg glass">
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: getScoreColor(resumes.find(r => r.id === version1)?.ats_score || 0) }}>
                          {resumes.find(r => r.id === version1)?.ats_score || 0}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Version 1</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: getScoreColor(resumes.find(r => r.id === version2)?.ats_score || 0) }}>
                          {resumes.find(r => r.id === version2)?.ats_score || 0}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Version 2</div>
                      </div>
                    </div>
                  )}

                  {primaryResume && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        if (!currentResume) return;
                        const { error } = await supabase
                          .from("resumes")
                          .update({ is_primary: false })
                          .neq("id", currentResume.id);
                        if (error) {
                          toast.error(error.message);
                          return;
                        }
                        const { error: updateError } = await supabase
                          .from("resumes")
                          .update({ is_primary: true })
                          .eq("id", currentResume.id);
                        if (updateError) {
                          toast.error(updateError.message);
                        } else {
                          toast.success("Set as primary resume");
                          queryClient.invalidateQueries({ queryKey: ["resumes", user?.id] });
                        }
                      }}
                    >
                      Set as Primary
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Download */}
            {currentResume && (
              <Card className="glass-hover">
                <CardContent className="pt-6">
                  <Button
                    className="w-full gradient-primary"
                    onClick={() => {
                      if (currentResume.file_url) {
                        window.open(currentResume.file_url, "_blank");
                      }
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Resume
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Delete Single Resume Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this resume? This action cannot be undone.
              {resumeToDelete && resumes?.find(r => r.id === resumeToDelete)?.is_primary && (
                <span className="block mt-2 text-amber-400">
                  This is your primary resume. Another resume will be set as primary if available.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (resumeToDelete) {
                  deleteMutation.mutate(resumeToDelete);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Resumes Dialog */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Resumes?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all {resumes?.length || 0} resume(s)? This action cannot be undone.
              You will be able to upload new resumes after deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAllMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteAllMutation.isPending}
            >
              {deleteAllMutation.isPending ? "Deleting..." : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
