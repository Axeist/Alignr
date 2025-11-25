import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AlumniApplications() {
  const navItems = [
    { label: "Dashboard", href: "/alumni/dashboard" },
    { label: "Post Job", href: "/alumni/post-job" },
    { label: "My Jobs", href: "/alumni/jobs" },
    { label: "Applications", href: "/alumni/applications" },
    { label: "Candidates", href: "/alumni/candidates" },
  ];

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Job Applications</h1>
        <Card>
          <CardHeader>
            <CardTitle>Received Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Applications for your jobs will appear here...</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
