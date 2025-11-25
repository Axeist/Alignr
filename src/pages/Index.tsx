import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  GraduationCap, 
  Building2, 
  Users, 
  Sparkles, 
  TrendingUp, 
  Target,
  Briefcase,
  Award,
  ArrowRight,
  CheckCircle2,
  Zap,
  Brain,
  Rocket
} from "lucide-react";

const Index = () => {
  const { user, userRole, getDashboardPath } = useAuth();

  const getDashboardLink = () => {
    if (!user || !userRole) return "/auth";
    return getDashboardPath(userRole);
  };

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Resume Analysis",
      description: "Get instant ATS scores and personalized improvement suggestions powered by Google Gemini AI",
      gradient: "from-purple-500/20 to-pink-500/20"
    },
    {
      icon: Target,
      title: "Smart Job Matching",
      description: "AI matches you with opportunities based on your skills, preferences, and career goals",
      gradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
      icon: TrendingUp,
      title: "Skill Gap Analysis",
      description: "Identify missing skills and get personalized learning paths to bridge the gap",
      gradient: "from-green-500/20 to-emerald-500/20"
    },
    {
      icon: Award,
      title: "Career Score Tracking",
      description: "Track your career readiness with gamified scoring and milestone achievements",
      gradient: "from-yellow-500/20 to-orange-500/20"
    },
    {
      icon: Brain,
      title: "LinkedIn Optimization",
      description: "Enhance your LinkedIn profile with AI-driven insights and recommendations",
      gradient: "from-indigo-500/20 to-purple-500/20"
    },
    {
      icon: Rocket,
      title: "Career Roadmaps",
      description: "Get personalized 30/60/90-day action plans to accelerate your career growth",
      gradient: "from-pink-500/20 to-rose-500/20"
    }
  ];

  const stats = [
    { label: "Students Helped", value: "10,000+", icon: Users, color: "text-[#CAFF00]" },
    { label: "Jobs Posted", value: "5,000+", icon: Briefcase, color: "text-[#CAFF00]" },
    { label: "Offers Received", value: "2,500+", icon: Award, color: "text-[#CAFF00]" },
    { label: "Colleges", value: "150+", icon: GraduationCap, color: "text-[#CAFF00]" }
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
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section id="hero" className="relative overflow-hidden pt-12 pb-32 px-4">
          <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/20 via-transparent to-[#CAFF00]/10 blur-3xl" />
          <div className="container mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-8 max-w-5xl mx-auto"
            >
              {/* Logo in Hero */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex justify-center mb-8"
              >
                <img
                  src="https://iili.io/fqdZCfn.png"
                  alt="Alignr Logo"
                  className="h-24 md:h-32 w-auto"
                />
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-bold font-poppins">
                <span className="bg-gradient-to-r from-[#CAFF00] via-[#FFFF00] to-[#CAFF00] bg-clip-text text-transparent">
                  Alignr
                </span>
              </h1>
              <p className="text-2xl md:text-4xl text-gray-300 font-light">
                AI-Powered Career Development & Placement Ecosystem
              </p>
              <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Connect students with opportunities, empower colleges with insights, and help employers find the perfect talent—all powered by intelligent AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                {user ? (
                  <Link to={getDashboardLink()}>
                    <Button size="lg" className="gradient-accent text-black px-8 py-6 text-lg font-semibold glow-neon hover:scale-105 transition-transform">
                      Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth">
                      <Button size="lg" className="gradient-accent text-black px-8 py-6 text-lg font-semibold glow-neon hover:scale-105 transition-transform">
                        Get Started as Student
                      </Button>
                    </Link>
                    <Link to="/auth">
                      <Button size="lg" variant="outline" className="glass border-[#CAFF00]/50 text-[#CAFF00] px-8 py-6 text-lg hover:bg-[#CAFF00]/10 hover:border-[#CAFF00]">
                        Post Jobs
                      </Button>
                    </Link>
                    <Link to="/auth">
                      <Button size="lg" variant="outline" className="glass border-cyan-500/50 text-cyan-400 px-8 py-6 text-lg hover:bg-cyan-500/10 hover:border-cyan-500">
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
        <section id="features" className="py-20 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#CAFF00]/5 to-transparent" />
          <div className="container mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-[#CAFF00] to-[#FFFF00] bg-clip-text text-transparent">
                  Powerful Features
                </span>
              </h2>
              <p className="text-xl text-gray-400">Everything you need to build your career</p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className={`glass-hover h-full border-[#CAFF00]/20 hover:border-[#CAFF00]/40 transition-all ${feature.gradient} bg-gradient-to-br`}>
                    <CardHeader>
                      <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-[#CAFF00]/20 to-[#FFFF00]/20 flex items-center justify-center mb-4">
                        <feature.icon className="h-7 w-7 text-[#CAFF00]" />
                      </div>
                      <CardTitle className="text-xl text-white">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-300 leading-relaxed">
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
        <section className="py-20 px-4 bg-gradient-to-r from-[#6366F1]/10 via-[#CAFF00]/5 to-[#06B6D4]/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(202,255,0,0.1),transparent_50%)]" />
          <div className="container mx-auto relative z-10">
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
                  <stat.icon className={`h-12 w-12 ${stat.color} mx-auto mb-4`} />
                  <div className={`text-4xl md:text-5xl font-bold mb-2 ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 px-4">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-[#CAFF00] to-[#FFFF00] bg-clip-text text-transparent">
                  What People Say
                </span>
              </h2>
              <p className="text-xl text-gray-400">Trusted by students, colleges, and employers</p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="glass-hover h-full border-[#CAFF00]/20 hover:border-[#CAFF00]/40 transition-all">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#CAFF00] to-[#FFFF00] flex items-center justify-center text-black font-bold">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <CardTitle className="text-lg text-white">{testimonial.name}</CardTitle>
                          <CardDescription className="text-[#CAFF00]">{testimonial.role}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 italic leading-relaxed">"{testimonial.content}"</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass rounded-3xl p-12 md:p-16 text-center border-2 border-[#CAFF00]/30 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#CAFF00]/10 via-transparent to-[#6366F1]/10" />
              <div className="relative z-10">
                <Zap className="h-16 w-16 text-[#CAFF00] mx-auto mb-6" />
                <h2 className="text-4xl md:text-6xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-[#CAFF00] to-[#FFFF00] bg-clip-text text-transparent">
                    Ready to Transform Your Career?
                  </span>
                </h2>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  Join thousands of students, colleges, and employers already using Alignr to accelerate career growth
                </p>
                {!user && (
                  <Link to="/auth">
                    <Button size="lg" className="gradient-accent text-black px-12 py-6 text-lg font-semibold glow-neon hover:scale-105 transition-transform">
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
