import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Briefcase, MapPin, DollarSign, Calendar, Building2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function PostJob() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editJobId = searchParams.get("edit");
  const isEditMode = !!editJobId;

  const [formData, setFormData] = useState({
    title: "",
    company_name: "",
    description: "",
    requirements: "",
    location: "",
    job_type: "",
    experience_level: "",
    salary_range: "",
    college_id: "",
  });

  const navItems = [
    { label: "Dashboard", href: "/alumni/dashboard" },
    { label: "Post Job", href: "/alumni/post-job" },
    { label: "My Jobs", href: "/alumni/jobs" },
    { label: "Applications", href: "/alumni/applications" },
    { label: "Candidates", href: "/alumni/candidates" },
    { label: "Profile", href: "/alumni/profile" },
  ];

  // Fetch user profile to get college_id
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
    enabled: !!user,
  });

  // Fetch colleges for selection
  const { data: colleges } = useQuery({
    queryKey: ["colleges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colleges")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // Helper function to get college_id by name (ensures consistency)
  const getCollegeIdByName = async (collegeName: string): Promise<string | null> => {
    if (!collegeName) return null;
    
    // Use find_or_create_college to ensure we get the same college_id
    const { data: collegeDbId, error: functionError } = await (supabase.rpc as any)(
      'find_or_create_college',
      {
        p_name: collegeName,
        p_location: "",
      }
    );

    if (!functionError && collegeDbId) {
      return collegeDbId as string;
    }

    // Fallback: find by name (case-insensitive)
    const { data: existingCollege } = await supabase
      .from("colleges")
      .select("id")
      .ilike("name", collegeName)
      .maybeSingle();

    return existingCollege?.id || null;
  };

  // Fetch job data if in edit mode
  const { data: jobData, isLoading: isLoadingJob } = useQuery({
    queryKey: ["job", editJobId],
    queryFn: async () => {
      if (!editJobId || !user) return null;
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", editJobId)
        .eq("posted_by", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!editJobId && !!user,
  });

  // Populate form when job data is loaded
  useEffect(() => {
    if (jobData && isEditMode) {
      setFormData({
        title: jobData.title || "",
        company_name: jobData.company_name || "",
        description: jobData.description || "",
        requirements: jobData.requirements || "",
        location: jobData.location || "",
        job_type: jobData.job_type || "",
        experience_level: jobData.experience_level || "",
        salary_range: jobData.salary_range || "",
        college_id: jobData.college_id || "",
      });
    }
  }, [jobData, isEditMode]);

  // Set default college_id from profile
  useEffect(() => {
    if (profile?.college_id && !formData.college_id) {
      // Use the profile's college_id which should already be correct (set via find_or_create_college)
      setFormData(prev => ({ ...prev, college_id: profile.college_id }));
    }
  }, [profile?.college_id]);

  const postJobMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error("Not authenticated");

      // Ensure college_id is correct - if a college is selected, verify it matches
      let finalCollegeId: string | null = null;
      if (data.college_id && data.college_id !== "all") {
        // Get the college name from the selected college_id
        const selectedCollege = colleges?.find(c => c.id === data.college_id);
        if (selectedCollege) {
          // Use find_or_create_college to ensure we get the correct college_id
          // This ensures consistency with student profiles
          const correctCollegeId = await getCollegeIdByName(selectedCollege.name);
          finalCollegeId = correctCollegeId || data.college_id;
          console.log("Job posting - College selected:", {
            selectedId: data.college_id,
            collegeName: selectedCollege.name,
            correctId: finalCollegeId,
            match: data.college_id === finalCollegeId
          });
        } else {
          finalCollegeId = data.college_id;
        }
      }

      // If no college selected but alumni has a college_id in profile, use that
      if (!finalCollegeId && profile?.college_id) {
        finalCollegeId = profile.college_id;
        console.log("Job posting - Using profile college_id:", finalCollegeId);
      }

      console.log("Job posting - Final college_id:", finalCollegeId);

      if (isEditMode && editJobId) {
        // Update existing job
        const { data: job, error } = await supabase
          .from("jobs")
          .update({
            title: data.title,
            company_name: data.company_name,
            description: data.description,
            requirements: data.requirements,
            location: data.location,
            job_type: data.job_type,
            experience_level: data.experience_level,
            salary_range: data.salary_range,
            college_id: finalCollegeId,
            updated_at: new Date().toISOString(),
            // Reset status to pending if job was edited (may need re-approval)
            status: "pending",
          })
          .eq("id", editJobId)
          .eq("posted_by", user.id)
          .select()
          .single();

        if (error) throw error;
        return job;
      } else {
        // Create new job
        const { data: job, error } = await supabase
          .from("jobs")
          .insert({
            title: data.title,
            company_name: data.company_name,
            description: data.description,
            requirements: data.requirements,
            location: data.location,
            job_type: data.job_type,
            experience_level: data.experience_level,
            salary_range: data.salary_range,
            posted_by: user.id,
            college_id: finalCollegeId,
            status: "pending", // Needs college approval
          })
          .select()
          .single();

        if (error) throw error;
        return job;
      }
    },
    onSuccess: () => {
      toast({
        title: isEditMode ? "Job updated successfully!" : "Job posted successfully!",
        description: isEditMode 
          ? "Your job posting has been updated and is pending approval."
          : "Your job posting is pending approval from the college.",
      });
      queryClient.invalidateQueries({ queryKey: ["alumni-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job", editJobId] });
      navigate("/alumni/jobs");
    },
    onError: (error: any) => {
      toast({
        title: isEditMode ? "Error updating job" : "Error posting job",
        description: error.message || (isEditMode ? "Failed to update job. Please try again." : "Failed to post job. Please try again."),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.company_name || !formData.description) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    postJobMutation.mutate(formData);
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">{isEditMode ? "Edit Job" : "Post a Job"}</h1>
          <p className="text-gray-400">
            {isEditMode ? "Update your job posting details" : "Create a new job posting for students"}
          </p>
        </motion.div>

        {isLoadingJob ? (
          <Card className="glass-hover">
            <CardContent className="pt-12 pb-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-gray-400">Loading job details...</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>
                {isEditMode ? "Update the details for your job posting" : "Fill in the details for your job posting"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Job Title <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="title"
                      className="pl-10"
                      placeholder="e.g., Software Engineer"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_name">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="company_name"
                      className="pl-10"
                      placeholder="e.g., Tech Corp"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Job Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the role, responsibilities, and what you're looking for..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  placeholder="List the required skills, qualifications, and experience..."
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="location"
                      className="pl-10"
                      placeholder="e.g., Remote, Bangalore"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_type">Job Type</Label>
                  <Select value={formData.job_type} onValueChange={(value) => setFormData({ ...formData, job_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full Time</SelectItem>
                      <SelectItem value="part-time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience_level">Experience Level</Label>
                  <Select value={formData.experience_level} onValueChange={(value) => setFormData({ ...formData, experience_level: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="salary_range">Salary Range</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="salary_range"
                      className="pl-10"
                      placeholder="e.g., ₹5L - ₹10L per annum"
                      value={formData.salary_range}
                      onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="college_id">Target College</Label>
                  <Select 
                    value={formData.college_id || "all"} 
                    onValueChange={(value) => setFormData({ ...formData, college_id: value === "all" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select college (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Colleges</SelectItem>
                      {colleges?.map((college) => (
                        <SelectItem key={college.id} value={college.id}>
                          {college.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="gradient-primary"
                  disabled={postJobMutation.isPending || isLoadingJob}
                >
                  {postJobMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isEditMode ? "Updating..." : "Posting..."}
                    </>
                  ) : (
                    <>
                      <Briefcase className="h-4 w-4 mr-2" />
                      {isEditMode ? "Update Job" : "Post Job"}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/alumni/jobs")}
                  disabled={postJobMutation.isPending || isLoadingJob}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
