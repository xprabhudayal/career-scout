# Career Scout - AI Job Advisor

A Next.js application with Supabase authentication, theme switching, and multi-step onboarding flow powered by GSAP animations.

## Features

- 🔐 Supabase Authentication
  - Email/password login
  - Magic link authentication
  - OAuth providers (Google)
  
- 🎭 Theme Switching
  - Dark/Light mode toggle
  - Theme preference saved in user preferences
  
- 🎬 Multi-Step Onboarding
  - Smooth GSAP animations
  - Progress tracking
  - User preference storage
  
- 🔒 Row Level Security
  - Protected user data
  - Service role for admin operations

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account

### Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Supabase Setup

1. Create a new Supabase project
2. Enable email/password authentication and configure OAuth providers
3. Run the SQL in `setup/user_preferences.sql` to create the necessary tables and policies
4. Get your project URL, anon key, and service role key from the Supabase dashboard

### Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

## User Flow

1. User authenticates via auth page (email/password, magic link, or OAuth)
2. New users are redirected to the onboarding flow:
   - Welcome screen
   - Name input
   - Role selection
   - Usage selection
   - Success screen with auto-redirect
3. After onboarding, users are redirected to the dashboard
4. Authentication and onboarding status are checked on each page via middleware

## Project Structure

- `/app` - Next.js app router
  - `/auth` - Authentication pages
  - `/onboarding` - Onboarding flow
  - `/dashboard` - Main application
  
- `/components` - React components
  - `AuthenticationScreen.jsx` - Login/signup component
  - `OnboardingFlow.jsx` - Multi-step onboarding with animations
  - `Providers.jsx` - Context providers for auth and theme
  - `ThemeProvider.jsx` - Theme management

- `/lib` - Utility functions
  - `supabaseClient.js` - Supabase client setup with service role

- `/setup` - Database setup scripts

## Technologies Used

- Next.js 14 with App Router
- Supabase Authentication
- GSAP for animations
- TailwindCSS for styling
- next-themes for theme management
