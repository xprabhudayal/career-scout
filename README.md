# Career Scout Landing Page

This is the landing page for Career Scout, an AI-powered voice assistant that helps job seekers find opportunities, research salaries, and get market insights through natural conversation.

## Features

- Modern, responsive design with dark/light mode support
- Interactive animations using GSAP and Framer Motion
- Waitlist signup connected to Supabase
- Built with Next.js and Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 16.8+ or Bun
- Supabase account (for waitlist functionality)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/career-scout.git
cd career-scout
git checkout landing
```

2. Install dependencies
```bash
bun install
```

3. Create a `.env.local` file with your Supabase credentials
```
NEXT_PUBLIC_SUPABASE_URL=https://ucriptjibbzwcibyprfh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Run the development server
```bash
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) to view the landing page

## Project Structure

- `components/` - React components for the landing page
- `pages/` - Next.js pages
- `public/` - Static assets
- `styles/` - Global CSS styles
- `lib/` - Utility functions and client libraries

## Deployment

The landing page can be deployed to platforms like Vercel, Netlify, or any other hosting service that supports Next.js.

## Built With

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [GSAP](https://greensock.com/gsap/) - Animation library
- [Framer Motion](https://www.framer.com/motion/) - Animation library for React
- [Lucide React](https://lucide.dev/) - Icon library
- [Supabase](https://supabase.com/) - Backend for waitlist signup

## License

This project is licensed under the MIT License

## Acknowledgments

- Built with Vapi - #BuildWithVapi
- Created by Prabhudayal Vaishnav
