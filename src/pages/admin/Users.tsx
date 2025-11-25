import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Users, Search, GraduationCap, Briefcase, Shield, Mail } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Colleges", href: "/admin/colleges" },
    { label: "Jobs", href: "/admin/jobs" },
    { label: "Users", href: "/admin/users" },
    { label: "Analytics", href: "/admin/analytics" },
  ];

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", roleFilter],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select(`
          *,
          user_roles(role),
          colleges(name)
        `)
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Filter by role if specified
      let filtered = data || [];
      if (roleFilter !== "all") {
        filtered = filtered.filter((user: any) =>
          user.user_roles?.some((ur: any) => ur.role === roleFilter)
        );
      }

      return filtered;
    },
  });

  const filteredUsers = users?.filter((user: any) =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const stats = {
    total: users?.length || 0,
    students: users?.filter((u: any) => u.user_roles?.some((ur: any) => ur.role === "student")).length || 0,
    alumni: users?.filter((u: any) => u.user_roles?.some((ur: any) => ur.role === "alumni")).length || 0,
    colleges: users?.filter((u: any) => u.user_roles?.some((ur: any) => ur.role === "college")).length || 0,
    admins: users?.filter((u: any) => u.user_roles?.some((ur: any) => ur.role === "admin")).length || 0,
  };

  const getRoleBadges = (userRoles: any[]) => {
    if (!userRoles || userRoles.length === 0) return <Badge variant="outline">No Role</Badge>;
    return userRoles.map((ur: any) => {
      const colors: Record<string, string> = {
        student: "bg-blue-500/20 text-blue-500 border-blue-500",
        alumni: "bg-purple-500/20 text-purple-500 border-purple-500",
        college: "bg-green-500/20 text-green-500 border-green-500",
        admin: "bg-red-500/20 text-red-500 border-red-500",
      };
      return (
        <Badge key={ur.role} variant="outline" className={colors[ur.role] || ""}>
          {ur.role}
        </Badge>
      );
    });
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">User Management</h1>
          <p className="text-gray-400">Manage all users across the platform</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{stats.total}</div>
                <div className="text-sm text-gray-400">Total Users</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500 mb-1">{stats.students}</div>
                <div className="text-sm text-gray-400">Students</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500 mb-1">{stats.alumni}</div>
                <div className="text-sm text-gray-400">Alumni</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-1">{stats.colleges}</div>
                <div className="text-sm text-gray-400">Colleges</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500 mb-1">{stats.admins}</div>
                <div className="text-sm text-gray-400">Admins</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-hover">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="alumni">Alumni</SelectItem>
                  <SelectItem value="college">Colleges</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card className="glass-hover">
            <CardContent className="pt-12 pb-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-gray-400">Try adjusting your search or filters.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {filteredUsers.map((user: any, idx: number) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="flex items-center justify-between p-4 rounded-lg glass hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar>
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>
                            {user.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold">{user.full_name}</h3>
                            {getRoleBadges(user.user_roles || [])}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                            {user.colleges?.name && (
                              <>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <GraduationCap className="h-3 w-3" />
                                  {user.colleges.name}
                                </div>
                              </>
                            )}
                            {user.department && (
                              <>
                                <span>•</span>
                                <span>{user.department}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
