import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Search, User, GraduationCap, MapPin, Briefcase, Mail, Linkedin, Github, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Candidates() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  const navItems = [
    { label: "Dashboard", href: "/alumni/dashboard" },
    { label: "Post Job", href: "/alumni/post-job" },
    { label: "My Jobs", href: "/alumni/jobs" },
    { label: "Applications", href: "/alumni/applications" },
    { label: "Candidates", href: "/alumni/candidates" },
  ];

  // Fetch student profiles
  const { data: candidates, isLoading } = useQuery({
    queryKey: ["candidates", searchQuery, departmentFilter, yearFilter],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select(`
          *,
          user_roles!inner(role),
          colleges(name),
          skills(skill_name, proficiency)
        `)
        .eq("user_roles.role", "student")
        .order("career_score", { ascending: false, nullsFirst: false });

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      if (departmentFilter !== "all") {
        query = query.eq("department", departmentFilter);
      }

      if (yearFilter !== "all") {
        query = query.eq("year", parseInt(yearFilter));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const departments = Array.from(new Set(candidates?.map((c: any) => c.department).filter(Boolean) || []));

  const filteredCandidates = candidates || [];

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Candidate Pool</h1>
          <p className="text-gray-400">Browse and search student profiles</p>
        </motion.div>

        {/* Filters */}
        <Card className="glass-hover">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Candidates Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading candidates...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <Card className="glass-hover">
            <CardContent className="pt-12 pb-12 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No candidates found</h3>
              <p className="text-gray-400">Try adjusting your search filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCandidates.map((candidate: any, idx: number) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="glass-hover">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={candidate.avatar_url} />
                          <AvatarFallback>
                            {candidate.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{candidate.full_name}</CardTitle>
                          <p className="text-sm text-gray-400">{candidate.email}</p>
                        </div>
                      </div>
                      {candidate.career_score && (
                        <Badge variant="outline">{candidate.career_score}%</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        {candidate.colleges?.name && (
                          <>
                            <GraduationCap className="h-4 w-4" />
                            {candidate.colleges.name}
                          </>
                        )}
                      </div>
                      {candidate.department && candidate.year && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Briefcase className="h-4 w-4" />
                          {candidate.department} • Year {candidate.year}
                        </div>
                      )}
                      {candidate.skills && candidate.skills.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-400 mb-2">Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {candidate.skills.slice(0, 3).map((skill: any, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {skill.skill_name}
                              </Badge>
                            ))}
                            {candidate.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{candidate.skills.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => {
                          setSelectedCandidate(candidate);
                          setViewDialogOpen(true);
                        }}
                      >
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* View Candidate Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedCandidate && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedCandidate.avatar_url} />
                      <AvatarFallback>
                        {selectedCandidate.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle>{selectedCandidate.full_name}</DialogTitle>
                      <DialogDescription>{selectedCandidate.email}</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-4">
                  {selectedCandidate.bio && (
                    <div>
                      <h4 className="font-semibold mb-2">About</h4>
                      <p className="text-sm text-gray-300">{selectedCandidate.bio}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedCandidate.department && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Department</p>
                        <p className="text-sm">{selectedCandidate.department}</p>
                      </div>
                    )}
                    {selectedCandidate.year && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Year</p>
                        <p className="text-sm">Year {selectedCandidate.year}</p>
                      </div>
                    )}
                    {selectedCandidate.colleges?.name && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">College</p>
                        <p className="text-sm">{selectedCandidate.colleges.name}</p>
                      </div>
                    )}
                    {selectedCandidate.career_score && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Career Score</p>
                        <p className="text-sm">{selectedCandidate.career_score}%</p>
                      </div>
                    )}
                  </div>
                  {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.skills.map((skill: any, i: number) => (
                          <Badge key={i} variant="outline">
                            {skill.skill_name}
                            {skill.proficiency && ` - ${skill.proficiency}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4 pt-4 border-t">
                    {selectedCandidate.linkedin_url && (
                      <a
                        href={selectedCandidate.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </a>
                    )}
                    {selectedCandidate.github_url && (
                      <a
                        href={selectedCandidate.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <Github className="h-4 w-4" />
                        GitHub
                      </a>
                    )}
                    {selectedCandidate.portfolio_url && (
                      <a
                        href={selectedCandidate.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Portfolio
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
