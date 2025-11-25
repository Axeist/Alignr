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
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <motion.img
              src="https://iili.io/fqdZCfn.png"
              alt="Alignr Logo"
              className="h-14 w-auto transition-transform group-hover:scale-105"
              whileHover={{ scale: 1.05 }}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-sm font-medium text-gray-700 hover:text-[#0066FF] transition-colors"
            >
              Home
            </Link>
            <Link
              to="/auth"
              className="text-sm font-medium text-[#0066FF] hover:text-[#0052CC] transition-colors"
            >
              Careers
            </Link>
            <Link
              to="/auth"
              className="text-sm font-medium text-[#0066FF] hover:text-[#0052CC] transition-colors"
            >
              Alumni
            </Link>
            {!user ? (
              <div className="flex items-center gap-4">
                <Link to="/auth">
                  <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="bg-[#CAFF00] hover:bg-[#B8E600] text-gray-900 font-semibold rounded-full">
                    Contact
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to={getDashboardPath(userRole || "student")}>
                  <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-gray-900"
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
            className="md:hidden text-gray-700"
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
            className="md:hidden border-t border-gray-200 py-4 space-y-4 bg-white"
          >
            <Link
              to="/"
              className="block text-sm font-medium text-gray-700 hover:text-[#0066FF] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/auth"
              className="block text-sm font-medium text-[#0066FF] hover:text-[#0052CC] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Careers
            </Link>
            <Link
              to="/auth"
              className="block text-sm font-medium text-[#0066FF] hover:text-[#0052CC] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Alumni
            </Link>
            {!user ? (
              <div className="flex flex-col gap-2 pt-4">
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full text-gray-700">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-[#CAFF00] hover:bg-[#B8E600] text-gray-900 font-semibold rounded-full">
                    Contact
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-4">
                <Link
                  to={getDashboardPath(userRole || "student")}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full text-gray-700">
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
                  className="w-full text-gray-700"
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

