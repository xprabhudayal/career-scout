// pages/login.tsx
import { supabase } from '../lib/supabaseClient'

// const providers = ['google', 'linkedin', 'github', 'azure']
const providers = ['google']

export default function LoginPage() {
//     const loginWithGoogle = async () => {
//         const { error } = await supabase.auth.signInWithOAuth({
//         provider: 'google',
//   })
//   if (error) console.error('Login error:', error)
// }

  const handleLogin = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({ provider })
    if (error) console.error(`Error logging in with ${provider}:`, error)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Sign in</h1>

      {providers.map((provider) => (
        <button
          key={provider}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => handleLogin(provider)}
        >
          Continue with {provider.charAt(0).toUpperCase() + provider.slice(1)}
        </button>
      ))}
    </div>
  )
}
