import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowRight, Zap, Star, Target, TrendingUp, Users, Briefcase, GraduationCap } from "lucide-react";

const Index = () => {
  const { user, getDashboardPath, userRole } = useAuth();

  const getDashboardLink = () => {
    if (!userRole) return "/auth";
    return getDashboardPath(userRole);
  };

  const features = [
    {
      icon: Star,
      title: "AI-Powered Resume Analysis",
      description: "Get instant feedback on your resume with AI-driven ATS scoring and optimization suggestions.",
      gradient: "from-blue-50 to-green-50"
    },
    {
      icon: Target,
      title: "Smart Job Matching",
      description: "Find the perfect opportunities that match your skills, experience, and career goals.",
      gradient: "from-green-50 to-blue-50"
    },
    {
      icon: TrendingUp,
      title: "Career Growth Path",
      description: "Personalized skill development roadmap based on industry trends and your aspirations.",
      gradient: "from-blue-50 to-green-50"
    }
  ];

  const stats = [
    { label: "Active Students", value: "10K+", icon: Users, color: "text-[#0066FF]" },
    { label: "Job Openings", value: "5K+", icon: Briefcase, color: "text-[#0066FF]" },
    { label: "Companies", value: "500+", icon: Briefcase, color: "text-[#0066FF]" },
    { label: "Colleges", value: "150+", icon: GraduationCap, color: "text-[#0066FF]" }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Computer Science Student",
      content: "Alignr helped me improve my resume score from 45 to 92! The AI suggestions were spot-on.",
      avatar: "SC"
    },
    {
      name: "Michael Rodriguez",
      role: "Placement Officer",
      content: "The analytics dashboard gives us incredible insights into student readiness and market trends.",
      avatar: "MR"
    },
    {
      name: "Emily Johnson",
      role: "Startup Founder",
      content: "We found our perfect candidate through Alignr's smart matching. The quality of profiles is outstanding.",
      avatar: "EJ"
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section id="hero" className="relative overflow-hidden pt-20 pb-32 px-4 bg-gradient-to-br from-white via-blue-50/30 to-green-50/30">
          <div className="container mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-8 max-w-5xl mx-auto"
            >
              {/* Logo in Hero - Bigger */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex justify-center mb-4"
              >
                <img
                  src="https://iili.io/fqdZCfn.png"
                  alt="Alignr Logo"
                  className="h-48 md:h-64 lg:h-80 xl:h-96 w-auto drop-shadow-lg"
                />
              </motion.div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                AI-Powered Career Development & Placement Ecosystem
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Connect students with opportunities, empower colleges with insights, and help employers find the perfect talent—all powered by intelligent AI.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                {user ? (
                  <Link to={getDashboardLink()}>
                    <Button size="lg" className="bg-[#CAFF00] hover:bg-[#B8E600] text-gray-900 px-8 py-6 text-lg font-semibold rounded-full hover:scale-105 transition-transform shadow-lg">
                      Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth">
                      <Button size="lg" className="bg-[#CAFF00] hover:bg-[#B8E600] text-gray-900 px-8 py-6 text-lg font-semibold rounded-full hover:scale-105 transition-transform shadow-lg">
                        Get Started as Student
                      </Button>
                    </Link>
                    <Link to="/auth">
                      <Button size="lg" variant="outline" className="border-2 border-[#0066FF] text-[#0066FF] bg-transparent hover:bg-[#0066FF]/10 px-8 py-6 text-lg font-semibold rounded-full hover:scale-105 transition-transform">
                        Post Jobs
                      </Button>
                    </Link>
                    <Link to="/auth">
                      <Button size="lg" variant="outline" className="border-2 border-[#CAFF00] text-[#0066FF] bg-transparent hover:bg-[#CAFF00]/10 px-8 py-6 text-lg font-semibold rounded-full hover:scale-105 transition-transform">
                        For Colleges
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 relative scroll-mt-20 bg-white">
          <div className="container mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-6xl font-bold mb-4 text-gray-900">
                Powerful Features
              </h2>
              <p className="text-xl text-gray-600">Everything you need to build your career</p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="h-full border border-gray-200 hover:border-[#0066FF]/50 transition-all bg-white shadow-md hover:shadow-xl">
                    <CardHeader>
                      <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-[#0066FF]/20 via-[#06B6D4]/20 to-[#CAFF00]/20 flex items-center justify-center mb-4">
                        <feature.icon className="h-7 w-7 text-[#0066FF]" />
                      </div>
                      <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-blue-50 to-green-50">
          <div className="container mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="h-12 w-12 text-[#0066FF] mx-auto mb-4" />
                  <div className="text-4xl md:text-5xl font-bold mb-2 text-[#0066FF]">
                    {stat.value}
                  </div>
                  <div className="text-gray-700 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 px-4 scroll-mt-20 bg-white">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-6xl font-bold mb-4 text-gray-900">
                What People Say
              </h2>
              <p className="text-xl text-gray-600">Trusted by students, colleges, and employers</p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="h-full border border-gray-200 hover:border-[#0066FF]/50 transition-all bg-white shadow-md hover:shadow-xl">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#CAFF00] to-[#B8E600] flex items-center justify-center text-gray-900 font-bold">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <CardTitle className="text-lg text-gray-900">{testimonial.name}</CardTitle>
                          <CardDescription className="text-[#0066FF]">{testimonial.role}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 italic leading-relaxed">"{testimonial.content}"</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-blue-50 to-green-50">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-3xl p-12 md:p-16 text-center border border-gray-200 shadow-xl relative overflow-hidden"
            >
              <div className="relative z-10">
                <Zap className="h-16 w-16 text-[#0066FF] mx-auto mb-6" />
                <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
                  Ready to Transform Your Career?
                </h2>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  Join thousands of students, colleges, and employers already using Alignr to accelerate career growth
                </p>
                {!user && (
                  <Link to="/auth">
                    <Button size="lg" className="bg-[#CAFF00] hover:bg-[#B8E600] text-gray-900 px-12 py-6 text-lg font-semibold rounded-full hover:scale-105 transition-transform shadow-lg">
                      Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
