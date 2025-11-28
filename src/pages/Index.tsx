import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowRight, Zap, Star, Target, TrendingUp, Users, Briefcase, GraduationCap, Sparkles, Brain, Rocket, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const Index = () => {
  const { user, getDashboardPath, userRole } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  const getDashboardLink = () => {
    if (!userRole) return "/auth";
    return getDashboardPath(userRole);
  };

  const features = [
    {
      icon: Brain,
      title: "Neural Resume Intelligence",
      description: "Advanced machine learning algorithms analyze your resume with precision, providing real-time ATS compatibility scores and intelligent optimization recommendations.",
      gradient: "from-blue-500/10 via-cyan-500/10 to-green-500/10",
      tech: "Powered by GPT-4 & Deep Learning"
    },
    {
      icon: Target,
      title: "Quantum Job Matching",
      description: "Revolutionary AI-powered matching engine uses predictive analytics to connect you with opportunities aligned to your career trajectory and market demands.",
      gradient: "from-green-500/10 via-cyan-500/10 to-blue-500/10",
      tech: "Algorithmic Precision Engine"
    },
    {
      icon: TrendingUp,
      title: "Adaptive Career Pathways",
      description: "Personalized skill development ecosystem leveraging real-time industry data, AI-driven insights, and adaptive learning algorithms to accelerate your growth.",
      gradient: "from-blue-500/10 via-purple-500/10 to-green-500/10",
      tech: "Dynamic Learning Matrix"
    },
    {
      icon: Rocket,
      title: "Performance Acceleration",
      description: "Streamlined workflow automation with intelligent candidate tracking, real-time notifications, and predictive placement analytics for maximum efficiency.",
      gradient: "from-green-500/10 via-blue-500/10 to-cyan-500/10",
      tech: "Automation Stack v2.0"
    },
    {
      icon: Shield,
      title: "Enterprise Security Protocol",
      description: "Military-grade encryption, SOC 2 compliance, and zero-trust architecture ensuring your data remains protected with industry-leading security standards.",
      gradient: "from-blue-500/10 via-indigo-500/10 to-green-500/10",
      tech: "Security First Architecture"
    },
    {
      icon: Sparkles,
      title: "Intelligent Analytics Dashboard",
      description: "Real-time insights, predictive modeling, and comprehensive analytics powered by advanced data science to drive strategic career and placement decisions.",
      gradient: "from-green-500/10 via-cyan-500/10 to-blue-500/10",
      tech: "Advanced Data Intelligence"
    }
  ];

  const stats = [
    { label: "Active Users", value: "10K+", icon: Users, color: "text-[#0066FF]", subtitle: "Growing Daily" },
    { label: "Job Opportunities", value: "5K+", icon: Briefcase, color: "text-[#0066FF]", subtitle: "Live Listings" },
    { label: "Enterprise Partners", value: "500+", icon: Briefcase, color: "text-[#0066FF]", subtitle: "Trusted Companies" },
    { label: "Academic Institutions", value: "150+", icon: GraduationCap, color: "text-[#0066FF]", subtitle: "Global Network" }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Computer Science Graduate",
      content: "The AI-powered resume analysis increased my ATS score from 45% to 92%. The precision and insights are remarkable—truly transformative.",
      avatar: "SC",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Placement Director",
      content: "Our analytics dashboard provides unprecedented visibility into student readiness and market dynamics. The predictive modeling is exceptional.",
      avatar: "MR",
      rating: 5
    },
    {
      name: "Emily Johnson",
      role: "Startup Founder & CEO",
      content: "The intelligent matching algorithm connected us with candidates whose profiles perfectly aligned with our requirements. Outstanding platform.",
      avatar: "EJ",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col overflow-hidden">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section - Enhanced with Animations */}
        <section id="hero" ref={heroRef} className="relative overflow-hidden pt-4 pb-16 px-4 min-h-[85vh] flex items-center">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/40 to-green-50/40">
            <motion.div
              className="absolute inset-0 opacity-30"
              animate={{
                background: [
                  "radial-gradient(circle at 20% 50%, rgba(0,102,255,0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 50%, rgba(6,182,212,0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 50% 80%, rgba(202,255,0,0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 20% 50%, rgba(0,102,255,0.1) 0%, transparent 50%)",
                ]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {/* Floating Orbs */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gradient-to-br from-blue-400/20 to-green-400/20 blur-3xl"
              style={{
                width: Math.random() * 300 + 100,
                height: Math.random() * 300 + 100,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.random() * 20 - 10, 0],
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut",
              }}
            />
          ))}

          <div className="container mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
              className="text-center max-w-5xl mx-auto flex flex-col items-center justify-center"
            >
              {/* Logo with Pulse Animation */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
                className="flex justify-center items-center mb-6 relative"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-green-400/20 rounded-full blur-2xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <img
                  src="https://iili.io/fqdZCfn.png"
                  alt="Alignr Logo"
                  className="h-40 md:h-52 lg:h-64 xl:h-72 w-auto drop-shadow-2xl relative z-10"
                />
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight mb-4"
              >
                <span className="bg-gradient-to-r from-gray-900 via-blue-600 to-gray-900 bg-clip-text text-transparent">
                  AI-Powered Career Development
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#0066FF] via-[#06B6D4] to-[#CAFF00] bg-clip-text text-transparent">
                  & Placement Ecosystem
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-2"
              >
                Connect students with opportunities, empower colleges with insights, and help employers find the perfect talent
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-sm md:text-base text-[#0066FF] font-semibold mb-8"
              >
                ✨ Powered by Advanced Machine Learning & Neural Networks
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                {user ? (
                  <Link to={getDashboardLink()}>
                    <Button size="lg" className="bg-gradient-to-r from-[#CAFF00] to-[#B8E600] hover:from-[#B8E600] hover:to-[#CAFF00] text-gray-900 px-8 py-6 text-lg font-semibold rounded-full hover:scale-105 transition-all shadow-xl hover:shadow-2xl">
                      Access Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button size="lg" className="bg-gradient-to-r from-[#CAFF00] to-[#B8E600] hover:from-[#B8E600] hover:to-[#CAFF00] text-gray-900 px-8 py-6 text-lg font-semibold rounded-full transition-all shadow-xl hover:shadow-2xl">
                          Get Started as Student <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </motion.div>
                    </Link>
                    <Link to="/auth">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button size="lg" variant="outline" className="border-2 border-[#0066FF] text-[#0066FF] bg-white/80 backdrop-blur-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 px-8 py-6 text-lg font-semibold rounded-full transition-all shadow-lg hover:shadow-xl">
                          Post Jobs
                        </Button>
                      </motion.div>
                    </Link>
                    <Link to="/auth">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button size="lg" variant="outline" className="border-2 border-[#CAFF00] text-[#0066FF] bg-white/80 backdrop-blur-sm hover:bg-gradient-to-r hover:from-green-50 hover:to-yellow-50 px-8 py-6 text-lg font-semibold rounded-full transition-all shadow-lg hover:shadow-xl">
                          For Colleges
                        </Button>
                      </motion.div>
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section - Enhanced */}
        <section id="features" className="py-24 px-4 relative scroll-mt-20 bg-white overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #0066FF 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }} />
          </div>

          <div className="container mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-green-100 text-[#0066FF] text-sm font-semibold mb-4"
              >
                🚀 CUTTING-EDGE TECHNOLOGY
              </motion.span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4">
                <span className="bg-gradient-to-r from-gray-900 via-[#0066FF] to-gray-900 bg-clip-text text-transparent">
                  Advanced Features
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-gray-600">Enterprise-grade solutions powered by next-generation AI</p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group"
                >
                  <Card className="h-full border border-gray-200/50 hover:border-[#0066FF]/50 transition-all bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl relative overflow-hidden">
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    
                    <CardHeader className="relative z-10">
                      <motion.div
                        className="h-16 w-16 rounded-xl bg-gradient-to-br from-[#0066FF]/20 via-[#06B6D4]/20 to-[#CAFF00]/20 flex items-center justify-center mb-4 border border-[#0066FF]/20 group-hover:scale-110 transition-transform"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <feature.icon className="h-8 w-8 text-[#0066FF] group-hover:text-[#0066FF]" />
                      </motion.div>
                      <CardTitle className="text-xl text-gray-900 group-hover:text-[#0066FF] transition-colors">{feature.title}</CardTitle>
                      <p className="text-xs text-[#0066FF] font-semibold mt-1">{feature.tech}</p>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <CardDescription className="text-gray-600 leading-relaxed text-base">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section - Enhanced */}
        <section className="py-24 px-4 bg-gradient-to-br from-blue-50/50 via-white to-green-50/50 relative overflow-hidden">
          {/* Animated Grid Background */}
          <div className="absolute inset-0 opacity-[0.02]">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(#0066FF 1px, transparent 1px), linear-gradient(90deg, #0066FF 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }} />
          </div>

          <div className="container mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-[#0066FF] via-[#06B6D4] to-[#CAFF00] bg-clip-text text-transparent">
                  Platform Metrics
                </span>
              </h2>
              <p className="text-xl text-gray-600">Real-time performance indicators</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.1, y: -5 }}
                  className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200/50 hover:border-[#0066FF]/50 shadow-lg hover:shadow-xl transition-all"
                >
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <stat.icon className="h-12 w-12 text-[#0066FF] mx-auto mb-4" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-[#0066FF] to-[#06B6D4] bg-clip-text text-transparent"
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-gray-700 font-semibold text-lg">{stat.label}</div>
                  <div className="text-sm text-gray-500 mt-1">{stat.subtitle}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section - Enhanced */}
        <section id="testimonials" className="py-24 px-4 scroll-mt-20 bg-white relative overflow-hidden">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-gray-900 via-[#0066FF] to-gray-900 bg-clip-text text-transparent">
                  Trusted by Industry Leaders
                </span>
              </h2>
              <p className="text-xl text-gray-600">See what our users are saying about the platform</p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40, rotateX: -15 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <Card className="h-full border border-gray-200/50 hover:border-[#0066FF]/50 transition-all bg-gradient-to-br from-white to-blue-50/30 shadow-xl hover:shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#0066FF]/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <CardHeader className="relative z-10">
                      <div className="flex items-center gap-3 mb-3">
                        <motion.div
                          className="h-14 w-14 rounded-full bg-gradient-to-br from-[#CAFF00] to-[#B8E600] flex items-center justify-center text-gray-900 font-bold text-lg shadow-lg"
                          whileHover={{ scale: 1.1, rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          {testimonial.avatar}
                        </motion.div>
                        <div>
                          <CardTitle className="text-lg text-gray-900">{testimonial.name}</CardTitle>
                          <CardDescription className="text-[#0066FF] font-semibold">{testimonial.role}</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-[#CAFF00] text-[#CAFF00]" />
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <p className="text-gray-700 italic leading-relaxed text-base">"{testimonial.content}"</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Enhanced */}
        <section className="py-24 px-4 bg-gradient-to-br from-blue-50/50 via-white to-green-50/50 relative overflow-hidden">
          {/* Animated Background Elements */}
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{
              background: [
                "radial-gradient(circle at 0% 0%, rgba(0,102,255,0.1) 0%, transparent 50%)",
                "radial-gradient(circle at 100% 100%, rgba(6,182,212,0.1) 0%, transparent 50%)",
                "radial-gradient(circle at 50% 50%, rgba(202,255,0,0.1) 0%, transparent 50%)",
                "radial-gradient(circle at 0% 0%, rgba(0,102,255,0.1) 0%, transparent 50%)",
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />

          <div className="container mx-auto max-w-4xl relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-12 md:p-16 text-center border border-gray-200/50 shadow-2xl relative overflow-hidden"
            >
              {/* Gradient Border Effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#0066FF]/20 via-[#06B6D4]/20 to-[#CAFF00]/20 opacity-0 hover:opacity-100 transition-opacity duration-500 blur-xl" />
              
              <div className="relative z-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-6"
                >
                  <Zap className="h-16 w-16 text-[#0066FF] mx-auto" />
                </motion.div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-gray-900 via-[#0066FF] to-gray-900 bg-clip-text text-transparent">
                    Ready to Transform
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-[#0066FF] via-[#06B6D4] to-[#CAFF00] bg-clip-text text-transparent">
                    Your Career?
                  </span>
                </h2>
                <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto">
                  Join thousands of students, colleges, and employers leveraging cutting-edge AI technology to accelerate career growth
                </p>
                {!user && (
                  <Link to="/auth">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button size="lg" className="bg-gradient-to-r from-[#CAFF00] to-[#B8E600] hover:from-[#B8E600] hover:to-[#CAFF00] text-gray-900 px-12 py-7 text-xl font-semibold rounded-full transition-all shadow-2xl hover:shadow-[0_0_40px_rgba(202,255,0,0.5)]">
                        Get Started Free <ArrowRight className="ml-2 h-6 w-6" />
                      </Button>
                    </motion.div>
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
