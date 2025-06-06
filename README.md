# Career Scout - AI Voice Assistant for Job Search

Career Scout is an AI-powered voice assistant to help the users in their job hunting. It provides Market Trends, Company Specific Jobs and with Job Search thus providing User first experience. It uses real-time tools and APIs to deliver conversational, actionable insights — all via natural voice interaction.

![Career Scout Banner](/public/banner.webp)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/bun
- Supabase account
- VAPI API key

### Quick Setup
```bash
# Clone repository
git clone https://github.com/yourusername/career-scout.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run the development server
npm run dev
```

### Environment Variables
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
VAPI_PUBLIC_KEY=your_vapi_key
N8N_URL=your_n8n_webhook_url
```