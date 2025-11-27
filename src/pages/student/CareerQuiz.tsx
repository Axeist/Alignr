import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  FileText, 
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Award,
  Brain,
  Target
} from "lucide-react";
import { toast } from "sonner";

const QUIZ_QUESTIONS = [
  {
    id: "interests",
    category: "Interests & Passions",
    question: "What type of work excites you the most?",
    options: [
      "Building and creating things (coding, design, engineering)",
      "Solving complex problems and puzzles",
      "Helping and working with people",
      "Analyzing data and finding patterns",
      "Leading teams and making strategic decisions"
    ]
  },
  {
    id: "work_style",
    category: "Work Style",
    question: "How do you prefer to work?",
    options: [
      "Independently with minimal supervision",
      "In a collaborative team environment",
      "A mix of both independent and team work",
      "Leading and mentoring others",
      "Following structured processes and guidelines"
    ]
  },
  {
    id: "skills",
    category: "Current Skills",
    question: "What are your strongest skills right now?",
    options: [
      "Technical skills (programming, tools, software)",
      "Communication and interpersonal skills",
      "Analytical and problem-solving skills",
      "Creative and design skills",
      "Leadership and management skills"
    ]
  },
  {
    id: "learning",
    category: "Learning Preference",
    question: "How do you learn best?",
    options: [
      "Hands-on practice and projects",
      "Structured courses and tutorials",
      "Reading and research",
      "Working with mentors",
      "Trial and error experimentation"
    ]
  },
  {
    id: "career_goals",
    category: "Career Goals",
    question: "What's your primary career goal?",
    options: [
      "Become a technical expert in my field",
      "Move into management and leadership",
      "Start my own company or freelance",
      "Work for a prestigious company",
      "Make a positive impact in my community"
    ]
  },
  {
    id: "work_life",
    category: "Work-Life Balance",
    question: "What work-life balance is most important to you?",
    options: [
      "Flexible hours and remote work options",
      "Stable 9-5 schedule",
      "High intensity with high rewards",
      "Work that aligns with personal values",
      "Opportunities for continuous learning"
    ]
  },
  {
    id: "challenges",
    category: "Challenges",
    question: "What type of challenges do you enjoy?",
    options: [
      "Technical and technical problems",
      "People and communication challenges",
      "Strategic and business problems",
      "Creative and design challenges",
      "Research and discovery challenges"
    ]
  },
  {
    id: "values",
    category: "Values",
    question: "What matters most to you in a career?",
    options: [
      "High salary and financial security",
      "Work-life balance and flexibility",
      "Making a meaningful impact",
      "Continuous learning and growth",
      "Recognition and prestige"
    ]
  },
  {
    id: "team_size",
    category: "Team Preference",
    question: "What team size do you prefer?",
    options: [
      "Small teams (2-5 people)",
      "Medium teams (6-15 people)",
      "Large teams (15+ people)",
      "Working solo",
      "No preference"
    ]
  },
  {
    id: "industry",
    category: "Industry Interest",
    question: "Which industry interests you most?",
    options: [
      "Technology and Software",
      "Finance and Banking",
      "Healthcare and Medicine",
      "Education and Training",
      "Creative and Media"
    ]
  },
  {
    id: "location",
    category: "Location Preference",
    question: "Where would you prefer to work?",
    options: [
      "Remote work from anywhere",
      "Hybrid (mix of remote and office)",
      "In a major tech hub city",
      "In my local area",
      "No preference"
    ]
  },
  {
    id: "growth",
    category: "Career Growth",
    question: "How do you want to grow in your career?",
    options: [
      "Become a subject matter expert",
      "Move up the corporate ladder",
      "Build a diverse skill set",
      "Start my own venture",
      "Contribute to open source and community"
    ]
  },
  {
    id: "projects",
    category: "Project Preference",
    question: "What type of projects interest you?",
    options: [
      "Large-scale systems and infrastructure",
      "User-facing products and applications",
      "Research and innovation projects",
      "Social impact and nonprofit work",
      "Entrepreneurial and startup projects"
    ]
  },
  {
    id: "feedback",
    category: "Feedback Style",
    question: "How do you prefer to receive feedback?",
    options: [
      "Direct and immediate feedback",
      "Regular structured reviews",
      "Continuous informal feedback",
      "Self-assessment and reflection",
      "Peer feedback and collaboration"
    ]
  },
  {
    id: "future",
    category: "Future Vision",
    question: "Where do you see yourself in 5 years?",
    options: [
      "Senior technical role or architect",
      "Management or leadership position",
      "Running my own business",
      "Expert consultant in my field",
      "Making a career transition"
    ]
  }
];

