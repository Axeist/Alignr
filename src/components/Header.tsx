import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, LogOut, User } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export function Header() {
  const { user, signOut, getDashboardPath, userRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0F172A]/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <motion.img
              src="https://iili.io/fqdZCfn.png"
              alt="Alignr Logo"
              className="h-12 w-auto transition-transform group-hover:scale-105"
              whileHover={{ scale: 1.05 }}
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-[#CAFF00] via-[#FFFF00] to-[#CAFF00] bg-clip-text text-transparent">
              Alignr
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-sm font-medium text-gray-300 hover:text-[#CAFF00] transition-colors"
            >
              Home
            </Link>
            <Link
              to="#features"
              className="text-sm font-medium text-gray-300 hover:text-[#CAFF00] transition-colors"
            >
              Features
            </Link>
            <Link
              to="#testimonials"
              className="text-sm font-medium text-gray-300 hover:text-[#CAFF00] transition-colors"
            >
              Testimonials
            </Link>
            {!user ? (
              <div className="flex items-center gap-4">
                <Link to="/auth">
                  <Button variant="ghost" className="text-gray-300 hover:text-white">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="gradient-accent text-black font-semibold glow-neon">
                    Get Started
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to={getDashboardPath(userRole || "student")}>
                  <Button variant="ghost" className="text-gray-300 hover:text-white">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="text-gray-300 hover:text-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 py-4 space-y-4"
          >
            <Link
              to="/"
              className="block text-sm font-medium text-gray-300 hover:text-[#CAFF00] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="#features"
              className="block text-sm font-medium text-gray-300 hover:text-[#CAFF00] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              to="#testimonials"
              className="block text-sm font-medium text-gray-300 hover:text-[#CAFF00] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Testimonials
            </Link>
            {!user ? (
              <div className="flex flex-col gap-2 pt-4">
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full text-gray-300">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full gradient-accent text-black font-semibold">
                    Get Started
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-4">
                <Link
                  to={getDashboardPath(userRole || "student")}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full text-gray-300">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-gray-300"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </header>
  );
}

