import { Link } from "react-router-dom";
import { Github, Linkedin, Mail, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center">
              <img
                src="https://iili.io/fqdZCfn.png"
                alt="Alignr Logo"
                className="h-14 w-auto"
              />
            </div>
            <p className="text-sm text-gray-600">
              AI-powered career development and placement ecosystem connecting students, colleges, and employers.
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-[#0066FF] transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-[#0066FF] transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="mailto:support@alignr.com"
                className="text-gray-600 hover:text-[#0066FF] transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* For Students */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">For Students</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link to="/auth" className="hover:text-[#0066FF] transition-colors">
                  Get Started
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-[#0066FF] transition-colors">
                  Resume Builder
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-[#0066FF] transition-colors">
                  Job Board
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-[#0066FF] transition-colors">
                  Skill Development
                </Link>
              </li>
            </ul>
          </div>

          {/* For Colleges */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">For Colleges</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link to="/auth" className="hover:text-[#0066FF] transition-colors">
                  Placement Management
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-[#0066FF] transition-colors">
                  Student Analytics
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-[#0066FF] transition-colors">
                  Drive Management
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-[#0066FF] transition-colors">
                  Request Demo
                </Link>
              </li>
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">For Employers</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link to="/auth" className="hover:text-[#0066FF] transition-colors">
                  Post Jobs
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-[#0066FF] transition-colors">
                  Find Talent
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-[#0066FF] transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#0066FF] transition-colors">
                  Contact Sales
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              © {new Date().getFullYear()} Alignr. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <Link to="/terms" className="hover:text-[#0066FF] transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="hover:text-[#0066FF] transition-colors">
                Privacy Policy
              </Link>
              <Link to="/contact" className="hover:text-[#0066FF] transition-colors">
                Contact
              </Link>
              <a
                href="https://tech.cuephoria.in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#0066FF] transition-colors group"
              >
                <span>Developed by</span>
                <span className="font-semibold text-gray-900 group-hover:text-[#0066FF]">
                  Cuephoria Tech
                </span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

