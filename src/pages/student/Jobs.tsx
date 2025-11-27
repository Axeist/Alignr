import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Search, 
  MapPin, 
  Briefcase, 
  TrendingUp,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  X,
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

export default function JobBoard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  
  // External jobs state
  const [jobTypeTab, setJobTypeTab] = useState<"internal" | "external">("internal");
  const [externalSearchQuery, setExternalSearchQuery] = useState("");
  const [externalSearchLocation, setExternalSearchLocation] = useState("");
  const [externalPlatforms, setExternalPlatforms] = useState<string[]>(["linkedin", "indeed", "naukri"]);
  const [showExternalJobModal, setShowExternalJobModal] = useState(false);
  const [selectedExternalJob, setSelectedExternalJob] = useState<any>(null);
  const [externalApplicationUrl, setExternalApplicationUrl] = useState("");
  const [suggestedRoles, setSuggestedRoles] = useState<string[]>([]);

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

  // Fetch jobs with match scores
  const { data: jobsData, isLoading, error: jobsError } = useQuery({
    queryKey: ["jobs", user?.id, searchQuery, selectedRole, selectedLocation],
    queryFn: async () => {
      if (!user) return { jobs: [] };
      
      // Call Edge Function to get recommended jobs
      const { data, error } = await supabase.functions.invoke("recommend-jobs", {
        body: { 
          user_id: user.id,
          filters: {
            role: selectedRole !== "all" ? selectedRole : undefined,
            location: selectedLocation !== "all" ? selectedLocation : undefined,
          }
        }
      });

      if (error) {
        console.error("Error fetching jobs:", error);
        toast.error(error.message || "Failed to load jobs");
        throw error;
      }
      return data || { jobs: [] };
    },
    enabled: !!user,
    retry: 2,
    onError: (error: any) => {
      console.error("Jobs query error:", error);
      toast.error(error.message || "Failed to load jobs. Please try again.");
    }
  });

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

  // Fetch saved jobs
  const { data: savedJobs } = useQuery({
    queryKey: ["saved-jobs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // This would come from a saved_jobs table - for now return empty
      return [];
    },
    enabled: !!user
  });

  // Fetch external jobs
  const { data: externalJobsData, isLoading: isLoadingExternal, refetch: refetchExternal } = useQuery({
    queryKey: ["external-jobs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("external_jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("match_score", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && jobTypeTab === "external"
  });

  // Search external jobs mutation
  const searchExternalJobsMutation = useMutation({
    mutationFn: async ({ query, location, autoSuggest = false }: { query?: string; location?: string; autoSuggest?: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase.functions.invoke("search-external-jobs", {
        body: {
          user_id: user.id,
          query: query || undefined,
          location: location || undefined,
          platforms: externalPlatforms,
          limit: 15,
          auto_suggest: autoSuggest
        }
      });

      if (error) throw error;
      
      // Store suggested roles if provided
      if (data?.suggested_roles) {
        setSuggestedRoles(data.suggested_roles);
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (data?.suggested_roles) {
        toast.success(`Found ${data.jobs?.length || 0} jobs based on your profile!`);
      } else {
        toast.success("External jobs searched successfully!");
      }
      queryClient.invalidateQueries({ queryKey: ["external-jobs", user?.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to search external jobs");
    }
  });

  // Auto-load jobs when external tab is opened
  useEffect(() => {
    if (jobTypeTab === "external" && user && !externalJobsData?.length && !isLoadingExternal) {
      // Auto-load with suggestions
      searchExternalJobsMutation.mutate({ autoSuggest: true });
    }
  }, [jobTypeTab, user]);

  // Save external job mutation
  const saveExternalJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("external_jobs")
        .update({ is_saved: true })
        .eq("id", jobId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Job saved!");
      queryClient.invalidateQueries({ queryKey: ["external-jobs", user?.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save job");
    }
  });

  // Track external job application mutation
  const trackExternalApplicationMutation = useMutation({
    mutationFn: async ({ jobId, applicationUrl }: { jobId: string; applicationUrl: string }) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("external_job_applications")
        .insert({
          user_id: user.id,
          external_job_id: jobId,
          resume_id: selectedResumeId || resumes?.[0]?.id || null,
          application_url: applicationUrl,
          status: "applied"
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Application tracked successfully!");
      setShowExternalJobModal(false);
      queryClient.invalidateQueries({ queryKey: ["external-jobs", user?.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to track application");
    }
  });

  // Apply mutation
  const applyMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("applications")
        .insert({
          job_id: jobId,
          user_id: user.id,
          student_id: user.id,
          resume_id: selectedResumeId || resumes?.[0]?.id || null,
          cover_letter: coverLetter,
          status: "applied",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Application submitted successfully!");
      setShowApplicationModal(false);
      setCoverLetter("");
      queryClient.invalidateQueries({ queryKey: ["applications", user?.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit application");
    }
  });

  const jobs = jobsData?.jobs || [];
  const filteredJobs = jobs.filter((job: any) => {
    if (selectedTab === "saved") {
      return savedJobs?.includes(job.job.id);
    }
    if (selectedTab === "applied") {
      // Check if user has applied
      return false; // Would need to check applications table
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        job.job.title.toLowerCase().includes(query) ||
        job.job.company_name.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getScoreColor = (score: number) => {
    if (score < 50) return "#EF4444";
    if (score < 76) return "#F59E0B";
    return "#10B981";
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Job Board</h1>
          <p className="text-gray-400">Discover opportunities matched to your profile</p>
        </motion.div>

        {/* Job Type Tabs - Internal vs External */}
        <Tabs value={jobTypeTab} onValueChange={(v) => setJobTypeTab(v as "internal" | "external")}>
          <TabsList className="glass mb-6">
            <TabsTrigger value="internal">
              <Briefcase className="h-4 w-4 mr-2" />
              Internal Jobs
            </TabsTrigger>
            <TabsTrigger value="external">
              <Globe className="h-4 w-4 mr-2" />
              External Jobs
            </TabsTrigger>
          </TabsList>

        {/* Internal Jobs Filters */}
        <TabsContent value="internal" className="space-y-4">
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 glass"
                  />
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="glass">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="software">Software Engineer</SelectItem>
                    <SelectItem value="data">Data Scientist</SelectItem>
                    <SelectItem value="product">Product Manager</SelectItem>
                    <SelectItem value="design">Designer</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="glass">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedRole("all");
                    setSelectedLocation("all");
                  }}
                  className="glass"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Internal Jobs Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="glass">
              <TabsTrigger value="all">All Jobs</TabsTrigger>
              <TabsTrigger value="saved">Saved</TabsTrigger>
              <TabsTrigger value="applied">Applied</TabsTrigger>
            </TabsList>

          <TabsContent value={selectedTab} className="space-y-4 mt-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="mt-2 text-gray-400">Loading jobs...</p>
              </div>
            ) : jobsError ? (
              <Card className="glass-hover">
                <CardContent className="pt-6 text-center py-12">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-red-400" />
                  <p className="text-red-400 mb-2">Error loading jobs</p>
                  <p className="text-gray-400 text-sm">{jobsError.message || "Please try again later"}</p>
                </CardContent>
              </Card>
            ) : filteredJobs.length === 0 ? (
              <Card className="glass-hover">
                <CardContent className="pt-6 text-center py-12">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">No jobs found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredJobs.map((jobData: any, idx: number) => {
                  const job = jobData.job;
                  const matchScore = jobData.match_score || 0;
                  const matchedSkills = jobData.matched_skills || [];
                  const missingSkills = jobData.missing_skills || [];

                  return (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="glass-hover">
                        <CardContent className="pt-6">
                          <div className="flex flex-col md:flex-row gap-4">
                            {/* Company Logo/Info */}
                            <div className="flex-shrink-0">
                              <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center">
                                <Briefcase className="h-8 w-8 text-primary" />
                              </div>
                            </div>

                            {/* Job Details */}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-xl font-bold">{job.title}</h3>
                                  <p className="text-gray-400">{job.company_name}</p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="ml-2"
                                  style={{ borderColor: getScoreColor(matchScore) }}
                                >
                                  {job.college_id ? "Your College" : "Open"}
                                </Badge>
                              </div>

                              <div className="flex flex-wrap gap-2 text-sm text-gray-400">
                                {job.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {job.location}
                                  </span>
                                )}
                                {job.role_type && (
                                  <Badge variant="outline">{job.role_type}</Badge>
                                )}
                                {job.stipend_salary_range && (
                                  <span>{job.stipend_salary_range}</span>
                                )}
                              </div>

                              {/* Match Score */}
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-gray-300">Match Score</span>
                                    <span style={{ color: getScoreColor(matchScore) }}>
                                      {matchScore}%
                                    </span>
                                  </div>
                                  <Progress value={matchScore} className="h-2" />
                                </div>
                              </div>

                              {/* Skills */}
                              <div className="flex flex-wrap gap-2">
                                {matchedSkills.slice(0, 5).map((skill: string) => (
                                  <Badge key={skill} className="bg-green-500/20 text-green-400">
                                    {skill}
                                  </Badge>
                                ))}
                                {missingSkills.slice(0, 3).map((skill: string) => (
                                  <Badge key={skill} variant="outline" className="text-red-400">
                                    +{skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedJob(jobData);
                                  setShowApplicationModal(true);
                                  setSelectedResumeId(resumes?.[0]?.id || "");
                                }}
                                className="gradient-primary text-white"
                              >
                                Quick Apply
                              </Button>
                              <Button variant="outline" size="sm">
                                <Bookmark className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedJob(jobData);
                                }}
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
          </Tabs>
        </TabsContent>

          {/* External Jobs Search and Display */}
          <TabsContent value="external" className="space-y-4 mt-6">
          {/* External Jobs Search */}
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Personalized Job Suggestions
              </CardTitle>
              <CardDescription>
                Jobs matched to your resume and LinkedIn profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestedRoles.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Suggested roles based on your profile:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedRoles.map((role, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={() => {
                          setExternalSearchQuery(role);
                          searchExternalJobsMutation.mutate({ query: role, location: externalSearchLocation });
                        }}
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Or search specific role..."
                    value={externalSearchQuery}
                    onChange={(e) => setExternalSearchQuery(e.target.value)}
                    className="pl-10 glass"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && externalSearchQuery.trim()) {
                        searchExternalJobsMutation.mutate({
                          query: externalSearchQuery,
                          location: externalSearchLocation
                        });
                      }
                    }}
                  />
                </div>
                <Input
                  placeholder="Location (optional)"
                  value={externalSearchLocation}
                  onChange={(e) => setExternalSearchLocation(e.target.value)}
                  className="glass"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      searchExternalJobsMutation.mutate({ autoSuggest: true });
                    }}
                    disabled={searchExternalJobsMutation.isPending}
                    variant="outline"
                    className="flex-1"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    onClick={() => {
                      if (externalSearchQuery.trim()) {
                        searchExternalJobsMutation.mutate({
                          query: externalSearchQuery,
                          location: externalSearchLocation
                        });
                      } else {
                        toast.error("Please enter a search query");
                      }
                    }}
                    disabled={searchExternalJobsMutation.isPending || !externalSearchQuery.trim()}
                    className="gradient-primary flex-1"
                  >
                    {searchExternalJobsMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* External Jobs List */}
          {isLoadingExternal ? (
            <div className="text-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-2 text-gray-400">Loading external jobs...</p>
            </div>
          ) : externalJobsData && externalJobsData.length > 0 ? (
            <div className="grid gap-4">
              {externalJobsData.map((job: any, idx: number) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="glass-hover">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Globe className="h-8 w-8 text-primary" />
                          </div>
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-xl font-bold">{job.title}</h3>
                              <p className="text-gray-400">{job.company_name}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="capitalize">
                                {job.source_platform}
                              </Badge>
                              {job.is_saved && (
                                <Badge variant="secondary">
                                  <BookmarkCheck className="h-3 w-3 mr-1" />
                                  Saved
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 text-sm text-gray-400">
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {job.location}
                              </span>
                            )}
                            {job.job_type && (
                              <Badge variant="outline">{job.job_type}</Badge>
                            )}
                            {job.salary_range && (
                              <span>{job.salary_range}</span>
                            )}
                          </div>

                          {job.match_score > 0 && (
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="text-gray-300">Match Score</span>
                                  <span style={{ color: getScoreColor(job.match_score) }}>
                                    {job.match_score}%
                                  </span>
                                </div>
                                <Progress value={job.match_score} className="h-2" />
                              </div>
                            </div>
                          )}

                          {job.skills_required && job.skills_required.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {job.skills_required.slice(0, 5).map((skill: string) => (
                                <Badge key={skill} variant="outline" className="text-sm">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.open(job.external_url, "_blank");
                            }}
                            className="gradient-primary text-white"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Apply
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (job.is_saved) {
                                supabase
                                  .from("external_jobs")
                                  .update({ is_saved: false })
                                  .eq("id", job.id)
                                  .then(() => {
                                    toast.success("Job unsaved");
                                    queryClient.invalidateQueries({ queryKey: ["external-jobs", user?.id] });
                                  });
                              } else {
                                saveExternalJobMutation.mutate(job.id);
                              }
                            }}
                          >
                            {job.is_saved ? (
                              <>
                                <BookmarkCheck className="h-4 w-4 mr-2" />
                                Saved
                              </>
                            ) : (
                              <>
                                <Bookmark className="h-4 w-4 mr-2" />
                                Save
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedExternalJob(job);
                              setExternalApplicationUrl(job.external_url);
                              setShowExternalJobModal(true);
                              setSelectedResumeId(resumes?.[0]?.id || "");
                            }}
                          >
                            Track Application
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="glass-hover">
              <CardContent className="pt-6 text-center py-12">
                <Globe className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400 mb-4">No external jobs found</p>
                <p className="text-sm text-gray-500">
                  Search for jobs using the search bar above to find opportunities on LinkedIn, Indeed, Naukri, and more.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        </Tabs>

        {/* Application Modal */}
        <Dialog open={showApplicationModal} onOpenChange={setShowApplicationModal}>
          <DialogContent className="glass max-w-2xl">
            <DialogHeader>
              <DialogTitle>Apply for {selectedJob?.job?.title}</DialogTitle>
              <DialogDescription>
                Submit your application for this position
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Resume</label>
                <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes?.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id}>
                        {resume.version_label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Cover Letter (Optional)</label>
                <Textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell us why you're a great fit..."
                  className="min-h-[150px] glass"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={async () => {
                    // Generate AI pitch
                    toast.info("AI pitch generation coming soon!");
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Pitch
                </Button>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowApplicationModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedJob?.job?.id) {
                      applyMutation.mutate(selectedJob.job.id);
                    }
                  }}
                  disabled={applyMutation.isPending || !selectedResumeId}
                  className="gradient-primary"
                >
                  {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* External Job Application Tracking Modal */}
        <Dialog open={showExternalJobModal} onOpenChange={setShowExternalJobModal}>
          <DialogContent className="glass max-w-2xl">
            <DialogHeader>
              <DialogTitle>Track External Job Application</DialogTitle>
              <DialogDescription>
                Track your application to {selectedExternalJob?.title} at {selectedExternalJob?.company_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Application URL</label>
                <Input
                  placeholder="Paste the URL where you applied"
                  className="glass"
                  value={externalApplicationUrl}
                  onChange={(e) => setExternalApplicationUrl(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  This helps you track where you applied and manage your applications
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Select Resume (Optional)</label>
                <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select resume used" />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes?.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id}>
                        {resume.version_label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowExternalJobModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedExternalJob?.id) {
                      trackExternalApplicationMutation.mutate({
                        jobId: selectedExternalJob.id,
                        applicationUrl: externalApplicationUrl || selectedExternalJob.external_url
                      });
                    }
                  }}
                  disabled={trackExternalApplicationMutation.isPending || !externalApplicationUrl.trim()}
                  className="gradient-primary"
                >
                  {trackExternalApplicationMutation.isPending ? "Tracking..." : "Track Application"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
