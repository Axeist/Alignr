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
import { Calendar, Plus, Search, MapPin, Users, Trash2, Edit } from "lucide-react";
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

export default function CollegeEvents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
  });

  const navItems = [
    { label: "Dashboard", href: "/college/dashboard" },
    { label: "Students", href: "/college/students" },
    { label: "Placement Drives", href: "/college/drives" },
    { label: "Events", href: "/college/events" },
    { label: "Analytics", href: "/college/analytics" },
    { label: "Job Approvals", href: "/college/approvals" },
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

  // Fetch events
  const { data: events, isLoading } = useQuery({
    queryKey: ["college-events", collegeId],
    queryFn: async () => {
      if (!collegeId) return [];
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("college_id", collegeId)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!collegeId,
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user || !collegeId) throw new Error("Not authenticated or college not found");
      const { data: event, error } = await supabase
        .from("events")
        .insert({
          ...data,
          organizer_id: user.id,
          college_id: collegeId,
        })
        .select()
        .single();
      if (error) throw error;
      return event;
    },
    onSuccess: () => {
      toast({
        title: "Event created successfully!",
        description: "The event has been created.",
      });
      queryClient.invalidateQueries({ queryKey: ["college-events"] });
      setCreateDialogOpen(false);
      setFormData({ title: "", description: "", event_date: "", location: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Event deleted",
        description: "The event has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["college-events"] });
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredEvents = events?.filter((event: any) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const upcomingEvents = filteredEvents.filter((e: any) => new Date(e.event_date) >= new Date());
  const pastEvents = filteredEvents.filter((e: any) => new Date(e.event_date) < new Date());

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

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
              <h1 className="text-4xl font-bold mb-2">Events Management</h1>
              <p className="text-gray-400">Create and manage workshops, webinars, and events</p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Event</DialogTitle>
                  <DialogDescription>Add a new event for your college</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Career Development Workshop"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event_date">Event Date & Time</Label>
                    <Input
                      id="event_date"
                      type="datetime-local"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Main Auditorium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Event description..."
                      rows={4}
                    />
                  </div>
                  <Button
                    className="w-full gradient-primary"
                    onClick={() => createEventMutation.mutate(formData)}
                    disabled={createEventMutation.isPending}
                  >
                    Create Event
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
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-2 text-gray-400">Loading events...</p>
            </div>
          ) : upcomingEvents.length === 0 ? (
            <Card className="glass-hover">
              <CardContent className="pt-12 pb-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
                <p className="text-gray-400">Create a new event to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((event: any, idx: number) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="glass-hover">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{event.title}</CardTitle>
                          <Badge variant="outline" className="mt-2 bg-green-500/20 text-green-500 border-green-500">
                            Upcoming
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEventToDelete(event.id);
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
                          {formatDate(event.event_date)}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                        )}
                        {event.description && (
                          <p className="text-sm text-gray-300 line-clamp-2">{event.description}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Past Events</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastEvents.slice(0, 6).map((event: any, idx: number) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="glass-hover opacity-75">
                    <CardHeader>
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <Badge variant="outline">Past</Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="h-4 w-4" />
                        {formatDate(event.event_date)}
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
                This action cannot be undone. This will permanently delete the event.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => eventToDelete && deleteEventMutation.mutate(eventToDelete)}
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
