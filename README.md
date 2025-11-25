# Alignr - AI-Powered Career Development Platform

Alignr is an AI-powered, multi-tenant career development and placement ecosystem platform. It connects students (for career optimization and job matching), colleges/TPOs (for placement management and analytics), alumni/startups (for targeted hiring), and platform admins (for ecosystem oversight).

## 🚀 Features

### For Students
- **AI-Powered Resume Analysis**: Get instant ATS scores and personalized improvement suggestions
- **LinkedIn Optimization**: Analyze and optimize your LinkedIn profile with AI recommendations
- **Smart Job Matching**: AI matches you with opportunities based on your skills and preferences
- **Skill Gap Analysis**: Identify missing skills and get personalized learning paths
- **Career Score Tracking**: Track your career readiness with gamified scoring
- **Application Management**: Kanban board for tracking applications

### For Colleges/TPOs
- **Student Management**: Comprehensive student profiles and progress tracking
- **Placement Drives**: Create and manage placement drives with calendar view
- **Analytics Dashboard**: Student engagement, placement pipeline, and skill insights
- **Event Management**: Create and manage career events, webinars, and workshops

### For Alumni/Startups
- **Job Posting**: Post jobs with AI-enhanced descriptions
- **Smart Candidate Matching**: Find the perfect candidates with AI-powered matching
- **Application Tracking**: Manage applications with detailed candidate profiles

### For Admins
- **Multi-College Management**: Manage multiple colleges and their settings
- **Job Moderation**: Review and approve job postings
- **Global Analytics**: Platform-wide insights and metrics

## 🛠️ Tech Stack

### Frontend
- **Vite + React 18+** with TypeScript
- **Tailwind CSS** with glassmorphism design patterns
- **Framer Motion** for smooth animations
- **shadcn/ui** component library
- **React Router v6** with protected route guards
- **TanStack Query** for server state management
- **React Hook Form + Zod** for form validation
- **Recharts** for analytics dashboards
- **Lottie** for micro-interactions

### Backend
- **Supabase** (PostgreSQL, Auth, Storage, Realtime)
- **Supabase Row Level Security (RLS)** for multi-tenant data isolation
- **Supabase Edge Functions** for backend logic
- **Google Gemini API** for AI-powered analysis
- **Botpress Cloud** for conversational chatbot (optional)

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account and project
- Google Gemini API key

### Setup Steps

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Alignr
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Supabase**
   - Create a new Supabase project at https://supabase.com
   - Run the migrations in `supabase/migrations/` in order:
     - `20251125090446_b946a062-cac2-4f00-9110-6b810dc1a117.sql`
     - `20251125090531_29bede3e-53a9-4c9b-a285-083c719f181a.sql`
     - `20251125091000_complete_schema.sql`

4. **Configure environment variables**
   Create a `.env.local` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. **Set up Supabase Storage**
   - Create a storage bucket named `resumes` with public access
   - Create a storage bucket named `avatars` with public access
   - Create a storage bucket named `logos` with public access

6. **Deploy Supabase Edge Functions**
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy Edge Functions
supabase functions deploy analyze-resume
supabase functions deploy analyze-linkedin
supabase functions deploy recommend-jobs
supabase functions deploy rewrite-bullet
```

7. **Set Edge Function secrets**
```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
```

8. **Start development server**
```bash
npm run dev
```

## 🗄️ Database Schema

The database includes the following main tables:
- `profiles` - User profiles with role, college, career scores
- `colleges` - College information and branding
- `resumes` - Resume files and analysis results
- `linkedin_profiles` - LinkedIn profile data and analysis
- `jobs` - Job postings with requirements
- `applications` - Job applications with match scores
- `skill_paths` - Personalized learning paths
- `xp_events` - Gamification events
- `badges` - User badges
- `drives` - Placement drives
- `college_events` - College events
- `notifications` - User notifications

All tables have Row Level Security (RLS) enabled for multi-tenant data isolation.

## 🎨 Design System

Alignr uses a modern glassmorphism design with:
- **Dark theme** with deep navy background (#0F172A)
- **Neon accent colors**: Deep purple (#6366F1), Electric cyan (#06B6D4), Neon pink (#F472B6)
- **Semi-transparent cards** with backdrop blur
- **Smooth animations** with Framer Motion (under 0.4s)
- **Spring-based physics** for natural feel

## 🔐 Authentication

The platform supports:
- Email/password authentication
- Magic links
- OAuth (Google, LinkedIn, GitHub) - configure in Supabase Auth settings

## 🤖 AI Integration

### Google Gemini API
The platform uses Google Gemini for:
- Resume analysis and ATS scoring
- LinkedIn profile optimization
- Job matching and recommendations
- Skill gap analysis
- Career report generation
- Resume bullet point rewriting

### Edge Functions
- `analyze-resume` - Analyzes uploaded resumes
- `analyze-linkedin` - Analyzes LinkedIn profiles
- `recommend-jobs` - Matches students with jobs
- `rewrite-bullet` - Rewrites resume bullet points

## 📱 Routes

### Public Routes
- `/` - Landing page
- `/auth` - Authentication (login/register)
- `/forgot-password` - Password reset

### Student Routes
- `/student/dashboard` - Career dashboard with Career Orb
- `/student/resume` - Resume analysis and optimization
- `/student/linkedin` - LinkedIn profile analysis
- `/student/jobs` - Job board with match scoring
- `/student/applications` - Application tracking (Kanban)
- `/student/skills` - Skill gap analysis and learning paths
- `/student/career-report` - Career report generation
- `/student/events` - College events
- `/student/leaderboard` - College leaderboard

### College Routes
- `/college/dashboard` - College analytics dashboard
- `/college/students` - Student management
- `/college/drives` - Placement drives
- `/college/events` - Event management
- `/college/analytics` - Comprehensive analytics
- `/college/approvals` - Job approval queue

### Alumni Routes
- `/alumni/dashboard` - Alumni dashboard
- `/alumni/post-job` - Post new job
- `/alumni/jobs` - Manage posted jobs
- `/alumni/applications` - View applications

### Admin Routes
- `/admin/dashboard` - Admin dashboard
- `/admin/colleges` - College management
- `/admin/jobs` - Job moderation
- `/admin/analytics` - Global analytics

## 🚧 Current Status

### ✅ Completed
- Database schema with all tables and RLS policies
- Design system with glassmorphism
- Landing page with hero, features, testimonials
- Student dashboard with Career Orb, Skill Gap Radar, Next Actions
- Resume analysis page with upload, ATS scoring, AI rewrite
- LinkedIn analysis page with completeness scoring
- Supabase Edge Functions for Gemini API integration
- Authentication system
- Protected routes

### 🚧 In Progress / TODO
- Job board with match scoring and swipeable cards
- Skills page with learning paths
- Career report PDF generation
- Applications Kanban board
- College dashboard and management pages
- Alumni dashboard and job posting
- Admin dashboard
- Gamification (XP system, badges, leaderboard)
- Notifications system with Realtime
- Botpress chatbot integration

## 📝 Development Notes

- All pages use the `DashboardLayout` component for consistent navigation
- Data fetching uses TanStack Query for caching and state management
- Forms use React Hook Form with Zod validation
- Animations use Framer Motion with spring physics
- Glassmorphism cards use the `.glass` utility class
- Color system uses CSS variables for easy theming

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

[Add your license here]

## 🆘 Support

For issues and questions, please open an issue on GitHub.
