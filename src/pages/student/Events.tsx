import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Calendar, MapPin, Clock, Users, Search, ExternalLink, CheckCircle2, Bell, BellOff } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Events() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);

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

  // Fetch events (for student's college and open events)
  const { data: events, isLoading } = useQuery({
    queryKey: ["events", profile?.college_id, eventTypeFilter],
    queryFn: async () => {
      if (!profile) return [];

      let query = supabase
        .from("college_events")
        .select("*, colleges(name)");

      // Filter events: show events from student's college OR events without college restriction (college_id is null)
      if (profile?.college_id) {
        // If student has a college_id, show events for their college OR open events (null college_id)
        // Use proper UUID format in the query
        query = query.or(`college_id.is.null,college_id.eq.${profile.college_id}`);
      } else {
        // If student doesn't have a college_id, only show open events
        query = query.is("college_id", null);
      }

      const { data, error } = await query
        .order("event_date", { ascending: true });

      if (error) {
        console.error("Error fetching events:", error);
        throw error;
      }
      
      // Additional client-side validation: ensure college_id matches if set
      const filtered = (data || []).filter((event: any) => {
        // If event has no college_id, it's open to all - show it
        if (!event.college_id) return true;
        // If student has college_id, only show events matching their college
        if (profile?.college_id) {
          return event.college_id === profile.college_id;
        }
        // If student has no college_id, don't show college-specific events
        return false;
      });

      return filtered;
    },
    enabled: !!user && profile !== undefined,
  });

  const filteredEvents = events?.filter((event: any) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const upcomingEvents = filteredEvents.filter((e: any) => new Date(e.event_date) >= new Date());
  const pastEvents = filteredEvents.filter((e: any) => new Date(e.event_date) < new Date());

  // Fetch notification subscriptions for the current user
  const { data: notificationSubscriptions } = useQuery({
    queryKey: ["event-notification-subscriptions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("event_notification_subscriptions")
        .select("event_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []).map((sub: any) => sub.event_id);
    },
    enabled: !!user,
  });

  // Check if user is subscribed to an event
  const isSubscribed = (eventId: string) => {
    return notificationSubscriptions?.includes(eventId) || false;
  };

  // Subscribe to event notification mutation
  const subscribeMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.rpc("subscribe_to_event_notification", {
        p_event_id: eventId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-notification-subscriptions", user?.id] });
      toast({
        title: "Notification enabled",
        description: "You'll receive a reminder 1 hour before the event.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to enable notifications.",
        variant: "destructive",
      });
    },
  });

  // Unsubscribe from event notification mutation
  const unsubscribeMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.rpc("unsubscribe_from_event_notification", {
        p_event_id: eventId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-notification-subscriptions", user?.id] });
      toast({
        title: "Notification disabled",
        description: "You won't receive reminders for this event.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disable notifications.",
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (event: any) => {
    setSelectedEvent(event);
    setViewDetailsOpen(true);
  };

  const handleNotifyToggle = (eventId: string, isCurrentlySubscribed: boolean) => {
    if (isCurrentlySubscribed) {
      unsubscribeMutation.mutate(eventId);
    } else {
      subscribeMutation.mutate(eventId);
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
          <h1 className="text-4xl font-bold mb-2">Events</h1>
          <p className="text-gray-400">Workshops, webinars, and networking events</p>
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
                <p className="text-gray-400">Check back later for new events.</p>
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
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <Badge variant="outline">Upcoming</Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {event.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(event.event_date), "PPP 'at' p")}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                        )}
                        {event.colleges?.name && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Users className="h-4 w-4" />
                            {event.colleges.name}
                          </div>
                        )}
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={() => handleViewDetails(event)}
                        >
                          View Details
                        </Button>
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
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <Badge variant="outline">Past</Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {event.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(event.event_date), "PPP")}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Event Details Dialog */}
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedEvent && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedEvent.title}</DialogTitle>
                  <DialogDescription>
                    {selectedEvent.event_type && (
                      <Badge variant="outline" className="mt-2">
                        {selectedEvent.event_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {selectedEvent.description && (
                    <div>
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">
                        {selectedEvent.description}
                      </p>
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">
                        {format(new Date(selectedEvent.event_date), "PPPP 'at' p")}
                      </span>
                    </div>
                    {selectedEvent.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">{selectedEvent.location}</span>
                      </div>
                    )}
                    {selectedEvent.colleges?.name && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">{selectedEvent.colleges.name}</span>
                      </div>
                    )}
                    {selectedEvent.registration_link && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={selectedEvent.registration_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Register
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant={isSubscribed(selectedEvent.id) ? "default" : "outline"}
                    onClick={() => handleNotifyToggle(selectedEvent.id, isSubscribed(selectedEvent.id))}
                    disabled={subscribeMutation.isPending || unsubscribeMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {subscribeMutation.isPending || unsubscribeMutation.isPending ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        Processing...
                      </>
                    ) : isSubscribed(selectedEvent.id) ? (
                      <>
                        <BellOff className="h-4 w-4 mr-2" />
                        Disable Notification
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4 mr-2" />
                        Notify Me
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setViewDetailsOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
