import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";

// Student Pages
import StudentDashboard from "./pages/student/Dashboard";
import StudentProfile from "./pages/student/Profile";
import ResumeBuilder from "./pages/student/Resume";
import JobBoard from "./pages/student/Jobs";
import StudentApplications from "./pages/student/Applications";
import SkillPath from "./pages/student/Skills";
import StudentEvents from "./pages/student/Events";
import Leaderboard from "./pages/student/Leaderboard";
import LinkedInAnalysis from "./pages/student/LinkedIn";
import CareerReport from "./pages/student/CareerReport";

// Alumni Pages
import AlumniDashboard from "./pages/alumni/Dashboard";
import PostJob from "./pages/alumni/PostJob";
import AlumniJobs from "./pages/alumni/Jobs";
import AlumniApplications from "./pages/alumni/Applications";
import Candidates from "./pages/alumni/Candidates";

// College Pages
import CollegeDashboard from "./pages/college/Dashboard";
import Students from "./pages/college/Students";
import PlacementDrives from "./pages/college/Drives";
import CollegeEvents from "./pages/college/Events";
import Analytics from "./pages/college/Analytics";
import JobApprovals from "./pages/college/Approvals";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminColleges from "./pages/admin/Colleges";
import AdminJobs from "./pages/admin/Jobs";
import AdminUsers from "./pages/admin/Users";
import AdminAnalytics from "./pages/admin/Analytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* Student Routes */}
          <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute allowedRoles={["student"]}><StudentProfile /></ProtectedRoute>} />
          <Route path="/student/resume" element={<ProtectedRoute allowedRoles={["student"]}><ResumeBuilder /></ProtectedRoute>} />
          <Route path="/student/linkedin" element={<ProtectedRoute allowedRoles={["student"]}><LinkedInAnalysis /></ProtectedRoute>} />
          <Route path="/student/jobs" element={<ProtectedRoute allowedRoles={["student"]}><JobBoard /></ProtectedRoute>} />
          <Route path="/student/career-report" element={<ProtectedRoute allowedRoles={["student"]}><CareerReport /></ProtectedRoute>} />
          <Route path="/student/applications" element={<ProtectedRoute allowedRoles={["student"]}><StudentApplications /></ProtectedRoute>} />
          <Route path="/student/skills" element={<ProtectedRoute allowedRoles={["student"]}><SkillPath /></ProtectedRoute>} />
          <Route path="/student/events" element={<ProtectedRoute allowedRoles={["student"]}><StudentEvents /></ProtectedRoute>} />
          <Route path="/student/leaderboard" element={<ProtectedRoute allowedRoles={["student"]}><Leaderboard /></ProtectedRoute>} />
          
          {/* Alumni Routes */}
          <Route path="/alumni/dashboard" element={<ProtectedRoute allowedRoles={["alumni"]}><AlumniDashboard /></ProtectedRoute>} />
          <Route path="/alumni/post-job" element={<ProtectedRoute allowedRoles={["alumni"]}><PostJob /></ProtectedRoute>} />
          <Route path="/alumni/jobs" element={<ProtectedRoute allowedRoles={["alumni"]}><AlumniJobs /></ProtectedRoute>} />
          <Route path="/alumni/applications" element={<ProtectedRoute allowedRoles={["alumni"]}><AlumniApplications /></ProtectedRoute>} />
          <Route path="/alumni/candidates" element={<ProtectedRoute allowedRoles={["alumni"]}><Candidates /></ProtectedRoute>} />
          
          {/* College Routes */}
          <Route path="/college/dashboard" element={<ProtectedRoute allowedRoles={["college"]}><CollegeDashboard /></ProtectedRoute>} />
          <Route path="/college/students" element={<ProtectedRoute allowedRoles={["college"]}><Students /></ProtectedRoute>} />
          <Route path="/college/drives" element={<ProtectedRoute allowedRoles={["college"]}><PlacementDrives /></ProtectedRoute>} />
          <Route path="/college/events" element={<ProtectedRoute allowedRoles={["college"]}><CollegeEvents /></ProtectedRoute>} />
          <Route path="/college/analytics" element={<ProtectedRoute allowedRoles={["college"]}><Analytics /></ProtectedRoute>} />
          <Route path="/college/approvals" element={<ProtectedRoute allowedRoles={["college"]}><JobApprovals /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/colleges" element={<ProtectedRoute allowedRoles={["admin"]}><AdminColleges /></ProtectedRoute>} />
          <Route path="/admin/jobs" element={<ProtectedRoute allowedRoles={["admin"]}><AdminJobs /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAnalytics /></ProtectedRoute>} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
