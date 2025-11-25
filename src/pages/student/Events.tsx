import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Calendar, MapPin, Clock, Users, Search, ExternalLink, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Events() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");

  const navItems = [
    { label: "Dashboard", href: "/student/dashboard" },
    { label: "Profile", href: "/student/profile" },
    { label: "Resume Builder", href: "/student/resume" },
    { label: "Job Board", href: "/student/jobs" },
    { label: "My Applications", href: "/student/applications" },
    { label: "Skill Path", href: "/student/skills" },
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
      let query = supabase
        .from("events")
        .select("*, colleges(name), profiles!events_organizer_id_fkey(full_name)")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });

      // Filter by event type if specified (if events table has event_type column)
      // For now, we'll fetch all upcoming events

      const { data, error } = await query;
      if (error) throw error;
      
      // Filter events: show college events or all open events
      const filtered = (data || []).filter((event: any) => {
        // Show events from student's college or events without college restriction
        return !event.college_id || event.college_id === profile?.college_id;
      });

      return filtered;
    },
    enabled: !!user,
  });

  const filteredEvents = events?.filter((event: any) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const upcomingEvents = filteredEvents.filter((e: any) => new Date(e.event_date) >= new Date());
  const pastEvents = filteredEvents.filter((e: any) => new Date(e.event_date) < new Date());

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
                        <Button className="w-full" variant="outline">
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
      </div>
    </DashboardLayout>
  );
}
