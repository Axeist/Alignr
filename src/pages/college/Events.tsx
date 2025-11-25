import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CollegeEvents() {
  const navItems = [
    { label: "Dashboard", href: "/college/dashboard" },
    { label: "Students", href: "/college/students" },
    { label: "Placement Drives", href: "/college/drives" },
    { label: "Events", href: "/college/events" },
    { label: "Analytics", href: "/college/analytics" },
    { label: "Job Approvals", href: "/college/approvals" },
  ];

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Events Management</h1>
        <Card>
          <CardHeader>
            <CardTitle>College Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Create and manage workshops, webinars, and events...</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
