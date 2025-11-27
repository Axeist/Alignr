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

export default function CareerQuiz() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);

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

  // Generate personalized quiz questions based on profile
  const { data: questionsData, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ["quiz-questions", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase.functions.invoke("generate-quiz-questions", {
        body: { user_id: user.id }
      });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: Infinity, // Questions don't change once generated
    cacheTime: Infinity
  });

  // Set questions when they're loaded
  useEffect(() => {
    if (questionsData?.questions) {
      setQuizQuestions(questionsData.questions);
    }
  }, [questionsData]);

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
      setCurrentQuestion(quizQuestions.length); // Show results
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit quiz");
    }
  });

  const handleNext = () => {
    if (selectedAnswer && quizQuestions[currentQuestion]) {
      const questionId = quizQuestions[currentQuestion].id;
      setResponses({ ...responses, [questionId]: selectedAnswer });
      setSelectedAnswer("");
      
      if (currentQuestion < quizQuestions.length - 1) {
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
      const questionId = quizQuestions[currentQuestion - 1]?.id;
      setSelectedAnswer(responses[questionId] || "");
    }
  };

  const progress = quizQuestions.length > 0 ? ((currentQuestion + 1) / quizQuestions.length) * 100 : 0;

  // Load saved response when navigating
  useEffect(() => {
    const questionId = quizQuestions[currentQuestion]?.id;
    if (questionId) {
      setSelectedAnswer(responses[questionId] || "");
    }
  }, [currentQuestion, quizQuestions]);

  // Show loading state while generating questions
  if (isLoadingQuestions || quizQuestions.length === 0) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="space-y-6 p-6">
          <Card className="glass-hover">
            <CardContent className="pt-6 text-center py-12">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
              <h3 className="text-xl font-semibold mb-2">Generating Your Personalized Quiz...</h3>
              <p className="text-gray-400">
                We're analyzing your profile to create questions tailored just for you
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (quizResult && currentQuestion === quizQuestions.length) {
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

  const question = quizQuestions[currentQuestion];

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
                <CardTitle>Question {currentQuestion + 1} of {quizQuestions.length}</CardTitle>
                <CardDescription>{question?.category || "Career Assessment"}</CardDescription>
              </div>
              <div className="text-sm text-gray-400">
                {Math.round(progress)}% Complete
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-6">{question?.question || "Loading question..."}</h3>
              <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                <div className="space-y-3">
                  {question?.options?.map((option: string, idx: number) => (
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
                disabled={!selectedAnswer || submitQuizMutation.isPending || !question}
              >
                {currentQuestion === quizQuestions.length - 1 
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

