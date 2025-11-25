import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlacementDrives() {
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
        <h1 className="text-3xl font-bold">Placement Drives</h1>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Drives</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Organize and manage campus placement drives...</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
