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
import { Search, User, GraduationCap, TrendingUp, Mail, Filter } from "lucide-react";
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

export default function Students() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/college/dashboard" },
    { label: "Students", href: "/college/students" },
    { label: "Placement Drives", href: "/college/drives" },
    { label: "Events", href: "/college/events" },
    { label: "Analytics", href: "/college/analytics" },
    { label: "Job Approvals", href: "/college/approvals" },
    { label: "Profile", href: "/college/profile" },
  ];

  // Fetch college data
  const { data: profile } = useQuery({
    queryKey: ["college-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*, colleges(*)")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const collegeId = profile?.college_id;

  // Fetch students
  const { data: students, isLoading } = useQuery({
    queryKey: ["college-students", collegeId, searchQuery, departmentFilter, yearFilter],
    queryFn: async () => {
      if (!collegeId) return [];
      let query = supabase
        .from("profiles")
        .select("*, user_roles!inner(role), skills(skill_name, proficiency)")
        .eq("user_roles.role", "student")
        .eq("college_id", collegeId)
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
    enabled: !!collegeId,
  });

  const departments = Array.from(new Set(students?.map((s: any) => s.department).filter(Boolean) || []));

  const stats = {
    total: students?.length || 0,
    active: students?.filter((s: any) => s.is_active !== false).length || 0,
    avgScore: students?.length
      ? Math.round(students.reduce((sum: number, s: any) => sum + (s.career_score || 0), 0) / students.length)
      : 0,
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Student Management</h1>
          <p className="text-gray-400">Manage and track student profiles and progress</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{stats.total}</div>
                <div className="text-sm text-gray-400">Total Students</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-1">{stats.active}</div>
                <div className="text-sm text-gray-400">Active Students</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500 mb-1">{stats.avgScore}%</div>
                <div className="text-sm text-gray-400">Avg Career Score</div>
              </div>
            </CardContent>
          </Card>
        </div>

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

        {/* Students Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading students...</p>
          </div>
        ) : students && students.length === 0 ? (
          <Card className="glass-hover">
            <CardContent className="pt-12 pb-12 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No students found</h3>
              <p className="text-gray-400">Students registered with your college will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {students?.map((student: any, idx: number) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="flex items-center justify-between p-4 rounded-lg glass hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar>
                          <AvatarImage src={student.avatar_url} />
                          <AvatarFallback>
                            {student.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold">{student.full_name}</h3>
                            {student.career_score && (
                              <Badge variant="outline">{student.career_score}%</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>{student.email}</span>
                            {student.department && (
                              <>
                                <span>•</span>
                                <span>{student.department}</span>
                              </>
                            )}
                            {student.year && (
                              <>
                                <span>•</span>
                                <span>Year {student.year}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStudent(student);
                          setViewDialogOpen(true);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Student Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedStudent && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedStudent.avatar_url} />
                      <AvatarFallback>
                        {selectedStudent.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle>{selectedStudent.full_name}</DialogTitle>
                      <DialogDescription>{selectedStudent.email}</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-4">
                  {selectedStudent.bio && (
                    <div>
                      <h4 className="font-semibold mb-2">About</h4>
                      <p className="text-sm text-gray-300">{selectedStudent.bio}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedStudent.department && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Department</p>
                        <p className="text-sm">{selectedStudent.department}</p>
                      </div>
                    )}
                    {selectedStudent.year && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Year</p>
                        <p className="text-sm">Year {selectedStudent.year}</p>
                      </div>
                    )}
                    {selectedStudent.career_score && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Career Score</p>
                        <p className="text-sm">{selectedStudent.career_score}%</p>
                      </div>
                    )}
                    {selectedStudent.phone && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Phone</p>
                        <p className="text-sm">{selectedStudent.phone}</p>
                      </div>
                    )}
                  </div>
                  {selectedStudent.skills && selectedStudent.skills.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedStudent.skills.map((skill: any, i: number) => (
                          <Badge key={i} variant="outline">
                            {skill.skill_name}
                            {skill.proficiency && ` - ${skill.proficiency}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
