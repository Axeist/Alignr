import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Building2, Plus, Search, Edit, Trash2, CheckCircle2, XCircle, UserPlus, Shield, Eye } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export default function AdminColleges() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collegeToDelete, setCollegeToDelete] = useState<string | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    website: "",
  });

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Approvals", href: "/admin/approvals" },
    { label: "Colleges", href: "/admin/colleges" },
    { label: "Jobs", href: "/admin/jobs" },
    { label: "Users", href: "/admin/users" },
    { label: "Analytics", href: "/admin/analytics" },
  ];

  const { data: colleges, isLoading } = useQuery({
    queryKey: ["admin-colleges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colleges")
        .select("*, profiles!colleges_admin_id_fkey(full_name, email, user_id)")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch users for admin assignment
  const { data: users } = useQuery({
    queryKey: ["admin-users-for-assignment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, user_roles(role)")
        .order("full_name");
      if (error) throw error;
      // Filter users with college role
      return (data || []).filter((user: any) => 
        user.user_roles?.some((ur: any) => ur.role === "college")
      );
    },
  });

  const createCollegeMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: college, error } = await supabase
        .from("colleges")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return college;
    },
    onSuccess: () => {
      toast({
        title: "College created successfully!",
        description: "The college has been added.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-colleges"] });
      setCreateDialogOpen(false);
      setFormData({ name: "", location: "", website: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating college",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCollegeMutation = useMutation({
    mutationFn: async (collegeId: string) => {
      const { error } = await supabase
        .from("colleges")
        .delete()
        .eq("id", collegeId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "College deleted",
        description: "The college has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-colleges"] });
      setDeleteDialogOpen(false);
      setCollegeToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting college",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify college mutation
  const verifyCollegeMutation = useMutation({
    mutationFn: async (collegeId: string) => {
      const { error } = await supabase
        .from("colleges")
        .update({ is_verified: true })
        .eq("id", collegeId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "College verified",
        description: "The college has been verified.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-colleges"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Assign admin mutation
  const assignAdminMutation = useMutation({
    mutationFn: async ({ collegeId, adminId }: { collegeId: string; adminId: string }) => {
      const { error } = await supabase
        .from("colleges")
        .update({ admin_id: adminId })
        .eq("id", collegeId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Admin assigned",
        description: "The college admin has been assigned.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-colleges"] });
      setAdminUserId("");
      setViewDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredColleges = colleges?.filter((college: any) =>
    college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    college.location?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">College Management</h1>
              <p className="text-gray-400">Manage registered colleges and institutions</p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add College
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create College</DialogTitle>
                  <DialogDescription>Add a new college to the platform</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">College Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., MIT"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Cambridge, MA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="e.g., https://mit.edu"
                    />
                  </div>
                  <Button
                    className="w-full gradient-primary"
                    onClick={() => createCollegeMutation.mutate(formData)}
                    disabled={createCollegeMutation.isPending}
                  >
                    Create College
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Search */}
        <Card className="glass-hover">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search colleges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Colleges List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading colleges...</p>
          </div>
        ) : filteredColleges.length === 0 ? (
          <Card className="glass-hover">
            <CardContent className="pt-12 pb-12 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No colleges found</h3>
              <p className="text-gray-400">Add a new college to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredColleges.map((college: any, idx: number) => (
              <motion.div
                key={college.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="glass-hover">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{college.name}</CardTitle>
                        <p className="text-sm text-gray-400 mt-1">{college.location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCollege(college);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCollegeToDelete(college.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {college.website && (
                        <a
                          href={college.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Visit Website
                        </a>
                      )}
                      <div className="flex items-center gap-2">
                        {college.is_verified ? (
                          <Badge className="bg-green-500/20 text-green-500 border-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                            Unverified
                          </Badge>
                        )}
                        {college.profiles && (
                          <Badge variant="outline" className="border-blue-500 text-blue-500">
                            <Shield className="h-3 w-3 mr-1" />
                            Has Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* View/Manage College Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            {selectedCollege && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedCollege.name}</DialogTitle>
                  <DialogDescription>College management and settings</DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Location</h4>
                      <p className="text-sm text-gray-300">{selectedCollege.location || "Not specified"}</p>
                    </div>
                    {selectedCollege.website && (
                      <div>
                        <h4 className="font-semibold mb-2">Website</h4>
                        <a href={selectedCollege.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                          {selectedCollege.website}
                        </a>
                      </div>
                    )}
                    {selectedCollege.profiles && (
                      <div>
                        <h4 className="font-semibold mb-2">Current Admin</h4>
                        <p className="text-sm text-gray-300">
                          {selectedCollege.profiles.full_name} ({selectedCollege.profiles.email})
                        </p>
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold mb-2">Verification Status</h4>
                      {selectedCollege.is_verified ? (
                        <Badge className="bg-green-500/20 text-green-500 border-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Assign Admin */}
                  {users && users.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Assign College Admin</h4>
                      <div className="flex gap-2">
                        <Select value={adminUserId} onValueChange={setAdminUserId}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user: any) => (
                              <SelectItem key={user.user_id} value={user.user_id}>
                                {user.full_name} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => {
                            if (adminUserId) {
                              assignAdminMutation.mutate({ collegeId: selectedCollege.id, adminId: adminUserId });
                            }
                          }}
                          disabled={!adminUserId || assignAdminMutation.isPending}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Assign
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    {!selectedCollege.is_verified && (
                      <Button
                        variant="outline"
                        className="flex-1 border-green-500 text-green-500 hover:bg-green-500/10"
                        onClick={() => verifyCollegeMutation.mutate(selectedCollege.id)}
                        disabled={verifyCollegeMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Verify College
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the college and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => collegeToDelete && deleteCollegeMutation.mutate(collegeToDelete)}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
