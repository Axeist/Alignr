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
    <div className="min-h-screen bg-gradient-to-r from-gray-50 via-blue-50 to-blue-100 text-gray-900 flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section id="hero" className="relative overflow-hidden pt-20 pb-32 px-4">
          <div className="absolute inset-0 bg-gradient-to-r from-white via-blue-50 to-blue-200" />
          <div className="container mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-8 max-w-4xl mx-auto"
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
                  className="h-32 md:h-48 lg:h-56 w-auto"
                />
              </motion.div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                Connect Your Career Journey with Alumni Networks
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
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
                        Join Now
                      </Button>
                    </Link>
                    <Link to="/auth">
                      <Button size="lg" variant="outline" className="border-2 border-[#CAFF00] text-[#CAFF00] bg-transparent hover:bg-[#CAFF00]/10 px-8 py-6 text-lg font-semibold rounded-full hover:scale-105 transition-transform">
                        Explore Opportunities
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
        <section className="py-20 px-4 bg-blue-100">
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
                  <div className="text-gray-700">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 px-4 scroll-mt-20 bg-gradient-to-b from-white to-blue-50">
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
        <section className="py-20 px-4 bg-gradient-to-r from-white to-blue-50">
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
