import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminJobs() {
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
        <h1 className="text-3xl font-bold">Job Management</h1>
        <Card>
          <CardHeader>
            <CardTitle>All Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Monitor and manage all job postings across the platform...</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
