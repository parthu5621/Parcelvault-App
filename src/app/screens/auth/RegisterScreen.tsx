import { Mail, Lock, User, Phone, ArrowLeft, Building } from 'lucide-react';
import { useState } from 'react';

interface RegisterScreenProps {
  onRegister: () => void;
  onBack: () => void;
}

export function RegisterScreen({ onRegister, onBack }: RegisterScreenProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    studentId: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister();
  };

  return (
    <div className="size-full flex flex-col bg-zinc-950">
      <div className="px-6 pt-8 pb-6">
        <button onClick={onBack} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-zinc-400 mb-8">Join ParcelVault today</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
              <User className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              className="w-full bg-zinc-900 text-white pl-12 pr-4 py-4 rounded-2xl border border-zinc-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-zinc-500"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email address"
              className="w-full bg-zinc-900 text-white pl-12 pr-4 py-4 rounded-2xl border border-zinc-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-zinc-500"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
              <Phone className="w-5 h-5" />
            </div>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone number"
              className="w-full bg-zinc-900 text-white pl-12 pr-4 py-4 rounded-2xl border border-zinc-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-zinc-500"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
              <Building className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              placeholder="Student ID"
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
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Password"
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
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Confirm password"
              className="w-full bg-zinc-900 text-white pl-12 pr-4 py-4 rounded-2xl border border-zinc-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-zinc-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95 mt-6"
          >
            Create Account
          </button>

          <p className="text-zinc-500 text-xs text-center">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </div>
    </div>
  );
}
