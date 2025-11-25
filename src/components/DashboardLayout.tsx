import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  Menu, 
  ChevronLeft,
  ChevronRight,
  LayoutDashboard, 
  User, 
  FileText, 
  Linkedin, 
  Briefcase, 
  ClipboardList, 
  TrendingUp, 
  BarChart3, 
  Calendar, 
  Trophy,
  Users,
  Building2,
  CheckSquare,
  Settings,
  UserCircle,
  Mail
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: { label: string; href: string; icon?: React.ReactNode }[];
}

// Icon mapping for navigation items
const iconMap: Record<string, React.ReactNode> = {
  "Dashboard": <LayoutDashboard className="h-5 w-5" />,
  "Profile": <User className="h-5 w-5" />,
  "Resume": <FileText className="h-5 w-5" />,
  "Resume Builder": <FileText className="h-5 w-5" />,
  "LinkedIn": <Linkedin className="h-5 w-5" />,
  "Job Board": <Briefcase className="h-5 w-5" />,
  "Jobs": <Briefcase className="h-5 w-5" />,
  "My Jobs": <Briefcase className="h-5 w-5" />,
  "My Applications": <ClipboardList className="h-5 w-5" />,
  "Applications": <ClipboardList className="h-5 w-5" />,
  "Skill Path": <TrendingUp className="h-5 w-5" />,
  "Skills": <TrendingUp className="h-5 w-5" />,
  "Career Report": <BarChart3 className="h-5 w-5" />,
  "Events": <Calendar className="h-5 w-5" />,
  "Leaderboard": <Trophy className="h-5 w-5" />,
  "Students": <Users className="h-5 w-5" />,
  "Placement Drives": <Building2 className="h-5 w-5" />,
  "Drives": <Building2 className="h-5 w-5" />,
  "Analytics": <BarChart3 className="h-5 w-5" />,
  "Job Approvals": <CheckSquare className="h-5 w-5" />,
  "Approvals": <CheckSquare className="h-5 w-5" />,
  "Post Job": <Briefcase className="h-5 w-5" />,
  "Post-Job": <Briefcase className="h-5 w-5" />,
  "Candidates": <Users className="h-5 w-5" />,
  "Colleges": <Building2 className="h-5 w-5" />,
};

export function DashboardLayout({ children, navItems }: DashboardLayoutProps) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Get user's display name or email
  const displayName = user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar - Fixed */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 border-r border-blue-200/50 shadow-lg fixed left-0 top-0 h-screen z-50 transition-all duration-300",
          sidebarOpen ? "w-72" : "w-20"
        )}
      >
        {/* Logo Section with Collapse Button at Top */}
        <div className={cn(
          "border-b border-blue-200/50 flex items-center justify-center relative",
          sidebarOpen ? "p-6" : "p-4"
        )}>
          <Link to="/" className="flex items-center justify-center group flex-shrink-0 w-full">
            <motion.img
              src="/favicon.ico"
              alt="Alignr Logo"
              className={cn(
                "transition-all duration-300 object-contain",
                sidebarOpen ? "h-24 w-auto" : "h-14 w-14"
              )}
              whileHover={{ scale: 1.05 }}
            />
          </Link>
          {sidebarOpen && (
            <Button
              onClick={() => setSidebarOpen(false)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-700 hover:text-gray-900 hover:bg-blue-100/50 absolute right-2 top-1/2 -translate-y-1/2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Collapse Button When Sidebar is Collapsed */}
        {!sidebarOpen && (
          <div className="p-2 border-b border-blue-200/50">
            <Button
              onClick={() => setSidebarOpen(true)}
              variant="ghost"
              size="icon"
              className="w-full text-gray-700 hover:text-gray-900 hover:bg-blue-100/50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = iconMap[item.label] || item.icon || <LayoutDashboard className="h-5 w-5" />;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                  "hover:bg-blue-100/50 hover:text-primary",
                  isActive
                    ? "bg-blue-100/70 text-primary border-l-4 border-primary font-semibold"
                    : "text-gray-700 hover:text-gray-900",
                  !sidebarOpen && "justify-center px-3"
                )}
              >
                <span className="flex-shrink-0">{Icon}</span>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section & Logout */}
        <div className="p-4 border-t border-blue-200/50 space-y-3">
          {/* User Info */}
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-100/50"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-600 truncate">{user?.email}</p>
              </div>
            </motion.div>
          )}
          
          {!sidebarOpen && (
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-primary" />
              </div>
            </div>
          )}

          {/* Logout Button */}
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 text-gray-700 hover:text-white hover:bg-red-500",
              !sidebarOpen && "justify-center px-3"
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 border-r border-blue-200/50 p-0">
          {/* Logo Section */}
          <div className="p-6 border-b border-blue-200/50">
            <Link to="/" className="flex items-center justify-center" onClick={() => setMobileMenuOpen(false)}>
              <img
                src="/favicon.ico"
                alt="Alignr Logo"
                className="h-24 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = iconMap[item.label] || item.icon || <LayoutDashboard className="h-5 w-5" />;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    "hover:bg-blue-100/50 hover:text-primary",
                    isActive
                      ? "bg-blue-100/70 text-primary border-l-4 border-primary font-semibold"
                      : "text-gray-700 hover:text-gray-900"
                  )}
                >
                  <span className="flex-shrink-0">{Icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section & Logout */}
          <div className="p-4 border-t border-blue-200/50 space-y-3">
            {/* User Info */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-100/50">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-600 truncate">{user?.email}</p>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-700 hover:text-white hover:bg-red-500"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm">Logout</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content Area - With margin for fixed sidebar */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        sidebarOpen ? "lg:ml-72" : "lg:ml-20"
      )}>
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 border-b border-blue-200/50 bg-gradient-to-r from-blue-50 via-cyan-50 to-teal-50/95 backdrop-blur-md shadow-sm">
          <div className="flex h-16 items-center justify-between px-4">
            <Link to="/" className="flex items-center">
              <img
                src="/favicon.ico"
                alt="Alignr Logo"
                className="h-14 w-14 object-contain"
              />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="text-gray-700 hover:text-gray-900 hover:bg-blue-100/50"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
