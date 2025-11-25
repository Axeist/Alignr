import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminColleges() {
  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Colleges", href: "/admin/colleges" },
    { label: "Jobs", href: "/admin/jobs" },
    { label: "Users", href: "/admin/users" },
    { label: "Analytics", href: "/admin/analytics" },
  ];

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">College Management</h1>
        <Card>
          <CardHeader>
            <CardTitle>All Colleges</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Manage registered colleges and institutions...</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
