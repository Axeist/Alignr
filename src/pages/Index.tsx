import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
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
  CheckCircle2
} from "lucide-react";

const Index = () => {
  const { user, userRole } = useAuth();

  const getDashboardLink = () => {
    if (!userRole) return "/auth";
    switch (userRole) {
      case "student":
        return "/student/dashboard";
      case "alumni":
        return "/alumni/dashboard";
      case "college":
        return "/college/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/auth";
    }
  };

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Resume Analysis",
      description: "Get instant ATS scores and personalized improvement suggestions powered by Google Gemini AI"
    },
    {
      icon: Target,
      title: "Smart Job Matching",
      description: "AI matches you with opportunities based on your skills, preferences, and career goals"
    },
    {
      icon: TrendingUp,
      title: "Skill Gap Analysis",
      description: "Identify missing skills and get personalized learning paths to bridge the gap"
    },
    {
      icon: Award,
      title: "Career Score Tracking",
      description: "Track your career readiness with gamified scoring and milestone achievements"
    }
  ];

  const stats = [
    { label: "Students Helped", value: "10,000+", icon: Users },
    { label: "Jobs Posted", value: "5,000+", icon: Briefcase },
    { label: "Offers Received", value: "2,500+", icon: Award },
    { label: "Colleges", value: "150+", icon: GraduationCap }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Computer Science Student",
      content: "Alignr helped me improve my resume score from 45 to 92! The AI suggestions were spot-on."
    },
    {
      name: "Michael Rodriguez",
      role: "Placement Officer",
      content: "The analytics dashboard gives us incredible insights into student readiness and market trends."
    },
    {
      name: "Emily Johnson",
      role: "Startup Founder",
      content: "We found our perfect candidate through Alignr's smart matching. The quality of profiles is outstanding."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 blur-3xl" />
        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8 max-w-4xl mx-auto"
          >
            <h1 className="text-6xl md:text-7xl font-bold font-poppins bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Alignr
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 font-light">
              AI-Powered Career Development & Placement Ecosystem
            </p>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Connect students with opportunities, empower colleges with insights, and help employers find the perfect talent—all powered by intelligent AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              {user ? (
                <Link to={getDashboardLink()}>
                  <Button size="lg" className="gradient-primary text-white px-8 py-6 text-lg glow-primary">
                    Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth">
                    <Button size="lg" className="gradient-primary text-white px-8 py-6 text-lg glow-primary">
                      Get Started as Student
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button size="lg" variant="outline" className="glass border-primary/50 text-primary px-8 py-6 text-lg hover:bg-primary/10">
                      Post Jobs
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button size="lg" variant="outline" className="glass border-secondary/50 text-secondary px-8 py-6 text-lg hover:bg-secondary/10">
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
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-400">Everything you need to build your career</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="glass-hover h-full">
                  <CardHeader>
                    <feature.icon className="h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-300">
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
      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 via-transparent to-accent/10">
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
                <stat.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">What People Say</h2>
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
              >
                <Card className="glass-hover h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                    <CardDescription className="text-primary">{testimonial.role}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 italic">"{testimonial.content}"</p>
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
            className="glass rounded-2xl p-12 text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Transform Your Career?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of students, colleges, and employers already using Alignr
            </p>
            {!user && (
              <Link to="/auth">
                <Button size="lg" className="gradient-primary text-white px-12 py-6 text-lg glow-primary">
                  Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
