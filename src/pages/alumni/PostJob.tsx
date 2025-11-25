import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PostJob() {
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
        <h1 className="text-3xl font-bold">Post a Job</h1>
        <Card>
          <CardHeader>
            <CardTitle>Create Job Posting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Job posting form coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
