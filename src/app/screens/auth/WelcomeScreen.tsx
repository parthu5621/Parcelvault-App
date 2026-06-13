import { Package } from 'lucide-react';

interface WelcomeScreenProps {
  onLogin: () => void;
  onRegister: () => void;
}

export function WelcomeScreen({ onLogin, onRegister }: WelcomeScreenProps) {
  return (
    <div className="size-full flex flex-col bg-gradient-to-br from-zinc-950 via-purple-950/10 to-zinc-950">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
          <Package className="w-12 h-12 text-white" strokeWidth={2} />
        </div>

        <h1 className="text-4xl font-bold text-white mb-2">ParcelVault</h1>
        <p className="text-zinc-400 mb-12 text-center">
          Smart Package Locker System
        </p>

        <div className="w-full max-w-md space-y-4">
          <button
            onClick={onLogin}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl font-semibold active:scale-95 transition-transform shadow-lg shadow-purple-500/20"
          >
            Login
          </button>

          <button
            onClick={onRegister}
            className="w-full bg-zinc-900 border border-zinc-800 text-white py-4 rounded-2xl font-semibold active:scale-95 transition-transform"
          >
            Create Account
          </button>
        </div>

        <p className="text-zinc-500 text-xs mt-8 text-center px-8">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
