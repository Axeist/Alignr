import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Calendar, Building2, Plus, Search, Users, MapPin, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
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

export default function PlacementDrives() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [driveToDelete, setDriveToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    company_name: "",
    description: "",
    drive_date: "",
  });

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

  // Fetch placement drives
  const { data: drives, isLoading } = useQuery({
    queryKey: ["placement-drives", collegeId],
    queryFn: async () => {
      if (!collegeId) return [];
      const { data, error } = await supabase
        .from("placement_drives")
        .select("*")
        .eq("college_id", collegeId)
        .order("drive_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!collegeId,
  });

  const createDriveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!collegeId) throw new Error("College not found");
      const { data: drive, error } = await supabase
        .from("placement_drives")
        .insert({
          ...data,
          college_id: collegeId,
        })
        .select()
        .single();
      if (error) throw error;
      return drive;
    },
    onSuccess: () => {
      toast({
        title: "Drive created successfully!",
        description: "The placement drive has been created.",
      });
      queryClient.invalidateQueries({ queryKey: ["placement-drives"] });
      setCreateDialogOpen(false);
      setFormData({ title: "", company_name: "", description: "", drive_date: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating drive",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteDriveMutation = useMutation({
    mutationFn: async (driveId: string) => {
      const { error } = await supabase
        .from("placement_drives")
        .delete()
        .eq("id", driveId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Drive deleted",
        description: "The placement drive has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["placement-drives"] });
      setDeleteDialogOpen(false);
      setDriveToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting drive",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredDrives = drives?.filter((drive: any) =>
    drive.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    drive.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const upcomingDrives = filteredDrives.filter((d: any) => new Date(d.drive_date) >= new Date());
  const pastDrives = filteredDrives.filter((d: any) => new Date(d.drive_date) < new Date());

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
              <h1 className="text-4xl font-bold mb-2">Placement Drives</h1>
              <p className="text-gray-400">Organize and manage campus placement drives</p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Drive
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Placement Drive</DialogTitle>
                  <DialogDescription>Add a new placement drive for your college</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Drive Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Amazon Campus Drive 2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="e.g., Amazon"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="drive_date">Drive Date</Label>
                    <Input
                      id="drive_date"
                      type="datetime-local"
                      value={formData.drive_date}
                      onChange={(e) => setFormData({ ...formData, drive_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Drive details, requirements, etc."
                      rows={4}
                    />
                  </div>
                  <Button
                    className="w-full gradient-primary"
                    onClick={() => createDriveMutation.mutate(formData)}
                    disabled={createDriveMutation.isPending}
                  >
                    Create Drive
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
                placeholder="Search drives..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Drives */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Upcoming Drives</h2>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-2 text-gray-400">Loading drives...</p>
            </div>
          ) : upcomingDrives.length === 0 ? (
            <Card className="glass-hover">
              <CardContent className="pt-12 pb-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming drives</h3>
                <p className="text-gray-400">Create a new placement drive to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {upcomingDrives.map((drive: any, idx: number) => (
                <motion.div
                  key={drive.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="glass-hover">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle>{drive.title}</CardTitle>
                          <CardDescription className="mt-1">{drive.company_name}</CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDriveToDelete(drive.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(drive.drive_date), "PPP 'at' p")}
                        </div>
                        {drive.description && (
                          <p className="text-sm text-gray-300 line-clamp-2">{drive.description}</p>
                        )}
                        <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500">
                          Upcoming
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Past Drives */}
        {pastDrives.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Past Drives</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {pastDrives.slice(0, 6).map((drive: any, idx: number) => (
                <motion.div
                  key={drive.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="glass-hover opacity-75">
                    <CardHeader>
                      <CardTitle>{drive.title}</CardTitle>
                      <CardDescription>{drive.company_name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(drive.drive_date), "PPP")}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the placement drive.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => driveToDelete && deleteDriveMutation.mutate(driveToDelete)}
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
