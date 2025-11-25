import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Building2, Plus, Search, Edit, Trash2, CheckCircle2, XCircle } from "lucide-react";
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
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    website: "",
  });

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard" },
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
        .select("*")
        .order("name");
      if (error) throw error;
      return data || [];
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
                      {college.is_verified && (
                        <Badge className="bg-green-500/20 text-green-500 border-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

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
