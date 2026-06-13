import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

interface LoginScreenProps {
  onLogin: (role: 'user' | 'admin') => void;
  onBack: () => void;
  onForgotPassword: () => void;
  onOTPLogin: () => void;
}

export function LoginScreen({ onLogin, onBack, onForgotPassword, onOTPLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const role = email.includes('admin') ? 'admin' : 'user';
    onLogin(role);
  };

  return (
    <div className="size-full flex flex-col bg-zinc-950">
      <div className="px-6 pt-8 pb-6">
        <button onClick={onBack} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-zinc-400 mb-8">Sign in to continue</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full bg-zinc-900 text-white pl-12 pr-4 py-4 rounded-2xl border border-zinc-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-zinc-500"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-zinc-900 text-white pl-12 pr-4 py-4 rounded-2xl border border-zinc-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-zinc-500"
              required
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={onOTPLogin}
              className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
            >
              Login with OTP
            </button>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-purple-400 text-sm hover:text-purple-300 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95 mt-6"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
