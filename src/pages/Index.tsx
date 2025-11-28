import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowRight, Zap, Star, Target, TrendingUp, Users, Briefcase, GraduationCap, Sparkles, Brain, Rocket, Shield, CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const Index = () => {
  const { user, getDashboardPath, userRole } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const y = useTransform(smoothProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(smoothProgress, [0, 0.5, 1], [1, 0.8, 0.3]);

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
      tech: "Powered by GPT-4 & Deep Learning",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Target,
      title: "Quantum Job Matching",
      description: "Revolutionary AI-powered matching engine uses predictive analytics to connect you with opportunities aligned to your career trajectory and market demands.",
      gradient: "from-green-500/10 via-cyan-500/10 to-blue-500/10",
      tech: "Algorithmic Precision Engine",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: TrendingUp,
      title: "Adaptive Career Pathways",
      description: "Personalized skill development ecosystem leveraging real-time industry data, AI-driven insights, and adaptive learning algorithms to accelerate your growth.",
      gradient: "from-blue-500/10 via-purple-500/10 to-green-500/10",
      tech: "Dynamic Learning Matrix",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Rocket,
      title: "Performance Acceleration",
      description: "Streamlined workflow automation with intelligent candidate tracking, real-time notifications, and predictive placement analytics for maximum efficiency.",
      gradient: "from-green-500/10 via-blue-500/10 to-cyan-500/10",
      tech: "Automation Stack v2.0",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Shield,
      title: "Enterprise Security Protocol",
      description: "Military-grade encryption, SOC 2 compliance, and zero-trust architecture ensuring your data remains protected with industry-leading security standards.",
      gradient: "from-blue-500/10 via-indigo-500/10 to-green-500/10",
      tech: "Security First Architecture",
      color: "from-indigo-500 to-blue-500"
    },
    {
      icon: Sparkles,
      title: "Intelligent Analytics Dashboard",
      description: "Real-time insights, predictive modeling, and comprehensive analytics powered by advanced data science to drive strategic career and placement decisions.",
      gradient: "from-green-500/10 via-cyan-500/10 to-blue-500/10",
      tech: "Advanced Data Intelligence",
      color: "from-cyan-500 to-teal-500"
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.6, -0.05, 0.01, 0.99]
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col overflow-x-hidden">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section - Premium Apple-like Design */}
        <section id="hero" ref={heroRef} className="relative overflow-hidden pt-20 pb-32 px-4 min-h-[90vh] flex items-center">
          {/* Animated Gradient Background - Ultra Smooth */}
          <motion.div
            className="absolute inset-0"
            style={{ y, opacity }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-green-50/20" />
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  "radial-gradient(circle at 20% 50%, rgba(0,102,255,0.08) 0%, transparent 60%)",
                  "radial-gradient(circle at 80% 50%, rgba(6,182,212,0.08) 0%, transparent 60%)",
                  "radial-gradient(circle at 50% 80%, rgba(202,255,0,0.06) 0%, transparent 60%)",
                  "radial-gradient(circle at 20% 50%, rgba(0,102,255,0.08) 0%, transparent 60%)",
                ]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>

          {/* Floating Orbs - Premium Glass Effect */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full backdrop-blur-2xl"
              style={{
                width: Math.random() * 400 + 150,
                height: Math.random() * 400 + 150,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: `linear-gradient(135deg, rgba(0,102,255,${0.05 + Math.random() * 0.1}), rgba(202,255,0,${0.05 + Math.random() * 0.1}))`,
                filter: 'blur(60px)',
              }}
              animate={{
                y: [0, -40, 0],
                x: [0, Math.random() * 30 - 15, 0],
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 6 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut",
              }}
            />
          ))}

          <div className="container mx-auto relative z-10 max-w-7xl">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center max-w-6xl mx-auto flex flex-col items-center justify-center"
            >
              {/* Logo with Premium Animation */}
              <motion.div
                variants={itemVariants}
                className="flex justify-center items-center mb-8 relative"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400/30 via-cyan-400/30 to-green-400/30 rounded-full blur-3xl"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.4, 0.7, 0.4],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.img
                  src="https://iili.io/fqdZCfn.png"
                  alt="Alignr Logo"
                  className="h-32 md:h-44 lg:h-56 xl:h-64 w-auto drop-shadow-2xl relative z-10"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, type: "spring", stiffness: 100, damping: 15 }}
                  whileHover={{ scale: 1.05 }}
                />
              </motion.div>
              
              <motion.h1
                variants={itemVariants}
                className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 leading-[1.1] mb-6 tracking-tight"
              >
                <span className="block bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  AI-Powered Career
                </span>
                <span className="block bg-gradient-to-r from-[#0066FF] via-[#06B6D4] to-[#CAFF00] bg-clip-text text-transparent mt-2">
                  Development Platform
                </span>
              </motion.h1>
              
              <motion.p
                variants={itemVariants}
                className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-4 font-light"
              >
                Connect students with opportunities, empower colleges with insights, and help employers find the perfect talent
              </motion.p>
              
              <motion.p
                variants={itemVariants}
                className="text-sm md:text-base text-[#0066FF] font-medium mb-12 tracking-wide uppercase"
              >
                ✨ Powered by Advanced Machine Learning & Neural Networks
              </motion.p>
              
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                {user ? (
                  <Link to={getDashboardLink()}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        size="lg" 
                        className="bg-gradient-to-r from-[#CAFF00] to-[#B8E600] hover:from-[#B8E600] hover:to-[#CAFF00] text-gray-900 px-10 py-7 text-lg font-semibold rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl border-0"
                      >
                        Access Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </motion.div>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          size="lg" 
                          className="bg-gradient-to-r from-[#CAFF00] to-[#B8E600] hover:from-[#B8E600] hover:to-[#CAFF00] text-gray-900 px-10 py-7 text-lg font-semibold rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl border-0"
                        >
                          Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </motion.div>
                    </Link>
                    <Link to="/auth">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          size="lg" 
                          variant="outline" 
                          className="border-2 border-gray-300 text-gray-700 bg-white/80 backdrop-blur-xl hover:bg-white hover:border-[#0066FF] hover:text-[#0066FF] px-10 py-7 text-lg font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          For Employers
                        </Button>
                      </motion.div>
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section - Premium Grid */}
        <section id="features" className="py-32 px-4 relative scroll-mt-20 bg-white overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-[0.02]">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, #0066FF 1px, transparent 0)`,
              backgroundSize: '60px 60px'
            }} />
          </div>

          <div className="container mx-auto relative z-10 max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
              className="text-center mb-24"
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-block px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-50 to-green-50 text-[#0066FF] text-sm font-semibold mb-6 tracking-wide"
              >
                🚀 CUTTING-EDGE TECHNOLOGY
              </motion.span>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
                <span className="bg-gradient-to-r from-gray-900 via-[#0066FF] to-gray-900 bg-clip-text text-transparent">
                  Advanced Features
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-gray-600 font-light">Enterprise-grade solutions powered by next-generation AI</p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.1,
                    ease: [0.6, -0.05, 0.01, 0.99]
                  }}
                  whileHover={{ y: -12, scale: 1.02 }}
                  className="group"
                >
                  <Card className="h-full border border-gray-200/60 hover:border-[#0066FF]/40 transition-all duration-500 bg-white/90 backdrop-blur-xl shadow-lg hover:shadow-2xl relative overflow-hidden">
                    {/* Gradient Overlay */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
                    />
                    
                    <CardHeader className="relative z-10 pb-4">
                      <motion.div
                        className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all duration-500`}
                        whileHover={{ rotate: [0, -5, 5, -5, 0], scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <feature.icon className="h-10 w-10 text-white" />
                      </motion.div>
                      <CardTitle className="text-2xl text-gray-900 group-hover:text-[#0066FF] transition-colors duration-300 mb-2 font-semibold">
                        {feature.title}
                      </CardTitle>
                      <p className="text-xs text-[#0066FF] font-semibold tracking-wide uppercase">
                        {feature.tech}
                      </p>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <CardDescription className="text-gray-600 leading-relaxed text-base font-light">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section - Premium Display */}
        <section className="py-32 px-4 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
          {/* Animated Grid Background */}
          <div className="absolute inset-0 opacity-[0.015]">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(#0066FF 1px, transparent 1px), linear-gradient(90deg, #0066FF 1px, transparent 1px)`,
              backgroundSize: '80px 80px'
            }} />
          </div>

          <div className="container mx-auto relative z-10 max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
                <span className="bg-gradient-to-r from-[#0066FF] via-[#06B6D4] to-[#CAFF00] bg-clip-text text-transparent">
                  Platform Metrics
                </span>
              </h2>
              <p className="text-xl text-gray-600 font-light">Real-time performance indicators</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.1,
                    ease: [0.6, -0.05, 0.01, 0.99]
                  }}
                  whileHover={{ scale: 1.05, y: -8 }}
                  className="text-center p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-gray-200/60 hover:border-[#0066FF]/40 shadow-lg hover:shadow-xl transition-all duration-500"
                >
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6"
                  >
                    <stat.icon className="h-14 w-14 text-[#0066FF] mx-auto" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-[#0066FF] to-[#06B6D4] bg-clip-text text-transparent tracking-tight"
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-gray-700 font-semibold text-lg mb-1">{stat.label}</div>
                  <div className="text-sm text-gray-500 font-light">{stat.subtitle}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section - Premium Cards */}
        <section id="testimonials" className="py-32 px-4 scroll-mt-20 bg-white relative overflow-hidden">
          <div className="container mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-24"
            >
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
                <span className="bg-gradient-to-r from-gray-900 via-[#0066FF] to-gray-900 bg-clip-text text-transparent">
                  Trusted by Industry Leaders
                </span>
              </h2>
              <p className="text-xl text-gray-600 font-light">See what our users are saying about the platform</p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50, rotateX: -10 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ 
                    duration: 0.7, 
                    delay: index * 0.15,
                    ease: [0.6, -0.05, 0.01, 0.99]
                  }}
                  whileHover={{ y: -12, scale: 1.02 }}
                >
                  <Card className="h-full border border-gray-200/60 hover:border-[#0066FF]/40 transition-all duration-500 bg-gradient-to-br from-white to-blue-50/20 shadow-xl hover:shadow-2xl relative overflow-hidden group backdrop-blur-xl">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#0066FF]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    <CardHeader className="relative z-10 pb-4">
                      <div className="flex items-center gap-4 mb-4">
                        <motion.div
                          className="h-16 w-16 rounded-full bg-gradient-to-br from-[#CAFF00] to-[#B8E600] flex items-center justify-center text-gray-900 font-bold text-xl shadow-lg"
                          whileHover={{ scale: 1.15, rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          {testimonial.avatar}
                        </motion.div>
                        <div>
                          <CardTitle className="text-xl text-gray-900 font-semibold">{testimonial.name}</CardTitle>
                          <CardDescription className="text-[#0066FF] font-medium">{testimonial.role}</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-[#CAFF00] text-[#CAFF00]" />
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <p className="text-gray-700 italic leading-relaxed text-base font-light">"{testimonial.content}"</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Premium Final */}
        <section className="py-32 px-4 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
          {/* Animated Background Elements */}
          <motion.div
            className="absolute inset-0 opacity-10"
            animate={{
              background: [
                "radial-gradient(circle at 0% 0%, rgba(0,102,255,0.15) 0%, transparent 50%)",
                "radial-gradient(circle at 100% 100%, rgba(6,182,212,0.15) 0%, transparent 50%)",
                "radial-gradient(circle at 50% 50%, rgba(202,255,0,0.1) 0%, transparent 50%)",
                "radial-gradient(circle at 0% 0%, rgba(0,102,255,0.15) 0%, transparent 50%)",
              ]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />

          <div className="container mx-auto max-w-5xl relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-white/90 backdrop-blur-2xl rounded-3xl p-12 md:p-20 text-center border border-gray-200/60 shadow-2xl relative overflow-hidden"
            >
              {/* Gradient Border Effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#0066FF]/10 via-[#06B6D4]/10 to-[#CAFF00]/10 opacity-0 hover:opacity-100 transition-opacity duration-700 blur-2xl" />
              
              <div className="relative z-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-8"
                >
                  <Zap className="h-20 w-20 text-[#0066FF]" />
                </motion.div>
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-tight">
                  <span className="bg-gradient-to-r from-gray-900 via-[#0066FF] to-gray-900 bg-clip-text text-transparent">
                    Ready to Transform
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-[#0066FF] via-[#06B6D4] to-[#CAFF00] bg-clip-text text-transparent">
                    Your Career?
                  </span>
                </h2>
                <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                  Join thousands of students, colleges, and employers leveraging cutting-edge AI technology to accelerate career growth
                </p>
                {!user && (
                  <Link to="/auth">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        size="lg" 
                        className="bg-gradient-to-r from-[#CAFF00] to-[#B8E600] hover:from-[#B8E600] hover:to-[#CAFF00] text-gray-900 px-14 py-8 text-xl font-semibold rounded-full transition-all duration-300 shadow-2xl hover:shadow-[0_0_50px_rgba(202,255,0,0.4)] border-0"
                      >
                        Get Started Free <ArrowRight className="ml-3 h-6 w-6" />
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
