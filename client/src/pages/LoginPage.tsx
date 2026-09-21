import { useAuth } from '../contexts/AuthContext';
import { Shield, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { signInWithGoogle, loading, error } = useAuth();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0f1a] relative overflow-hidden">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)',
            animation: 'pulse-glow 4s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
            animation: 'pulse-glow 5s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 60%)',
          }}
        />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Login Card */}
      <div
        className="relative z-10 w-full max-w-md mx-4"
        style={{ animation: 'fade-up 0.6s ease-out' }}
      >
        <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl shadow-cyan-500/5">
          {/* Logo & Branding */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 flex items-center justify-center mb-5 shadow-lg shadow-cyan-500/10">
              <Shield className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              CrimeWeb<span className="text-cyan-400">AI</span>
            </h1>
            <p className="text-slate-400 text-sm mt-2 text-center leading-relaxed">
              AI-Powered Criminal Network Analysis
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-700/50" />
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Sign in to continue</span>
            <div className="flex-1 h-px bg-slate-700/50" />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            id="google-sign-in-button"
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5 active:translate-y-0 group"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            ) : (
              <>
                {/* Google "G" SVG icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500 mt-6 leading-relaxed">
            Secure authentication powered by Google.
            <br />
            Your data is encrypted and protected.
          </p>
        </div>

        {/* Bottom decorative accent */}
        <div className="mt-4 flex justify-center">
          <div className="w-20 h-1 rounded-full bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.1); opacity: 0.25; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