export default function CareerQuiz() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");

  const navItems = [
    { label: "Dashboard", href: "/student/dashboard" },
    { label: "Profile", href: "/student/profile" },
    { label: "Resume", href: "/student/resume" },
    { label: "LinkedIn", href: "/student/linkedin" },
    { label: "Job Board", href: "/student/jobs" },
    { label: "My Applications", href: "/student/applications" },
    { label: "Career Quiz", href: "/student/career-quiz" },
    { label: "Career Paths", href: "/student/career-paths" },
    { label: "Skills", href: "/student/skills-recommendations" },
    { label: "Events", href: "/student/events" },
    { label: "Leaderboard", href: "/student/leaderboard" },
  ];

  // Fetch existing quiz results
  const { data: quizResult } = useQuery({
    queryKey: ["career-quiz", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("career_quizzes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user
  });

  // Submit quiz mutation
  const submitQuizMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase.functions.invoke("assess-career-quiz", {
        body: {
          user_id: user.id,
          quiz_responses: responses
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      toast.success("Quiz completed! Your career insights are ready.");
      queryClient.invalidateQueries({ queryKey: ["career-quiz", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      setCurrentQuestion(QUIZ_QUESTIONS.length); // Show results
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit quiz");
    }
  });

  const handleNext = () => {
    if (selectedAnswer) {
      const questionId = QUIZ_QUESTIONS[currentQuestion].id;
      setResponses({ ...responses, [questionId]: selectedAnswer });
      setSelectedAnswer("");
      
      if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        // Last question, submit
        const finalResponses = { ...responses, [questionId]: selectedAnswer };
        setResponses(finalResponses);
        submitQuizMutation.mutate();
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      const questionId = QUIZ_QUESTIONS[currentQuestion - 1].id;
      setSelectedAnswer(responses[questionId] || "");
    }
  };

  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;

  // Load saved response when navigating
  useEffect(() => {
    const questionId = QUIZ_QUESTIONS[currentQuestion]?.id;
    if (questionId) {
      setSelectedAnswer(responses[questionId] || "");
    }
  }, [currentQuestion]);

  if (quizResult && currentQuestion === QUIZ_QUESTIONS.length) {
    // Show results
    return (
      <DashboardLayout navItems={navItems}>
        <div className="space-y-6 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold mb-2">Career Quiz Results</h1>
            <p className="text-gray-400">Your personalized career insights</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="glass-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Your Quiz Score
                </CardTitle>
                <CardDescription>Based on your responses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-6xl font-bold text-primary mb-2">
                    {quizResult.quiz_score}
                  </div>
                  <Progress value={quizResult.quiz_score} className="h-3 mb-4" />
                  <p className="text-sm text-gray-400">
                    {quizResult.quiz_score >= 80 ? "Excellent! You have a clear career direction." :
                     quizResult.quiz_score >= 60 ? "Good! You're on the right track." :
                     "Keep exploring to find your perfect career path."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {quizResult.suggested_roles && quizResult.suggested_roles.length > 0 && (
              <Card className="glass-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Suggested Roles
                  </CardTitle>
                  <CardDescription>Based on your quiz responses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {quizResult.suggested_roles.slice(0, 5).map((role: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg glass">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>{role}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {quizResult.career_insights && (
              <Card className="glass-hover lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Career Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quizResult.career_insights.strengths && (
                    <div>
                      <h4 className="font-semibold mb-2">Your Strengths</h4>
                      <div className="flex flex-wrap gap-2">
                        {quizResult.career_insights.strengths.map((strength: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm">
                            {strength}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {quizResult.career_insights.interests && (
                    <div>
                      <h4 className="font-semibold mb-2">Your Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {quizResult.career_insights.interests.map((interest: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 rounded-full bg-secondary/20 text-secondary text-sm">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentQuestion(0);
                setResponses({});
                setSelectedAnswer("");
              }}
            >
              Retake Quiz
            </Button>
            <Button
              className="gradient-primary"
              onClick={() => {
                navigate("/student/career-paths");
              }}
            >
              View Career Path Suggestions
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (quizResult && !submitQuizMutation.isPending) {
    // Show option to retake
    return (
      <DashboardLayout navItems={navItems}>
        <div className="space-y-6 p-6">
          <Card className="glass-hover">
            <CardContent className="pt-6 text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-semibold mb-2">Quiz Already Completed</h3>
              <p className="text-gray-400 mb-6">
                You've already completed the career quiz. You can retake it to update your results.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentQuestion(0);
                    setResponses({});
                    setSelectedAnswer("");
                  }}
                >
                  Retake Quiz
                </Button>
                <Button
                  className="gradient-primary"
                  onClick={() => {
                    setCurrentQuestion(QUIZ_QUESTIONS.length);
                  }}
                >
                  View Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const question = QUIZ_QUESTIONS[currentQuestion];

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Career Assessment Quiz</h1>
          <p className="text-gray-400">Discover your ideal career path through personalized questions</p>
        </motion.div>

        <Card className="glass-hover">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle>Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}</CardTitle>
                <CardDescription>{question.category}</CardDescription>
              </div>
              <div className="text-sm text-gray-400">
                {Math.round(progress)}% Complete
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-6">{question.question}</h3>
              <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                <div className="space-y-3">
                  {question.options.map((option, idx) => (
                    <div key={idx} className="flex items-center space-x-2 p-4 rounded-lg glass hover:bg-primary/10 cursor-pointer">
                      <RadioGroupItem value={option} id={`option-${idx}`} />
                      <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              <Button
                className="gradient-primary"
                onClick={handleNext}
                disabled={!selectedAnswer || submitQuizMutation.isPending}
              >
                {currentQuestion === QUIZ_QUESTIONS.length - 1 
                  ? (submitQuizMutation.isPending ? "Submitting..." : "Submit Quiz")
                  : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

