import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, userRole } = useAuth();

  const getDashboardLink = () => {
    if (!userRole) return "/auth";
    switch (userRole) {
      case "student":
        return "/student/dashboard";
      case "alumni":
        return "/alumni/dashboard";
      case "college":
        return "/college/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/auth";
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/10">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Alignr
        </h1>
        <p className="text-xl text-muted-foreground max-w-md">
          Your AI-powered career ecosystem connecting students, alumni, and opportunities
        </p>
        <div className="flex gap-4 justify-center pt-4">
          {user ? (
            <Link to={getDashboardLink()}>
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
