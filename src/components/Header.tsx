import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, LogOut, User } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const { user, signOut, getDashboardPath, userRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Features", href: "#features", scroll: true },
    { label: "Testimonials", href: "#testimonials", scroll: true },
  ];

  const handleNavClick = (href: string, scroll?: boolean) => {
    if (scroll && href.startsWith("#")) {
      const element = document.getElementById(href.substring(1));
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }}
      className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl shadow-sm"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-20 md:h-24 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <motion.img
              src="https://iili.io/fqdZCfn.png"
              alt="Alignr Logo"
              className="h-20 md:h-24 w-auto transition-transform"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                {item.scroll ? (
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.href, true);
                    }}
                    className="text-sm font-medium text-gray-700 hover:text-[#0066FF] transition-colors duration-300 relative group"
                  >
                    {item.label}
                    <motion.span
                      className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0066FF] group-hover:w-full transition-all duration-300"
                      initial={false}
                    />
                  </a>
                ) : (
                  <Link
                    to={item.href}
                    className="text-sm font-medium text-gray-700 hover:text-[#0066FF] transition-colors duration-300 relative group"
                  >
                    {item.label}
                    <motion.span
                      className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0066FF] group-hover:w-full transition-all duration-300"
                      initial={false}
                    />
                  </Link>
                )}
              </motion.div>
            ))}
            {!user ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-4"
              >
                <Link to="/auth">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" className="text-gray-700 hover:text-gray-900 font-medium">
                      Sign In
                    </Button>
                  </motion.div>
                </Link>
                <Link to="/auth">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button className="bg-gradient-to-r from-[#CAFF00] to-[#B8E600] hover:from-[#B8E600] hover:to-[#CAFF00] text-gray-900 font-semibold rounded-full px-6 shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                      Get Started
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-4"
              >
                <Link to={getDashboardPath(userRole || "student")}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" className="text-gray-700 hover:text-gray-900 font-medium">
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </motion.div>
                </Link>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="text-gray-700 hover:text-gray-900 font-medium"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-6 w-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-6 w-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.6, -0.05, 0.01, 0.99] }}
              className="md:hidden border-t border-gray-200/60 py-4 space-y-3 bg-white/95 backdrop-blur-xl"
            >
              {navItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {item.scroll ? (
                    <a
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        setMobileMenuOpen(false);
                        handleNavClick(item.href, true);
                      }}
                      className="block text-sm font-medium text-gray-700 hover:text-[#0066FF] transition-colors duration-300 py-2"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm font-medium text-gray-700 hover:text-[#0066FF] transition-colors duration-300 py-2"
                    >
                      {item.label}
                    </Link>
                  )}
                </motion.div>
              ))}
              {!user ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col gap-3 pt-4 border-t border-gray-200/60"
                >
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="ghost" className="w-full text-gray-700 font-medium">
                        Sign In
                      </Button>
                    </motion.div>
                  </Link>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button className="w-full bg-gradient-to-r from-[#CAFF00] to-[#B8E600] hover:from-[#B8E600] hover:to-[#CAFF00] text-gray-900 font-semibold rounded-full shadow-lg">
                        Get Started
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col gap-3 pt-4 border-t border-gray-200/60"
                >
                  <Link
                    to={getDashboardPath(userRole || "student")}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="ghost" className="w-full text-gray-700 font-medium">
                        <User className="h-4 w-4 mr-2" />
                        Dashboard
                      </Button>
                    </motion.div>
                  </Link>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-gray-700 font-medium"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
