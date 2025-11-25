import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Users, Search, GraduationCap, Briefcase, Shield, Mail, Eye, UserPlus, UserMinus, Ban, CheckCircle2, X } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [roleToAssign, setRoleToAssign] = useState<string>("");
  const [roleToRemove, setRoleToRemove] = useState<string | null>(null);
  const [deleteRoleDialogOpen, setDeleteRoleDialogOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Approvals", href: "/admin/approvals" },
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

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as any });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Role assigned",
        description: "The role has been assigned successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setRoleToAssign("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Role removed",
        description: "The role has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDeleteRoleDialogOpen(false);
      setRoleToRemove(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle user active status
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.isActive ? "User activated" : "User suspended",
        description: `The user has been ${variables.isActive ? "activated" : "suspended"}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getRoleBadges = (userRoles: any[], userId: string) => {
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
                            {getRoleBadges(user.user_roles || [], user.user_id)}
                            {user.is_active === false && (
                              <Badge variant="outline" className="border-red-500 text-red-500">
                                <Ban className="h-3 w-3 mr-1" />
                                Suspended
                              </Badge>
                            )}
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
                      <div className="flex items-center gap-2">
                        {user.is_active === false && (
                          <Badge variant="outline" className="border-red-500 text-red-500">
                            <Ban className="h-3 w-3 mr-1" />
                            Suspended
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Details Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedUser && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedUser.full_name}</DialogTitle>
                  <DialogDescription>User management and role assignment</DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Email</h4>
                      <p className="text-sm text-gray-300">{selectedUser.email}</p>
                    </div>
                    {selectedUser.phone && (
                      <div>
                        <h4 className="font-semibold mb-2">Phone</h4>
                        <p className="text-sm text-gray-300">{selectedUser.phone}</p>
                      </div>
                    )}
                    {selectedUser.colleges?.name && (
                      <div>
                        <h4 className="font-semibold mb-2">College</h4>
                        <p className="text-sm text-gray-300">{selectedUser.colleges.name}</p>
                      </div>
                    )}
                    {selectedUser.department && (
                      <div>
                        <h4 className="font-semibold mb-2">Department</h4>
                        <p className="text-sm text-gray-300">{selectedUser.department}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold mb-2">Status</h4>
                      <Badge variant={selectedUser.is_active !== false ? "outline" : "destructive"}>
                        {selectedUser.is_active !== false ? "Active" : "Suspended"}
                      </Badge>
                    </div>
                  </div>

                  {/* Current Roles */}
                  <div>
                    <h4 className="font-semibold mb-3">Current Roles</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedUser.user_roles && selectedUser.user_roles.length > 0 ? (
                        selectedUser.user_roles.map((ur: any) => (
                          <Badge key={ur.role} variant="outline" className="flex items-center gap-2">
                            {ur.role}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-red-500/20"
                              onClick={() => {
                                setRoleToRemove(ur.role);
                                setDeleteRoleDialogOpen(true);
                              }}
                            >
                              <X className="h-3 w-3 text-red-500" />
                            </Button>
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-500">No Role</Badge>
                      )}
                    </div>
                  </div>

                  {/* Assign Role */}
                  <div>
                    <h4 className="font-semibold mb-3">Assign New Role</h4>
                    <div className="flex gap-2">
                      <Select value={roleToAssign} onValueChange={setRoleToAssign}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {["student", "alumni", "college", "admin"].map((role) => (
                            <SelectItem 
                              key={role} 
                              value={role}
                              disabled={selectedUser.user_roles?.some((ur: any) => ur.role === role)}
                            >
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => {
                          if (roleToAssign) {
                            assignRoleMutation.mutate({ userId: selectedUser.user_id, role: roleToAssign });
                          }
                        }}
                        disabled={!roleToAssign || assignRoleMutation.isPending}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign
                      </Button>
                    </div>
                  </div>

                  {/* User Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    {selectedUser.is_active !== false ? (
                      <Button
                        variant="outline"
                        className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10"
                        onClick={() => toggleUserStatusMutation.mutate({ userId: selectedUser.user_id, isActive: false })}
                        disabled={toggleUserStatusMutation.isPending}
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Suspend User
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="flex-1 border-green-500 text-green-500 hover:bg-green-500/10"
                        onClick={() => toggleUserStatusMutation.mutate({ userId: selectedUser.user_id, isActive: true })}
                        disabled={toggleUserStatusMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Activate User
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Remove Role Confirmation */}
        <AlertDialog open={deleteRoleDialogOpen} onOpenChange={setDeleteRoleDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Role?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove the "{roleToRemove}" role from {selectedUser?.full_name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (roleToRemove && selectedUser) {
                    removeRoleMutation.mutate({ userId: selectedUser.user_id, role: roleToRemove });
                  }
                }}
                className="bg-red-500 hover:bg-red-600"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
