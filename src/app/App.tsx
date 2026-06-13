import { useState, useEffect, useRef } from 'react';
import {
  Package, Bell, User, Home, QrCode, ArrowLeft, Mail, Lock, Phone,
  Building, Search, MapPin, Calendar, CheckCircle2, Clock, Settings,
  Globe, Moon, HelpCircle, MessageSquare, LogOut, ShieldCheck, Camera,
  Key, AlertCircle, TrendingUp, Users, FileText, Hash, Smartphone,
  BarChart3, Info, ChevronDown, ChevronRight, Plus, Eye, EyeOff,
  RefreshCw, Copy, CheckCheck, Lock as LockIcon, X
} from 'lucide-react';
import { StoreProvider, useStore } from './store';
import type { Parcel, Locker } from './store';

// ─── Screen Types ─────────────────────────────────────────────────────────────

export type Screen =
  | 'splash' | 'onboarding1' | 'onboarding2' | 'onboarding3' | 'welcome'
  | 'login' | 'register' | 'forgot-password' | 'reset-password'
  | 'student-dashboard' | 'my-parcels' | 'parcel-details'
  | 'otp-verification' | 'pickup-success' | 'parcel-history'
  | 'pending-parcels' | 'collected-parcels'
  | 'notifications' | 'notification-details'
  | 'user-profile' | 'edit-profile' | 'change-password'
  | 'locker-availability' | 'locker-details' | 'assigned-locker' | 'locker-map'
  | 'admin-login' | 'admin-dashboard' | 'add-parcel' | 'assign-locker'
  | 'generate-otp' | 'parcel-management' | 'user-management'
  | 'pending-pickup-requests' | 'completed-pickup' | 'reports-analytics'
  | 'admin-notifications' | 'app-settings' | 'help-support' | 'faq'
  | 'contact-support' | 'feedback' | 'logout-confirmation';

// ─── Root with Provider ───────────────────────────────────────────────────────

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type, onDismiss }: { message: string; type: 'success' | 'error' | 'info'; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const colors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div className={`fixed top-6 left-4 right-4 z-[100] ${colors[type]} text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-down`}>
      {type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
      {type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
      {type === 'info' && <Info className="w-5 h-5 shrink-0" />}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onDismiss}><X className="w-4 h-4" /></button>
    </div>
  );
}

// ─── App Inner ────────────────────────────────────────────────────────────────

function AppInner() {
  const { currentRole, logout, currentUser, loading } = useStore();
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const navigate = (screen: Screen) => setCurrentScreen(screen);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => setToast({ message, type });

  const handleLogin = (role: 'student' | 'admin') => {
    navigate(role === 'admin' ? 'admin-dashboard' : 'student-dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('welcome');
  };

  useEffect(() => {
    if (!loading && currentUser) {
      navigate(currentRole === 'admin' ? 'admin-dashboard' : 'student-dashboard');
    }
  }, [currentUser, currentRole, loading]);

  const studentNavScreens = ['student-dashboard', 'my-parcels', 'notifications', 'user-profile'];
  const showStudentNav = studentNavScreens.includes(currentScreen);

  return (
    <div className="size-full bg-zinc-950 relative overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      {/* ── Auth / Onboarding ── */}
      {currentScreen === 'splash' && <SplashScreen onComplete={() => navigate('onboarding1')} />}
      {currentScreen === 'onboarding1' && <Onboarding1 onNext={() => navigate('onboarding2')} onSkip={() => navigate('welcome')} />}
      {currentScreen === 'onboarding2' && <Onboarding2 onNext={() => navigate('onboarding3')} onSkip={() => navigate('welcome')} />}
      {currentScreen === 'onboarding3' && <Onboarding3 onComplete={() => navigate('welcome')} />}
      {currentScreen === 'welcome' && <WelcomeScreen onLogin={() => navigate('login')} onRegister={() => navigate('register')} onAdminLogin={() => navigate('admin-login')} />}
      {currentScreen === 'login' && <LoginScreen onLogin={handleLogin} onBack={() => navigate('welcome')} onForgotPassword={() => navigate('forgot-password')} showToast={showToast} />}
      {currentScreen === 'admin-login' && <AdminLoginScreen onLogin={handleLogin} onBack={() => navigate('welcome')} showToast={showToast} />}
      {currentScreen === 'register' && <RegisterScreen onRegister={() => { showToast('Account created! Please login.', 'success'); navigate('login'); }} onBack={() => navigate('welcome')} showToast={showToast} />}
      {currentScreen === 'forgot-password' && <ForgotPasswordScreen onBack={() => navigate('login')} onSent={() => { showToast('Reset link sent to your email', 'success'); navigate('login'); }} />}
      {currentScreen === 'reset-password' && <ResetPasswordScreen onBack={() => navigate('login')} onReset={() => navigate('login')} />}
      {currentScreen === 'logout-confirmation' && <LogoutConfirmationScreen onCancel={() => navigate(currentRole === 'admin' ? 'admin-dashboard' : 'user-profile')} onLogout={handleLogout} />}

      {/* ── Student Screens ── */}
      {currentScreen === 'student-dashboard' && <StudentDashboard navigate={navigate} showToast={showToast} />}
      {currentScreen === 'my-parcels' && <MyParcelsScreen navigate={navigate} />}
      {currentScreen === 'parcel-details' && <ParcelDetailsScreen navigate={navigate} showToast={showToast} />}
      {currentScreen === 'otp-verification' && <OTPVerificationScreen navigate={navigate} showToast={showToast} />}
      {currentScreen === 'pickup-success' && <PickupSuccessScreen navigate={navigate} />}
      {currentScreen === 'parcel-history' && <ParcelHistoryScreen navigate={navigate} />}
      {currentScreen === 'pending-parcels' && <PendingParcelsScreen navigate={navigate} />}
      {currentScreen === 'collected-parcels' && <CollectedParcelsScreen navigate={navigate} />}
      {currentScreen === 'notifications' && <NotificationsScreen navigate={navigate} showToast={showToast} />}
      {currentScreen === 'notification-details' && <NotificationDetailsScreen navigate={navigate} />}
      {currentScreen === 'user-profile' && <UserProfileScreen navigate={navigate} />}
      {currentScreen === 'edit-profile' && <EditProfileScreen navigate={navigate} showToast={showToast} />}
      {currentScreen === 'change-password' && <ChangePasswordScreen navigate={navigate} showToast={showToast} />}
      {currentScreen === 'locker-availability' && <LockerAvailabilityScreen navigate={navigate} />}
      {currentScreen === 'locker-details' && <LockerDetailsScreen navigate={navigate} />}
      {currentScreen === 'assigned-locker' && <AssignedLockerScreen navigate={navigate} />}
      {currentScreen === 'locker-map' && <LockerMapScreen navigate={navigate} />}

      {/* ── Admin Screens ── */}
      {currentScreen === 'admin-dashboard' && <AdminDashboard navigate={navigate} />}
      {currentScreen === 'add-parcel' && <AddParcelScreen navigate={navigate} showToast={showToast} />}
      {currentScreen === 'assign-locker' && <AssignLockerScreen navigate={navigate} showToast={showToast} />}
      {currentScreen === 'generate-otp' && <GenerateOTPScreen navigate={navigate} showToast={showToast} />}
      {currentScreen === 'parcel-management' && <ParcelManagementScreen navigate={navigate} />}
      {currentScreen === 'user-management' && <UserManagementScreen navigate={navigate} />}
      {currentScreen === 'pending-pickup-requests' && <PendingPickupRequestsScreen navigate={navigate} />}
      {currentScreen === 'completed-pickup' && <CompletedPickupScreen navigate={navigate} />}
      {currentScreen === 'reports-analytics' && <ReportsAnalyticsScreen navigate={navigate} />}
      {currentScreen === 'admin-notifications' && <AdminNotificationsScreen navigate={navigate} />}

      {/* ── Shared Settings ── */}
      {currentScreen === 'app-settings' && <AppSettingsScreen navigate={navigate} />}
      {currentScreen === 'help-support' && <HelpSupportScreen navigate={navigate} />}
      {currentScreen === 'faq' && <FAQScreen navigate={navigate} />}
      {currentScreen === 'contact-support' && <ContactSupportScreen navigate={navigate} showToast={showToast} />}
      {currentScreen === 'feedback' && <FeedbackScreen navigate={navigate} showToast={showToast} />}

      {/* ── Student Bottom Nav ── */}
      {showStudentNav && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 px-6 py-3 z-50">
          <div className="flex items-center justify-around max-w-md mx-auto">
            <NavBtn label="Home" icon={<Home className="w-6 h-6" />} active={currentScreen === 'student-dashboard'} onClick={() => navigate('student-dashboard')} />
            <NavBtn label="Parcels" icon={<Package className="w-6 h-6" />} active={currentScreen === 'my-parcels'} onClick={() => navigate('my-parcels')} />
            <NavBtn label="Alerts" icon={<Bell className="w-6 h-6" />} active={currentScreen === 'notifications'} onClick={() => navigate('notifications')} badge />
            <NavBtn label="Profile" icon={<User className="w-6 h-6" />} active={currentScreen === 'user-profile'} onClick={() => navigate('user-profile')} />
          </div>
        </div>
      )}
    </div>
  );
}

function NavBtn({ label, icon, active, onClick, badge }: { label: string; icon: React.ReactNode; active: boolean; onClick: () => void; badge?: boolean }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 relative px-3 py-1 ${active ? 'text-purple-400' : 'text-zinc-500'}`}>
      <div className="relative">
        {icon}
        {badge && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
      </div>
      <span className="text-xs font-medium">{label}</span>
      {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-400 rounded-full" />}
    </button>
  );
}

// ─── Shared Components ─────────────────────────────────────────────────────────

const ScreenHeader = ({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) => (
  <div className="px-6 pt-10 pb-5 bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800/50 flex-shrink-0">
    <div className="flex items-center gap-4">
      <button onClick={onBack} className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700 hover:border-purple-500 transition-colors">
        <ArrowLeft className="w-5 h-5 text-white" />
      </button>
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-zinc-400 text-sm mt-0.5">{subtitle}</p>}
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    ready: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    collected: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    expired: 'bg-red-500/20 text-red-400 border border-red-500/30',
  };
  const label: Record<string, string> = { pending: 'Pending', ready: 'Ready', collected: 'Collected', expired: 'Expired' };
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status] || map.pending}`}>{label[status] || status}</span>;
};

const InputField = ({ icon, label, ...props }: { icon: React.ReactNode; label?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="space-y-1.5">
    {label && <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">{label}</label>}
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">{icon}</div>
      <input {...props} className={`w-full bg-zinc-900 text-white pl-12 pr-4 py-4 rounded-2xl border border-zinc-800 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-colors placeholder:text-zinc-600 ${props.className || ''}`} />
    </div>
  </div>
);

const PrimaryBtn = ({ children, onClick, disabled, className = '' }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) => (
  <button onClick={onClick} disabled={disabled} className={`w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl font-semibold text-base shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}>
    {children}
  </button>
);

const SecondaryBtn = ({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
  <button onClick={onClick} className={`w-full bg-zinc-900 border border-zinc-800 text-white py-4 rounded-2xl font-semibold hover:border-zinc-600 active:scale-[0.99] transition-all ${className}`}>
    {children}
  </button>
);

// ─── Auth Screens ─────────────────────────────────────────────────────────────

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => { const t = setTimeout(onComplete, 2200); return () => clearTimeout(t); }, [onComplete]);
  return (
    <div className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950">
      <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/40 animate-pulse">
        <Package className="w-14 h-14 text-white" />
      </div>
      <h1 className="text-4xl font-bold text-white mt-8 tracking-tight">ParcelVault</h1>
      <p className="text-zinc-400 mt-2 text-base">Smart Campus Locker System</p>
      <div className="mt-12 flex gap-2">
        {[0,1,2].map(i => <div key={i} className={`rounded-full bg-zinc-700 ${i === 1 ? 'w-6 h-2 bg-purple-500' : 'w-2 h-2'} transition-all`} />)}
      </div>
    </div>
  );
}

function Onboarding1({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="size-full flex flex-col bg-zinc-950">
      <div className="flex justify-end p-6"><button onClick={onSkip} className="text-zinc-400 text-sm">Skip</button></div>
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-64 h-64 bg-gradient-to-br from-blue-500/15 to-purple-600/15 rounded-full flex items-center justify-center mb-10 border border-blue-500/10">
          <Package className="w-28 h-28 text-blue-400" strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4 text-center">Secure Parcel Storage</h2>
        <p className="text-zinc-400 text-center text-base leading-relaxed">Your college packages are safely stored in smart lockers — accessible 24/7.</p>
      </div>
      <div className="p-6 space-y-3">
        <div className="flex justify-center gap-2 mb-4">{[0,1,2].map(i=><div key={i} className={`rounded-full ${i===0?'w-6 h-2 bg-purple-500':'w-2 h-2 bg-zinc-700'}`}/>)}</div>
        <PrimaryBtn onClick={onNext}>Next →</PrimaryBtn>
      </div>
    </div>
  );
}

function Onboarding2({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="size-full flex flex-col bg-zinc-950">
      <div className="flex justify-end p-6"><button onClick={onSkip} className="text-zinc-400 text-sm">Skip</button></div>
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-64 h-64 bg-gradient-to-br from-purple-500/15 to-blue-600/15 rounded-full flex items-center justify-center mb-10 border border-purple-500/10">
          <Key className="w-28 h-28 text-purple-400" strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4 text-center">OTP-Based Access</h2>
        <p className="text-zinc-400 text-center text-base leading-relaxed">Admin assigns your parcel to a locker and shares an OTP. Use it to unlock and collect.</p>
      </div>
      <div className="p-6 space-y-3">
        <div className="flex justify-center gap-2 mb-4">{[0,1,2].map(i=><div key={i} className={`rounded-full ${i===1?'w-6 h-2 bg-purple-500':'w-2 h-2 bg-zinc-700'}`}/>)}</div>
        <PrimaryBtn onClick={onNext}>Next →</PrimaryBtn>
      </div>
    </div>
  );
}

function Onboarding3({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="size-full flex flex-col bg-zinc-950">
      <div className="flex justify-end p-6" />
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-64 h-64 bg-gradient-to-br from-emerald-500/15 to-blue-600/15 rounded-full flex items-center justify-center mb-10 border border-emerald-500/10">
          <Bell className="w-28 h-28 text-emerald-400" strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4 text-center">Real-Time Alerts</h2>
        <p className="text-zinc-400 text-center text-base leading-relaxed">Get instant notifications when your parcel arrives and reminders before it expires.</p>
      </div>
      <div className="p-6 space-y-3">
        <div className="flex justify-center gap-2 mb-4">{[0,1,2].map(i=><div key={i} className={`rounded-full ${i===2?'w-6 h-2 bg-purple-500':'w-2 h-2 bg-zinc-700'}`}/>)}</div>
        <PrimaryBtn onClick={onComplete}>Get Started</PrimaryBtn>
      </div>
    </div>
  );
}

function WelcomeScreen({ onLogin, onRegister, onAdminLogin }: { onLogin: () => void; onRegister: () => void; onAdminLogin: () => void }) {
  return (
    <div className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-purple-950/10 to-zinc-950 px-6">
      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-purple-500/30">
        <Package className="w-12 h-12 text-white" />
      </div>
      <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">ParcelVault</h1>
      <p className="text-zinc-400 mb-12 text-base">Smart Campus Locker System</p>
      <div className="w-full max-w-md space-y-3">
        <PrimaryBtn onClick={onLogin}>Student Login</PrimaryBtn>
        <SecondaryBtn onClick={onRegister}>Create Student Account</SecondaryBtn>
        <button onClick={onAdminLogin} className="w-full py-3 text-zinc-500 text-sm hover:text-zinc-300 transition-colors">
          Admin Access →
        </button>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin, onBack, onForgotPassword, showToast }: any) {
  const { login } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // Retrieve saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('pv_saved_email');
    const savedPassword = localStorage.getItem('pv_saved_password');
    if (savedEmail) setEmail(savedEmail);
    if (savedPassword) setPassword(savedPassword);
  }, []);

  const handleSubmit = async () => {
    if (!email || !password) { showToast('Please fill all fields', 'error'); return; }
    setLoading(true);
    try {
      const result = await login(email, password);
      setLoading(false);
      if (result.success) {
        // Save credentials upon successful login
        localStorage.setItem('pv_saved_email', email);
        localStorage.setItem('pv_saved_password', password);
        showToast('Welcome back!', 'success');
        onLogin(result.role);
      } else {
        showToast(result.error || 'Login failed', 'error');
      }
    } catch (err: any) {
      setLoading(false);
      showToast(err.message || 'Login failed', 'error');
    }
  };

  return (
    <div className="size-full flex flex-col bg-zinc-950 overflow-y-auto">
      <div className="px-6 pt-10 pb-4">
        <button onClick={onBack} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 hover:border-purple-500 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      </div>
      <div className="flex-1 px-6 pb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Welcome Back</h1>
        <p className="text-zinc-400 mb-8">Sign in as a student</p>
        <div className="space-y-4">
          <InputField icon={<Mail className="w-5 h-5" />} label="Email" type="email" placeholder="your@university.edu" value={email} onChange={e => setEmail(e.target.value)} />
          <div className="space-y-1.5">
            <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-zinc-900 text-white pl-12 pr-12 py-4 rounded-2xl border border-zinc-800 focus:border-purple-500 focus:outline-none transition-colors placeholder:text-zinc-600" />
              <button onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
                {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={onForgotPassword} className="text-purple-400 text-sm">Forgot password?</button>
          </div>
          <PrimaryBtn onClick={handleSubmit} disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</PrimaryBtn>
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 mt-4">
            <p className="text-zinc-500 text-xs font-medium mb-2 uppercase tracking-wider">Demo Credentials</p>
            <p className="text-zinc-300 text-sm">📧 alex@university.edu</p>
            <p className="text-zinc-300 text-sm">🔑 123456</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminLoginScreen({ onLogin, onBack, showToast }: any) {
  const { login } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Retrieve saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('pv_admin_saved_email');
    const savedPassword = localStorage.getItem('pv_admin_saved_password');
    if (savedEmail) setEmail(savedEmail);
    if (savedPassword) setPassword(savedPassword);
  }, []);

  const handleSubmit = async () => {
    if (!email || !password) { showToast('Please fill all fields', 'error'); return; }
    setLoading(true);
    try {
      const result = await login(email, password);
      setLoading(false);
      if (result.success && result.role === 'admin') {
        // Save credentials upon successful login
        localStorage.setItem('pv_admin_saved_email', email);
        localStorage.setItem('pv_admin_saved_password', password);
        showToast('Admin logged in!', 'success');
        onLogin('admin');
      } else {
        showToast('Invalid admin credentials', 'error');
      }
    } catch (err: any) {
      setLoading(false);
      showToast(err.message || 'Invalid admin credentials', 'error');
    }
  };

  return (
    <div className="size-full flex flex-col bg-zinc-950 overflow-y-auto">
      <ScreenHeader title="Admin Login" subtitle="Administrator access" onBack={onBack} />
      <div className="flex-1 px-6 py-6 space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-10 h-10 text-white" />
        </div>
        <InputField icon={<Mail className="w-5 h-5" />} label="Admin Email" type="email" placeholder="admin@university.edu" value={email} onChange={e => setEmail(e.target.value)} />
        <InputField icon={<Lock className="w-5 h-5" />} label="Password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
        <PrimaryBtn onClick={handleSubmit} disabled={loading}>{loading ? 'Signing in…' : 'Admin Sign In'}</PrimaryBtn>
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <p className="text-zinc-500 text-xs font-medium mb-2 uppercase tracking-wider">Demo Admin Credentials</p>
          <p className="text-zinc-300 text-sm">📧 admin@university.edu</p>
          <p className="text-zinc-300 text-sm">🔑 admin123</p>
        </div>
      </div>
    </div>
  );
}

function RegisterScreen({ onRegister, onBack, showToast }: any) {
  const { register } = useStore();
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [studentId, setStudentId] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (role === 'admin') {
      if (!name || !email || !password || !adminKey) { showToast('Please fill all required fields', 'error'); return; }
      if (adminKey !== 'ADMIN123') { showToast('Invalid Admin Access Key', 'error'); return; }
    } else {
      if (!name || !email || !phone || !studentId || !password) { showToast('Please fill all required fields', 'error'); return; }
      // Validate phone number format (at least 10 digits)
      const phoneRegex = /^\+?[0-9\s\-]{10,20}$/;
      if (!phoneRegex.test(phone)) {
        showToast('Please enter a valid phone number (min 10 digits)', 'error');
        return;
      }
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    // Validate password strength
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      showToast('Password must contain both letters and numbers', 'error');
      return;
    }
    if (password !== confirm) { showToast('Passwords do not match', 'error'); return; }
    
    setLoading(true);
    try {
      const result = await register({ name, email, phone, studentId, password }, role);
      setLoading(false);
      if (result.success) onRegister();
      else showToast(result.error || 'Registration failed', 'error');
    } catch (err: any) {
      setLoading(false);
      showToast(err.message || 'Registration failed', 'error');
    }
  };

  return (
    <div className="size-full flex flex-col bg-zinc-950 overflow-y-auto">
      <ScreenHeader title="Create Account" subtitle="Join ParcelVault" onBack={onBack} />
      <div className="flex-1 px-6 py-6 space-y-4 pb-10">
        {/* Role Toggle */}
        <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
          <button type="button" onClick={() => setRole('student')} className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${role === 'student' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}>
            Student
          </button>
          <button type="button" onClick={() => setRole('admin')} className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${role === 'admin' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}>
            Admin
          </button>
        </div>

        <InputField icon={<User className="w-5 h-5" />} label="Full Name" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
        <InputField icon={<Mail className="w-5 h-5" />} label="Email" type="email" placeholder="your@university.edu" value={email} onChange={e => setEmail(e.target.value)} />
        
        {role === 'student' ? (
          <>
            <InputField icon={<Phone className="w-5 h-5" />} label="Phone" type="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
            <InputField icon={<Building className="w-5 h-5" />} label="Student ID" placeholder="e.g. STU004" value={studentId} onChange={e => setStudentId(e.target.value)} />
          </>
        ) : (
          <InputField icon={<ShieldCheck className="w-5 h-5" />} label="Admin Access Key *" type="password" placeholder="Enter registration secret (ADMIN123)" value={adminKey} onChange={e => setAdminKey(e.target.value)} />
        )}

        <InputField icon={<Lock className="w-5 h-5" />} label="Password" type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
        <InputField icon={<Lock className="w-5 h-5" />} label="Confirm Password" type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} />
        
        <PrimaryBtn onClick={handleSubmit} disabled={loading}>{loading ? 'Creating Account…' : role === 'admin' ? 'Register Admin' : 'Create Student Account'}</PrimaryBtn>
      </div>
    </div>
  );
}

function ForgotPasswordScreen({ onBack, onSent }: any) {
  const [email, setEmail] = useState('');
  return (
    <div className="size-full flex flex-col bg-zinc-950">
      <ScreenHeader title="Forgot Password" subtitle="We'll send you a reset link" onBack={onBack} />
      <div className="flex-1 px-6 py-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <Mail className="w-10 h-10 text-white" />
        </div>
        <InputField icon={<Mail className="w-5 h-5" />} label="Email Address" type="email" placeholder="your@university.edu" value={email} onChange={e => setEmail(e.target.value)} />
        <div className="mt-6"><PrimaryBtn onClick={onSent}>Send Reset Link</PrimaryBtn></div>
      </div>
    </div>
  );
}

function ResetPasswordScreen({ onBack, onReset }: any) {
  return (
    <div className="size-full flex flex-col bg-zinc-950">
      <ScreenHeader title="Reset Password" subtitle="Create a new password" onBack={onBack} />
      <div className="flex-1 px-6 py-8 space-y-4">
        <InputField icon={<Lock className="w-5 h-5" />} label="New Password" type="password" placeholder="Min. 6 characters" />
        <InputField icon={<Lock className="w-5 h-5" />} label="Confirm Password" type="password" placeholder="Repeat password" />
        <PrimaryBtn onClick={onReset}>Reset Password</PrimaryBtn>
      </div>
    </div>
  );
}

// ─── Student Screens ───────────────────────────────────────────────────────────

function StudentDashboard({ navigate, showToast }: any) {
  const { currentUser, getStudentParcels, getStudentNotifications } = useStore();
  const student = currentUser as any;
  const parcels = getStudentParcels(student?.id || '');
  const notifications = getStudentNotifications(student?.id || '');
  const pending = parcels.filter(p => p.status === 'pending').length;
  const ready = parcels.filter(p => p.status === 'ready').length;
  const collected = parcels.filter(p => p.status === 'collected').length;
  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div className="size-full flex flex-col bg-zinc-950 overflow-y-auto pb-24">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-zinc-400 text-sm">Good day,</p>
            <h1 className="text-2xl font-bold text-white">{student?.name?.split(' ')[0] || 'Student'} 👋</h1>
          </div>
          <button onClick={() => navigate('notifications')} className="relative w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
            <Bell className="w-5 h-5 text-white" />
            {unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">{unread}</span>}
          </button>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pending', value: pending, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { label: 'Ready', value: ready, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Collected', value: collected, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-3 border border-zinc-800 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-zinc-400 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Ready for pickup banner */}
        {ready > 0 && (
          <button onClick={() => navigate('my-parcels')} className="w-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-2xl p-4 text-left hover:border-emerald-400/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">{ready} parcel{ready > 1 ? 's' : ''} ready for pickup!</p>
                <p className="text-zinc-400 text-sm">Tap to view and collect</p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </div>
          </button>
        )}

        {/* Quick Actions */}
        <div>
          <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { title: 'My Parcels', sub: `${parcels.length} total`, icon: Package, color: 'from-blue-500 to-blue-600', route: 'my-parcels' as const, special: false },
              { title: 'Collection Pass', sub: 'Show to Admin', icon: QrCode, color: 'from-purple-500 to-purple-600', route: 'my-parcels' as const, special: true },
              { title: 'Parcel History', sub: `${collected} collected`, icon: Clock, color: 'from-emerald-500 to-emerald-600', route: 'parcel-history' as const, special: false },
              { title: 'Locker Map', sub: 'Find lockers', icon: MapPin, color: 'from-orange-500 to-orange-600', route: 'locker-map' as const, special: false },
            ].map(item => (
              <button key={item.title} onClick={() => {
                if (item.special) {
                  const readyParcel = parcels.find(p => p.status === 'ready');
                  if (readyParcel) { navigate('otp-verification'); }
                  else { navigate('my-parcels'); showToast('No parcels are ready for collection yet.', 'info'); }
                } else { navigate(item.route); }
              }} className={`bg-gradient-to-br ${item.color} rounded-2xl p-5 text-left shadow-lg active:scale-95 transition-transform`}>
                <item.icon className="w-7 h-7 text-white mb-3" />
                <h3 className="text-white font-semibold text-sm">{item.title}</h3>
                <p className="text-white/70 text-xs mt-0.5">{item.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Parcels */}
        {parcels.filter(p => p.status !== 'collected').length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">Active Parcels</h3>
              <button onClick={() => navigate('my-parcels')} className="text-purple-400 text-xs">View all</button>
            </div>
            <div className="space-y-2">
              {parcels.filter(p => p.status !== 'collected').slice(0, 3).map(p => (
                <ParcelCard key={p.id} parcel={p} onClick={() => navigate('my-parcels')} />
              ))}
            </div>
          </div>
        )}

        {/* Locker section */}
        <div>
          <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">Locker Info</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('locker-availability')} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-left hover:border-purple-500 transition-colors">
              <LockIcon className="w-6 h-6 text-purple-400 mb-2" />
              <p className="text-white text-sm font-medium">Availability</p>
            </button>
            <button onClick={() => navigate('assigned-locker')} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-left hover:border-purple-500 transition-colors">
              <MapPin className="w-6 h-6 text-blue-400 mb-2" />
              <p className="text-white text-sm font-medium">My Locker</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParcelCard({ parcel, onClick }: { parcel: Parcel; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full bg-zinc-900 rounded-2xl p-4 border border-zinc-800 text-left hover:border-purple-500/50 transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-white font-semibold text-sm">{parcel.trackingId}</span>
        <StatusBadge status={parcel.status} />
      </div>
      <p className="text-zinc-400 text-xs">{parcel.description}</p>
      {parcel.lockerLabel && <p className="text-purple-400 text-xs mt-1">📦 Locker {parcel.lockerLabel}</p>}
    </button>
  );
}

function MyParcelsScreen({ navigate }: any) {
  const { currentUser, getStudentParcels, setSelectedParcelId } = useStore();
  const student = currentUser as any;
  const allParcels = getStudentParcels(student?.id || '');
  const [tab, setTab] = useState<'all' | 'ready' | 'pending' | 'collected'>('all');

  const filtered = tab === 'all' ? allParcels : allParcels.filter(p => p.status === tab);

  const goToDetail = (p: Parcel) => {
    setSelectedParcelId(p.id);
    navigate('parcel-details');
  };

  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-24">
      <ScreenHeader title="My Parcels" subtitle={`${allParcels.length} total`} onBack={() => navigate('student-dashboard')} />

      {/* Tabs */}
      <div className="flex gap-2 px-6 py-4 overflow-x-auto border-b border-zinc-800/50 flex-shrink-0">
        {(['all', 'ready', 'pending', 'collected'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${tab === t ? 'bg-purple-500 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
            {t === 'all' ? `All (${allParcels.length})` : t === 'ready' ? `Ready (${allParcels.filter(p => p.status === 'ready').length})` : t === 'pending' ? `Pending (${allParcels.filter(p => p.status === 'pending').length})` : `Collected (${allParcels.filter(p => p.status === 'collected').length})`}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-16 h-16 text-zinc-700 mb-4" />
            <p className="text-zinc-400 font-medium">No {tab === 'all' ? '' : tab} parcels</p>
          </div>
        ) : filtered.map(p => (
          <button key={p.id} onClick={() => goToDetail(p)} className="w-full bg-zinc-900 rounded-2xl p-4 border border-zinc-800 text-left hover:border-purple-500/50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-white font-semibold">{p.trackingId}</p>
                <p className="text-zinc-500 text-xs">{p.deliveryService}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <p className="text-zinc-400 text-sm mb-2">{p.description}</p>
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              {p.lockerLabel && <span className="text-purple-400">📦 Locker {p.lockerLabel}</span>}
              <span>📅 {new Date(p.arrivedAt).toLocaleDateString()}</span>
            </div>
            {p.status === 'ready' && (
              <div className="mt-3 bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-xs font-medium">View Collection Pass &amp; OTP</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function ParcelDetailsScreen({ navigate, showToast }: any) {
  const { parcels, selectedParcelId, setSelectedParcelId } = useStore();
  const parcel = parcels.find(p => p.id === selectedParcelId);

  if (!parcel) {
    return (
      <div className="size-full flex flex-col bg-zinc-950">
        <ScreenHeader title="Parcel Details" onBack={() => navigate('my-parcels')} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-400">Parcel not found</p>
        </div>
      </div>
    );
  }

  const timeLeft = parcel.expiresAt ? Math.max(0, Math.floor((new Date(parcel.expiresAt).getTime() - Date.now()) / 86400000)) : null;

  return (
    <div className="size-full flex flex-col bg-zinc-950 overflow-y-auto pb-10">
      <ScreenHeader title="Parcel Details" subtitle={parcel.trackingId} onBack={() => navigate('my-parcels')} />
      <div className="px-6 py-6 space-y-4">
        {/* Icon + Status */}
        <div className="flex flex-col items-center py-6">
          <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-4 ${parcel.status === 'ready' ? 'bg-gradient-to-br from-emerald-500 to-blue-600' : parcel.status === 'collected' ? 'bg-gradient-to-br from-blue-500 to-purple-600' : parcel.status === 'expired' ? 'bg-red-500/20' : 'bg-gradient-to-br from-yellow-500 to-orange-600'}`}>
            <Package className="w-12 h-12 text-white" />
          </div>
          <StatusBadge status={parcel.status} />
        </div>

        {/* Info Cards */}
        {[
          { label: 'Tracking ID', value: parcel.trackingId },
          { label: 'Description', value: parcel.description },
          { label: 'Delivery Service', value: parcel.deliveryService },
          { label: 'Assigned Locker', value: parcel.lockerLabel || 'Not assigned yet' },
          { label: 'Arrived', value: new Date(parcel.arrivedAt).toLocaleString() },
          ...(parcel.expiresAt ? [{ label: 'Expires', value: `${new Date(parcel.expiresAt).toLocaleDateString()} (${timeLeft} day${timeLeft === 1 ? '' : 's'} left)` }] : []),
          ...(parcel.collectedAt ? [{ label: 'Collected', value: new Date(parcel.collectedAt).toLocaleString() }] : []),
        ].map(item => (
          <div key={item.label} className="bg-zinc-900 rounded-2xl px-5 py-4 border border-zinc-800 flex items-center justify-between">
            <span className="text-zinc-400 text-sm">{item.label}</span>
            <span className="text-white font-medium text-sm text-right max-w-[55%]">{item.value}</span>
          </div>
        ))}

        {/* Action */}
        {parcel.status === 'ready' && (
          <div className="pt-2">
            <PrimaryBtn onClick={() => navigate('otp-verification')}>
              🎫 View Collection Pass &amp; OTP
            </PrimaryBtn>
            {timeLeft !== null && timeLeft <= 1 && (
              <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-xs font-medium">Expires soon! Collect within {timeLeft} day{timeLeft === 1 ? '' : 's'}</span>
              </div>
            )}
          </div>
        )}

        {parcel.status === 'pending' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-400 shrink-0" />
            <p className="text-yellow-400 text-sm">Waiting for admin to assign a locker and generate OTP</p>
          </div>
        )}

        {parcel.status === 'collected' && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-emerald-400 text-sm">Parcel successfully collected. Thank you!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function OTPVerificationScreen({ navigate, showToast }: any) {
  const { parcels, selectedParcelId, getStudentParcels, currentUser } = useStore();
  const student = currentUser as any;
  // If no specific parcel selected, find the first ready parcel
  const allStudentParcels = getStudentParcels(student?.id || '');
  const parcel = parcels.find(p => p.id === selectedParcelId && p.status === 'ready')
    || allStudentParcels.find(p => p.status === 'ready');

  if (!parcel) {
    return (
      <div className="size-full flex flex-col bg-zinc-950">
        <ScreenHeader title="Collection Pass" subtitle="No parcel ready" onBack={() => navigate('my-parcels')} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <Package className="w-20 h-20 text-zinc-700 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Parcels Ready</h2>
          <p className="text-zinc-400 text-sm mb-8">You don't have any parcels ready for collection yet.</p>
          <PrimaryBtn onClick={() => navigate('my-parcels')}>View My Parcels</PrimaryBtn>
        </div>
      </div>
    );
  }

  const timeLeft = parcel.expiresAt
    ? Math.max(0, Math.floor((new Date(parcel.expiresAt).getTime() - Date.now()) / 86400000))
    : null;

  // Generate a fake QR code pattern using a grid
  const qrSize = 7;
  const qrPattern = Array.from({ length: qrSize }, (_, r) =>
    Array.from({ length: qrSize }, (_, c) => {
      // Corner markers
      if ((r < 2 && c < 2) || (r < 2 && c >= qrSize - 2) || (r >= qrSize - 2 && c < 2)) return true;
      // Pseudo-random inner fill based on OTP
      const seed = (parcel.otp || '482931').split('').reduce((a, d) => a + parseInt(d), 0);
      return (r * qrSize + c + seed) % 3 === 0;
    })
  );

  return (
    <div className="size-full flex flex-col bg-zinc-950 overflow-y-auto">
      {/* Header */}
      <div className="px-6 pt-10 pb-5 bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800/50 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('parcel-details')} className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700 hover:border-purple-500 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white">Collection Pass</h1>
            <p className="text-zinc-400 text-sm mt-0.5">Present to campus admin desk</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-4 pb-10">
        {/* Premium Pass Card */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 p-6 shadow-2xl shadow-purple-900/50">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />

          {/* Pass Header */}
          <div className="flex items-center justify-between mb-5 relative">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-sm tracking-wide">PARCELVAULT</span>
            </div>
            <span className="text-white/70 text-xs bg-white/10 px-3 py-1 rounded-full border border-white/20">VERIFIED PASS</span>
          </div>

          {/* Student Info */}
          <div className="mb-5 relative">
            <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Authorized Student</p>
            <p className="text-white text-xl font-bold">{student?.name || 'Student'}</p>
            <p className="text-white/70 text-sm">{student?.studentId} · {student?.email}</p>
          </div>

          {/* Divider with holes */}
          <div className="relative flex items-center my-5">
            <div className="absolute -left-6 w-5 h-5 bg-zinc-950 rounded-full" />
            <div className="flex-1 border-t-2 border-dashed border-white/20" />
            <div className="absolute -right-6 w-5 h-5 bg-zinc-950 rounded-full" />
          </div>

          {/* Parcel & Locker Details */}
          <div className="grid grid-cols-2 gap-3 mb-5 relative">
            <div className="bg-white/10 rounded-2xl p-3">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Tracking ID</p>
              <p className="text-white font-semibold text-sm">{parcel.trackingId}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Locker</p>
              <p className="text-white font-bold text-lg">{parcel.lockerLabel || 'TBD'}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Delivery By</p>
              <p className="text-white font-semibold text-sm">{parcel.deliveryService}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Expires In</p>
              <p className="text-white font-semibold text-sm">{timeLeft !== null ? `${timeLeft} day${timeLeft === 1 ? '' : 's'}` : 'N/A'}</p>
            </div>
          </div>

          {/* OTP Display */}
          <div className="bg-black/30 backdrop-blur rounded-2xl p-4 border border-white/20 text-center relative">
            <p className="text-white/60 text-xs uppercase tracking-widest mb-2">🔐 Collection OTP — Show to Admin</p>
            <div className="flex items-center justify-center gap-2">
              {(parcel.otp || '------').split('').map((d, i) => (
                <div key={i} className="w-10 h-12 bg-white/10 border border-white/30 rounded-xl flex items-center justify-center">
                  <span className="text-white text-2xl font-black tracking-widest">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mock QR Code */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 mb-1">
            <QrCode className="w-4 h-4 text-purple-400" />
            <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Verification QR Code</p>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-lg">
            <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${qrSize}, 1fr)` }}>
              {qrPattern.flat().map((filled, idx) => (
                <div key={idx} className={`w-5 h-5 rounded-sm ${filled ? 'bg-zinc-950' : 'bg-white'}`} />
              ))}
            </div>
          </div>
          <p className="text-zinc-500 text-xs text-center">Admin scans to verify your identity</p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-blue-300 text-sm leading-relaxed">
            Present this pass to the campus admin at the desk. The admin will verify your OTP and hand over your package.
          </p>
        </div>

        <SecondaryBtn onClick={() => navigate('my-parcels')}>Back to My Parcels</SecondaryBtn>
      </div>
    </div>
  );
}

function PickupSuccessScreen({ navigate }: any) {
  const { selectedParcelId, parcels } = useStore();
  const parcel = parcels.find(p => p.id === selectedParcelId);
  return (
    <div className="size-full flex flex-col items-center justify-center bg-zinc-950 px-6">
      <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/40">
        <CheckCircle2 className="w-16 h-16 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2 text-center">Pickup Successful!</h1>
      <p className="text-zinc-400 text-center mb-2">Your parcel has been collected</p>
      {parcel && <p className="text-purple-400 text-sm mb-10">{parcel.trackingId}</p>}
      <div className="w-full max-w-md space-y-3">
        <PrimaryBtn onClick={() => navigate('student-dashboard')}>Back to Dashboard</PrimaryBtn>
        <SecondaryBtn onClick={() => navigate('parcel-history')}>View History</SecondaryBtn>
      </div>
    </div>
  );
}

function ParcelHistoryScreen({ navigate }: any) {
  const { currentUser, getStudentParcels } = useStore();
  const student = currentUser as any;
  const history = getStudentParcels(student?.id || '').filter(p => p.status === 'collected');
  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-10">
      <ScreenHeader title="Parcel History" subtitle={`${history.length} collected`} onBack={() => navigate('student-dashboard')} />
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Clock className="w-16 h-16 text-zinc-700 mb-4" />
            <p className="text-zinc-400">No collected parcels yet</p>
          </div>
        ) : history.map(p => (
          <div key={p.id} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold">{p.trackingId}</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-zinc-400 text-sm mb-1">{p.description}</p>
            {p.collectedAt && <p className="text-zinc-500 text-xs">Collected: {new Date(p.collectedAt).toLocaleString()}</p>}
            {p.lockerLabel && <p className="text-purple-400 text-xs mt-1">Locker {p.lockerLabel}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function PendingParcelsScreen({ navigate }: any) {
  const { currentUser, getStudentParcels, setSelectedParcelId } = useStore();
  const student = currentUser as any;
  const pending = getStudentParcels(student?.id || '').filter(p => p.status === 'pending');
  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-10">
      <ScreenHeader title="Pending Parcels" subtitle={`${pending.length} waiting`} onBack={() => navigate('my-parcels')} />
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {pending.map(p => (
          <button key={p.id} onClick={() => { setSelectedParcelId(p.id); navigate('parcel-details'); }} className="w-full bg-zinc-900 rounded-2xl p-4 border border-zinc-800 text-left hover:border-yellow-500/40 transition-colors">
            <div className="flex justify-between mb-2"><span className="text-white font-semibold">{p.trackingId}</span><StatusBadge status="pending" /></div>
            <p className="text-zinc-400 text-sm">{p.description}</p>
            <p className="text-zinc-500 text-xs mt-1">Arrived: {new Date(p.arrivedAt).toLocaleString()}</p>
          </button>
        ))}
        {pending.length === 0 && <div className="text-center py-20"><Package className="w-16 h-16 text-zinc-700 mx-auto mb-4" /><p className="text-zinc-400">No pending parcels</p></div>}
      </div>
    </div>
  );
}

function CollectedParcelsScreen({ navigate }: any) {
  const { currentUser, getStudentParcels } = useStore();
  const student = currentUser as any;
  const collected = getStudentParcels(student?.id || '').filter(p => p.status === 'collected');
  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-10">
      <ScreenHeader title="Collected Parcels" subtitle={`${collected.length} collected`} onBack={() => navigate('my-parcels')} />
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {collected.map(p => (
          <div key={p.id} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <div className="flex justify-between mb-2"><span className="text-white font-semibold">{p.trackingId}</span><CheckCircle2 className="w-5 h-5 text-emerald-400" /></div>
            <p className="text-zinc-400 text-sm">{p.description}</p>
            {p.collectedAt && <p className="text-zinc-500 text-xs mt-1">Collected: {new Date(p.collectedAt).toLocaleString()}</p>}
          </div>
        ))}
        {collected.length === 0 && <div className="text-center py-20"><CheckCircle2 className="w-16 h-16 text-zinc-700 mx-auto mb-4" /><p className="text-zinc-400">No collected parcels yet</p></div>}
      </div>
    </div>
  );
}

// ─── Notification Screens ─────────────────────────────────────────────────────

function NotificationsScreen({ navigate, showToast }: any) {
  const { currentUser, getStudentNotifications, markNotificationRead, setSelectedParcelId } = useStore();
  const student = currentUser as any;
  const notifs = getStudentNotifications(student?.id || '');

  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-24">
      <div className="px-6 pt-12 pb-5 bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800/50">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <span className="text-zinc-400 text-sm">{notifs.filter(n => !n.isRead).length} unread</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {notifs.length === 0 ? (
          <div className="text-center py-20"><Bell className="w-16 h-16 text-zinc-700 mx-auto mb-4" /><p className="text-zinc-400">No notifications yet</p></div>
        ) : notifs.map(n => (
          <button key={n.id} onClick={() => { markNotificationRead(n.id); navigate('notification-details'); }}
            className={`w-full rounded-2xl p-4 border text-left transition-colors ${!n.isRead ? 'bg-blue-500/10 border-blue-500/30' : 'bg-zinc-900 border-zinc-800'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.type === 'alert' ? 'bg-emerald-500/20' : n.type === 'reminder' ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}>
                {n.type === 'alert' ? <Package className="w-5 h-5 text-emerald-400" /> : n.type === 'reminder' ? <Clock className="w-5 h-5 text-orange-400" /> : <Bell className="w-5 h-5 text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white font-semibold text-sm">{n.title}</p>
                  {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">{n.message}</p>
                <p className="text-zinc-600 text-xs mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function NotificationDetailsScreen({ navigate }: any) {
  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-10">
      <ScreenHeader title="Notification" subtitle="Alert details" onBack={() => navigate('notifications')} />
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          <Bell className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <p className="text-white font-semibold mb-2">Parcel Ready for Pickup</p>
          <p className="text-zinc-400 text-sm mb-6">Check My Parcels to collect your package using the OTP provided.</p>
          <PrimaryBtn onClick={() => navigate('my-parcels')}>View My Parcels</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Screens ──────────────────────────────────────────────────────────

function UserProfileScreen({ navigate }: any) {
  const { currentUser } = useStore();
  const student = currentUser as any;
  return (
    <div className="size-full flex flex-col bg-zinc-950 overflow-y-auto pb-24">
      <div className="px-6 pt-12 pb-6 bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800/50">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{student?.name || 'Student'}</h2>
            <p className="text-zinc-400 text-sm">{student?.email}</p>
            <p className="text-zinc-500 text-xs mt-0.5">ID: {student?.studentId}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-6 space-y-6">
        {[
          { section: 'Profile', items: [
            { label: 'Edit Profile', icon: <User className="w-5 h-5 text-zinc-400" />, route: 'edit-profile' },
            { label: 'Change Password', icon: <Lock className="w-5 h-5 text-zinc-400" />, route: 'change-password' },
          ]},
          { section: 'App', items: [
            { label: 'App Settings', icon: <Settings className="w-5 h-5 text-zinc-400" />, route: 'app-settings' },
            { label: 'Help & Support', icon: <HelpCircle className="w-5 h-5 text-zinc-400" />, route: 'help-support' },
            { label: 'FAQ', icon: <Info className="w-5 h-5 text-zinc-400" />, route: 'faq' },
            { label: 'Send Feedback', icon: <MessageSquare className="w-5 h-5 text-zinc-400" />, route: 'feedback' },
          ]},
        ].map(group => (
          <div key={group.section}>
            <h3 className="text-zinc-500 text-xs uppercase tracking-widest font-semibold mb-2">{group.section}</h3>
            <div className="space-y-1">
              {group.items.map(item => (
                <button key={item.label} onClick={() => navigate(item.route as Screen)} className="w-full bg-zinc-900 rounded-2xl px-4 py-4 border border-zinc-800 flex items-center justify-between hover:border-purple-500/50 transition-colors">
                  <div className="flex items-center gap-3">{item.icon}<span className="text-white">{item.label}</span></div>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>
              ))}
            </div>
          </div>
        ))}
        <button onClick={() => navigate('logout-confirmation')} className="w-full bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-4 flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors">
          <LogOut className="w-5 h-5 text-red-400" />
          <span className="text-red-400 font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

function EditProfileScreen({ navigate, showToast }: any) {
  const { currentUser } = useStore();
  const student = currentUser as any;
  const [name, setName] = useState(student?.name || '');
  const [phone, setPhone] = useState(student?.phone || '');
  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-10">
      <ScreenHeader title="Edit Profile" subtitle="Update your information" onBack={() => navigate('user-profile')} />
      <div className="flex-1 px-6 py-6 space-y-4">
        <InputField icon={<User className="w-5 h-5" />} label="Full Name" value={name} onChange={e => setName(e.target.value)} />
        <InputField icon={<Mail className="w-5 h-5" />} label="Email" type="email" value={student?.email || ''} disabled className="opacity-50 cursor-not-allowed" />
        <InputField icon={<Phone className="w-5 h-5" />} label="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
        <InputField icon={<Building className="w-5 h-5" />} label="Student ID" value={student?.studentId || ''} disabled className="opacity-50 cursor-not-allowed" />
        <PrimaryBtn onClick={() => { showToast('Profile updated!', 'success'); navigate('user-profile'); }}>Save Changes</PrimaryBtn>
      </div>
    </div>
  );
}

function ChangePasswordScreen({ navigate, showToast }: any) {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [conf, setConf] = useState('');
  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-10">
      <ScreenHeader title="Change Password" subtitle="Update your password" onBack={() => navigate('user-profile')} />
      <div className="flex-1 px-6 py-6 space-y-4">
        <InputField icon={<Lock className="w-5 h-5" />} label="Current Password" type="password" placeholder="••••••" value={cur} onChange={e => setCur(e.target.value)} />
        <InputField icon={<Lock className="w-5 h-5" />} label="New Password" type="password" placeholder="Min. 6 chars" value={next} onChange={e => setNext(e.target.value)} />
        <InputField icon={<Lock className="w-5 h-5" />} label="Confirm Password" type="password" placeholder="Repeat" value={conf} onChange={e => setConf(e.target.value)} />
        <PrimaryBtn onClick={() => {
          if (!cur || !next || !conf) { showToast('Fill all fields', 'error'); return; }
          if (next !== conf) { showToast('Passwords do not match', 'error'); return; }
          showToast('Password updated!', 'success'); navigate('user-profile');
        }}>Update Password</PrimaryBtn>
      </div>
    </div>
  );
}

// ─── Locker Screens ───────────────────────────────────────────────────────────

function LockerAvailabilityScreen({ navigate }: any) {
  const { lockers, setSelectedLockerId } = useStore();
  const available = lockers.filter(l => !l.isOccupied).length;
  const sections = ['A', 'B', 'C'];

  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-10">
      <ScreenHeader title="Locker Availability" subtitle={`${available} of ${lockers.length} free`} onBack={() => navigate('student-dashboard')} />
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Available', val: available, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Occupied', val: lockers.length - available, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
            { label: 'Total', val: lockers.length, color: 'text-white', bg: 'bg-zinc-800/50 border-zinc-700' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 border text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-zinc-400 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        {sections.map(sec => {
          const sectionLockers = lockers.filter(l => l.section === sec);
          return (
            <div key={sec} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 mb-4">
              <h3 className="text-white font-semibold mb-3">Section {sec}</h3>
              <div className="grid grid-cols-4 gap-2">
                {sectionLockers.map(l => (
                  <button key={l.id} onClick={() => { setSelectedLockerId(l.id); navigate('locker-details'); }}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-semibold border transition-colors ${l.isOccupied ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                    <LockIcon className="w-3 h-3 mb-1" />
                    {l.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-4 mt-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded" />Free</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded" />Occupied</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LockerDetailsScreen({ navigate }: any) {
  const { lockers, selectedLockerId, parcels } = useStore();
  const locker = lockers.find(l => l.id === selectedLockerId);
  const currentParcel = locker?.currentParcelId ? parcels.find(p => p.id === locker.currentParcelId) : null;

  if (!locker) return <div className="size-full flex items-center justify-center bg-zinc-950"><p className="text-zinc-400">Select a locker to view details</p></div>;

  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-10">
      <ScreenHeader title="Locker Details" subtitle={locker.label} onBack={() => navigate('locker-availability')} />
      <div className="px-6 py-6 space-y-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-3xl p-8 border border-blue-500/30 text-center">
          <LockIcon className="w-20 h-20 text-blue-400 mx-auto mb-3" />
          <h2 className="text-4xl font-bold text-white">{locker.label}</h2>
          <p className={`text-sm mt-2 ${locker.isOccupied ? 'text-blue-400' : 'text-emerald-400'}`}>{locker.isOccupied ? 'Occupied' : 'Available'}</p>
        </div>
        {[
          { label: 'Section', value: `Section ${locker.section}` },
          { label: 'Size', value: locker.size.charAt(0).toUpperCase() + locker.size.slice(1) },
          { label: 'Status', value: locker.isOccupied ? 'Occupied' : 'Available' },
          ...(currentParcel ? [{ label: 'Current Parcel', value: currentParcel.trackingId }] : []),
        ].map(item => (
          <div key={item.label} className="bg-zinc-900 rounded-2xl px-5 py-4 border border-zinc-800 flex justify-between items-center">
            <span className="text-zinc-400 text-sm">{item.label}</span>
            <span className="text-white font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssignedLockerScreen({ navigate }: any) {
  const { currentUser, getStudentParcels, parcels, lockers } = useStore();
  const student = currentUser as any;
  const myParcels = getStudentParcels(student?.id || '');
  const activeParcels = myParcels.filter(p => p.status === 'ready' && p.lockerId);

  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-10">
      <ScreenHeader title="My Lockers" subtitle="Active assignments" onBack={() => navigate('student-dashboard')} />
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {activeParcels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <LockIcon className="w-16 h-16 text-zinc-700 mb-4" />
            <p className="text-zinc-400 text-center">No active locker assignments.<br />Your parcels will appear here once the admin assigns a locker.</p>
          </div>
        ) : activeParcels.map(p => (
          <div key={p.id} className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-6 text-center shadow-2xl shadow-purple-500/20">
            <LockIcon className="w-16 h-16 text-white mx-auto mb-3" />
            <h2 className="text-4xl font-bold text-white mb-1">{p.lockerLabel}</h2>
            <p className="text-blue-100 text-sm mb-4">{p.trackingId}</p>
            <div className="bg-white/10 rounded-2xl p-4 text-left space-y-2">
              <div className="flex justify-between text-sm"><span className="text-blue-100">Description</span><span className="text-white font-medium">{p.description}</span></div>
              {p.expiresAt && <div className="flex justify-between text-sm"><span className="text-blue-100">Expires</span><span className="text-orange-300 font-medium">{new Date(p.expiresAt).toLocaleDateString()}</span></div>}
            </div>
            <button onClick={() => navigate('my-parcels')} className="mt-4 w-full bg-white/20 border border-white/30 text-white py-3 rounded-2xl font-semibold hover:bg-white/30 transition-colors">
              Collect Parcel
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LockerMapScreen({ navigate }: any) {
  const { lockers } = useStore();
  const sections = ['A', 'B', 'C'];
  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-10">
      <ScreenHeader title="Locker Map" subtitle="Building A - Floor 1" onBack={() => navigate('student-dashboard')} />
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {sections.map(sec => {
          const sl = lockers.filter(l => l.section === sec);
          const free = sl.filter(l => !l.isOccupied).length;
          return (
            <div key={sec} className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold text-lg">Section {sec}</h3>
                <span className="text-emerald-400 text-sm">{free}/{sl.length} free</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {sl.map(l => (
                  <div key={l.id} className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-semibold border ${l.isOccupied ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                    <LockIcon className="w-3 h-3 mb-1" />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <h3 className="text-white font-semibold mb-3">Legend</h3>
          <div className="flex gap-6">
            <span className="flex items-center gap-2 text-sm text-zinc-400"><div className="w-3 h-3 bg-emerald-500 rounded" />Available</span>
            <span className="flex items-center gap-2 text-sm text-zinc-400"><div className="w-3 h-3 bg-blue-500 rounded" />Occupied</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Screens ─────────────────────────────────────────────────────────────

function AdminDashboard({ navigate }: any) {
  const { parcels, lockers, students } = useStore();
  const active = parcels.filter(p => p.status === 'ready').length;
  const pending = parcels.filter(p => p.status === 'pending').length;
  const collected = parcels.filter(p => p.status === 'collected').length;
  const freeLockers = lockers.filter(l => !l.isOccupied).length;

  return (
    <div className="size-full flex flex-col bg-zinc-950 overflow-y-auto pb-10">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800/50">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-zinc-400 text-sm">Admin Panel</p>
            <h1 className="text-2xl font-bold text-white">ParcelVault</h1>
          </div>
          <button onClick={() => navigate('logout-confirmation')} className="ml-auto w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
            <LogOut className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Ready', value: active, color: 'text-emerald-400' },
            { label: 'Pending', value: pending, color: 'text-yellow-400' },
            { label: 'Collected', value: collected, color: 'text-blue-400' },
            { label: 'Free', value: freeLockers, color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Core Actions */}
        <div>
          <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">Core Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { title: 'Add Parcel', sub: 'Register delivery', icon: Plus, color: 'from-blue-500 to-blue-600', route: 'add-parcel' },
              { title: 'Assign Locker', sub: 'Allocate + notify student', icon: LockIcon, color: 'from-purple-500 to-purple-600', route: 'assign-locker' },
              { title: 'Verify & Issue', sub: 'Verify student OTP', icon: ShieldCheck, color: 'from-orange-500 to-orange-600', route: 'generate-otp' },
              { title: 'Pending Parcels', sub: `${pending} waiting`, icon: Clock, color: 'from-yellow-500 to-orange-500', route: 'pending-pickup-requests' },
            ].map(item => (
              <button key={item.title} onClick={() => navigate(item.route as Screen)} className={`bg-gradient-to-br ${item.color} rounded-2xl p-5 text-left shadow-lg active:scale-95 transition-transform`}>
                <item.icon className="w-7 h-7 text-white mb-3" />
                <h3 className="text-white font-semibold text-sm">{item.title}</h3>
                <p className="text-white/70 text-xs mt-0.5">{item.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Management */}
        <div>
          <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">Management</h3>
          <div className="space-y-2">
            {[
              { label: 'Parcel Management', sub: `${parcels.length} total parcels`, icon: <Package className="w-5 h-5 text-purple-400" />, route: 'parcel-management' },
              { label: 'User Management', sub: `${students.length} students`, icon: <Users className="w-5 h-5 text-blue-400" />, route: 'user-management' },
              { label: 'Completed Pickups', sub: `${collected} completed`, icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />, route: 'completed-pickup' },
              { label: 'Reports & Analytics', sub: 'View insights', icon: <BarChart3 className="w-5 h-5 text-orange-400" />, route: 'reports-analytics' },
              { label: 'Admin Notifications', sub: 'System alerts', icon: <Bell className="w-5 h-5 text-pink-400" />, route: 'admin-notifications' },
            ].map(item => (
              <button key={item.label} onClick={() => navigate(item.route as Screen)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 flex items-center justify-between hover:border-purple-500/50 transition-colors">
                <div className="flex items-center gap-3">
                  {item.icon}
                  <div className="text-left">
                    <p className="text-white font-medium text-sm">{item.label}</p>
                    <p className="text-zinc-500 text-xs">{item.sub}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddParcelScreen({ navigate, showToast }: any) {
  const { students, addParcel, setSelectedParcelId } = useStore();
  const [studentId, setStudentId] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryService, setDeliveryService] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!studentId || !description || !deliveryService) { showToast('Please fill all required fields', 'error'); return; }
    setLoading(true);
    try {
      const parcel = await addParcel({ studentId, description, deliveryService, trackingId: trackingId || `PKG-${Date.now().toString().slice(-6)}` });
      setLoading(false);
      setSelectedParcelId(parcel.id);
      showToast('Parcel registered! Now assign a locker.', 'success');
      navigate('assign-locker');
    } catch (err: any) {
      setLoading(false);
      showToast(err.message || 'Failed to add parcel', 'error');
    }
  };

  return (
    <div className="size-full flex flex-col bg-zinc-950">
      <ScreenHeader title="Add Parcel" subtitle="Register new delivery" onBack={() => navigate('admin-dashboard')} />
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 pb-10">
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-2xl p-4 border border-blue-500/20 mb-4">
          <p className="text-blue-300 text-sm">📦 After adding a parcel, you'll be taken to the Assign Locker screen to select a locker and generate an OTP for the student.</p>
        </div>

        {/* Student Select */}
        <div className="space-y-1.5">
          <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Student *</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <select value={studentId} onChange={e => setStudentId(e.target.value)}
              className="w-full bg-zinc-900 text-white pl-12 pr-4 py-4 rounded-2xl border border-zinc-800 focus:border-purple-500 focus:outline-none appearance-none">
              <option value="">Select student…</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.studentId})</option>)}
            </select>
          </div>
        </div>

        <InputField icon={<Package className="w-5 h-5" />} label="Description *" placeholder="e.g. Amazon - Books" value={description} onChange={e => setDescription(e.target.value)} />
        <InputField icon={<FileText className="w-5 h-5" />} label="Delivery Service *" placeholder="e.g. Amazon, Flipkart, Meesho" value={deliveryService} onChange={e => setDeliveryService(e.target.value)} />
        <InputField icon={<Hash className="w-5 h-5" />} label="Tracking ID (optional)" placeholder="Auto-generated if empty" value={trackingId} onChange={e => setTrackingId(e.target.value)} />

        <PrimaryBtn onClick={handleAdd} disabled={loading}>{loading ? 'Registering…' : 'Add Parcel & Assign Locker →'}</PrimaryBtn>
        <SecondaryBtn onClick={() => navigate('admin-dashboard')}>Cancel</SecondaryBtn>
      </div>
    </div>
  );
}

function AssignLockerScreen({ navigate, showToast }: any) {
  const { lockers, parcels, selectedParcelId, setSelectedParcelId, assignLocker } = useStore();
  const [selectedLocker, setSelectedLocker] = useState<string>('');
  const [assignedOtp, setAssignedOtp] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const parcel = parcels.find(p => p.id === selectedParcelId);
  const freeLockers = lockers.filter(l => !l.isOccupied);
  const sections = ['A', 'B', 'C'];

  // If parcel already has a locker assigned, show the OTP
  const existingOtp = parcel?.otp;

  const handleAssign = async () => {
    if (!selectedLocker) { showToast('Please select a locker', 'error'); return; }
    if (!selectedParcelId) { showToast('No parcel selected', 'error'); return; }
    setLoading(true);
    try {
      const result = await assignLocker(selectedParcelId, selectedLocker);
      setLoading(false);
      if (result.success) {
        setAssignedOtp(result.otp);
        showToast('Locker assigned and OTP generated!', 'success');
      } else {
        showToast('Failed to assign locker', 'error');
      }
    } catch (err: any) {
      setLoading(false);
      showToast(err.message || 'Failed to assign locker', 'error');
    }
  };

  const copyOtp = () => {
    if (assignedOtp || existingOtp) {
      navigator.clipboard.writeText((assignedOtp || existingOtp)!).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayOtp = assignedOtp || existingOtp;

  return (
    <div className="size-full flex flex-col bg-zinc-950">
      <ScreenHeader title="Assign Locker" subtitle="Select locker & generate OTP" onBack={() => navigate('admin-dashboard')} />
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 pb-10">

        {/* Parcel info */}
        {parcel && (
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Selected Parcel</p>
            <p className="text-white font-semibold">{parcel.trackingId}</p>
            <p className="text-zinc-400 text-sm">{parcel.studentName} · {parcel.description}</p>
            <StatusBadge status={parcel.status} />
          </div>
        )}

        {!parcel && (
          <div className="space-y-1.5">
            <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Select Parcel to Assign</label>
            <div className="relative">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <select value={selectedParcelId || ''} onChange={e => setSelectedParcelId(e.target.value)}
                className="w-full bg-zinc-900 text-white pl-12 pr-4 py-4 rounded-2xl border border-zinc-800 focus:border-purple-500 focus:outline-none appearance-none">
                <option value="">Select pending parcel…</option>
                {parcels.filter(p => p.status === 'pending').map(p => <option key={p.id} value={p.id}>{p.trackingId} - {p.studentName}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* OTP Result */}
        {displayOtp ? (
          <div className="bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-3xl p-6 border border-emerald-500/30 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-zinc-300 text-sm mb-2">OTP Generated Successfully!</p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-5xl font-bold text-white tracking-widest">{displayOtp}</span>
            </div>
            <button onClick={copyOtp} className="flex items-center gap-2 bg-white/10 border border-white/20 text-white px-5 py-2.5 rounded-xl mx-auto hover:bg-white/20 transition-colors">
              {copied ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy OTP'}
            </button>
            <p className="text-zinc-400 text-xs mt-4">Share this OTP with the student to collect their parcel from Locker <span className="text-purple-300">{parcel?.lockerLabel}</span></p>
            <div className="mt-6 space-y-3">
              <PrimaryBtn onClick={() => navigate('admin-dashboard')}>Back to Dashboard</PrimaryBtn>
              <SecondaryBtn onClick={() => { setAssignedOtp(null); setSelectedParcelId(null); }}>Assign Another</SecondaryBtn>
            </div>
          </div>
        ) : (
          <>
            {/* Locker selection */}
            <div>
              <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3 block">Available Lockers</label>
              {sections.map(sec => {
                const secLockers = freeLockers.filter(l => l.section === sec);
                if (secLockers.length === 0) return null;
                return (
                  <div key={sec} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 mb-3">
                    <h3 className="text-white font-semibold mb-3">Section {sec} — {secLockers.length} free</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {secLockers.map(l => (
                        <button key={l.id} onClick={() => setSelectedLocker(l.id)}
                          className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-semibold border-2 transition-all ${selectedLocker === l.id ? 'bg-purple-500 border-purple-400 text-white scale-105' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:border-emerald-400'}`}>
                          <LockIcon className="w-3 h-3 mb-1" />
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {freeLockers.length === 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
                  <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
                  <p className="text-red-400 font-medium">No lockers available</p>
                  <p className="text-zinc-400 text-sm mt-1">All lockers are currently occupied</p>
                </div>
              )}
            </div>

            {selectedLocker && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 flex items-center gap-3">
                <LockIcon className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-purple-300 font-semibold">Selected: {lockers.find(l => l.id === selectedLocker)?.label}</p>
                  <p className="text-zinc-400 text-xs">An OTP will be auto-generated</p>
                </div>
              </div>
            )}

            <PrimaryBtn onClick={handleAssign} disabled={loading || !selectedLocker}>
              {loading ? 'Assigning…' : '🔑 Assign Locker & Generate OTP'}
            </PrimaryBtn>
          </>
        )}
      </div>
    </div>
  );
}

function GenerateOTPScreen({ navigate, showToast }: any) {
  const { parcels, students, collectParcel } = useStore();
  const [enteredOtp, setEnteredOtp] = useState(['', '', '', '', '', '']);
  const [verifiedParcel, setVerifiedParcel] = useState<typeof parcels[0] | null>(null);
  const [verifiedStudent, setVerifiedStudent] = useState<typeof students[0] | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issued, setIssued] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const readyParcels = parcels.filter(p => p.status === 'ready');

  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const updated = [...enteredOtp];
    updated[idx] = val.slice(-1);
    setEnteredOtp(updated);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !enteredOtp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const handleVerify = () => {
    const code = enteredOtp.join('');
    if (code.length < 6) { showToast('Enter the complete 6-digit OTP', 'error'); return; }
    setVerifying(true);
    const matched = readyParcels.find(p => p.otp === code);
    setVerifying(false);
    if (matched) {
      const stu = students.find(s => s.id === matched.studentId);
      setVerifiedParcel(matched);
      setVerifiedStudent(stu || null);
      showToast('Student verified successfully!', 'success');
    } else {
      showToast('Invalid OTP. No matching parcel found.', 'error');
      setEnteredOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleIssue = async () => {
    if (!verifiedParcel) return;
    setIssuing(true);
    try {
      const result = await collectParcel(verifiedParcel.id, verifiedParcel.otp!);
      setIssuing(false);
      if (result.success) {
        setIssued(true);
        showToast('Parcel issued & locker released!', 'success');
      } else {
        showToast(result.error || 'Failed to issue parcel', 'error');
      }
    } catch (err: any) {
      setIssuing(false);
      showToast(err.message || 'Failed to issue parcel', 'error');
    }
  };

  const handleReset = () => {
    setEnteredOtp(['', '', '', '', '', '']);
    setVerifiedParcel(null);
    setVerifiedStudent(null);
    setIssued(false);
  };

  // ── Issued Success Screen ─────────────────────────────────────────────────
  if (issued && verifiedParcel) {
    return (
      <div className="size-full flex flex-col items-center justify-center bg-zinc-950 px-6">
        <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/40">
          <CheckCircle2 className="w-16 h-16 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Parcel Handed Over!</h1>
        <p className="text-zinc-400 text-center mb-2">Successfully issued to student</p>
        <p className="text-emerald-400 font-semibold mb-1">{verifiedParcel.trackingId}</p>
        <p className="text-zinc-500 text-sm mb-2">Locker <span className="text-purple-400 font-semibold">{verifiedParcel.lockerLabel}</span> is now free</p>
        <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 mb-8 text-center">
          <p className="text-emerald-300 text-sm">✅ Locker released &amp; available for new assignments</p>
        </div>
        <div className="w-full space-y-3">
          <PrimaryBtn onClick={handleReset}>Verify Another Student</PrimaryBtn>
          <SecondaryBtn onClick={() => navigate('admin-dashboard')}>Back to Dashboard</SecondaryBtn>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full flex flex-col bg-zinc-950 overflow-y-auto">
      <ScreenHeader title="Verify & Issue" subtitle="Enter student's OTP to verify" onBack={() => navigate('admin-dashboard')} />
      <div className="flex-1 px-6 py-6 space-y-5 pb-10">

        {/* Info Banner */}
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-orange-300 text-sm leading-relaxed">Ask the student to show their Collection Pass OTP, then enter it below to verify identity and issue the parcel.</p>
        </div>

        {/* OTP Input */}
        {!verifiedParcel && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Key className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-white font-bold text-lg">Enter Student OTP</h2>
              <p className="text-zinc-400 text-sm mt-1">Ask the student for the 6-digit code on their Collection Pass</p>
            </div>
            <div className="flex gap-2 justify-center">
              {enteredOtp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(e.target.value, i)}
                  onKeyDown={e => handleKeyDown(e, i)}
                  className={`w-11 h-13 text-white text-center text-xl font-bold rounded-2xl border-2 focus:outline-none transition-colors bg-zinc-800 py-3 ${
                    digit ? 'border-orange-500 text-orange-300' : 'border-zinc-700 focus:border-orange-500'
                  }`}
                />
              ))}
            </div>
            <PrimaryBtn onClick={handleVerify} disabled={verifying} className="bg-gradient-to-r from-orange-500 to-pink-600">
              {verifying ? 'Verifying…' : '🔍 Verify Student'}
            </PrimaryBtn>
          </div>
        )}

        {/* Verified Student Panel */}
        {verifiedParcel && verifiedStudent && (
          <div className="space-y-4">
            {/* Success Banner */}
            <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-emerald-300 font-bold">Student Verified Successfully ✓</p>
                <p className="text-emerald-400/70 text-xs">Identity confirmed via OTP</p>
              </div>
            </div>

            {/* Student Profile Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shrink-0">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{verifiedStudent.name}</p>
                  <p className="text-zinc-400 text-sm">{verifiedStudent.email}</p>
                  <p className="text-zinc-500 text-xs">ID: {verifiedStudent.studentId}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Phone', value: verifiedStudent.phone },
                  { label: 'Student ID', value: verifiedStudent.studentId },
                ].map(item => (
                  <div key={item.label} className="bg-zinc-800 rounded-xl p-3">
                    <p className="text-zinc-500 text-xs mb-0.5">{item.label}</p>
                    <p className="text-white text-sm font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Parcel Details Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3">
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">Parcel to Issue</p>
              <div className="flex items-center justify-between">
                <p className="text-white font-bold">{verifiedParcel.trackingId}</p>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-semibold">Ready</span>
              </div>
              <p className="text-zinc-400 text-sm">{verifiedParcel.description} · {verifiedParcel.deliveryService}</p>
              <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                <LockIcon className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300 font-semibold">Locker {verifiedParcel.lockerLabel}</span>
                <span className="text-zinc-500 text-xs ml-auto">Will be freed on issue</span>
              </div>
            </div>

            {/* Issue Button */}
            <button
              onClick={handleIssue}
              disabled={issuing}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {issuing ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> Issuing…</>
              ) : (
                <><CheckCircle2 className="w-5 h-5" /> Issue &amp; Release Locker</>
              )}
            </button>

            <SecondaryBtn onClick={handleReset}>↩ Enter Different OTP</SecondaryBtn>
          </div>
        )}

        {/* Ready Parcels Reference */}
        {!verifiedParcel && readyParcels.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">Awaiting Collection ({readyParcels.length})</p>
            <div className="space-y-2">
              {readyParcels.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-white text-sm font-medium">{p.studentName}</p>
                    <p className="text-zinc-500 text-xs">{p.trackingId} · Locker {p.lockerLabel}</p>
                  </div>
                  <span className="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">Ready</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!verifiedParcel && readyParcels.length === 0 && (
          <div className="text-center py-10">
            <Package className="w-16 h-16 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-medium">No parcels awaiting collection</p>
            <p className="text-zinc-600 text-sm mt-1">All ready parcels have been collected</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ParcelManagementScreen({ navigate }: any) {
  const { parcels, setSelectedParcelId } = useStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'ready' | 'collected'>('all');
  const filtered = filter === 'all' ? parcels : parcels.filter(p => p.status === filter);

  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-10">
      <ScreenHeader title="Parcel Management" subtitle={`${parcels.length} total`} onBack={() => navigate('admin-dashboard')} />
      <div className="flex gap-2 px-6 py-4 overflow-x-auto border-b border-zinc-800/50 flex-shrink-0">
        {(['all', 'pending', 'ready', 'collected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${filter === f ? 'bg-purple-500 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({(f === 'all' ? parcels : parcels.filter(p => p.status === f)).length})
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {filtered.map(p => (
          <div key={p.id} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-white font-semibold">{p.trackingId}</p>
                <p className="text-zinc-400 text-sm">{p.studentName}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <p className="text-zinc-500 text-sm">{p.description} · {p.deliveryService}</p>
            {p.lockerLabel && <p className="text-purple-400 text-xs mt-1">📦 Locker {p.lockerLabel}</p>}
            {p.status === 'pending' && (
              <button onClick={() => { setSelectedParcelId(p.id); navigate('assign-locker'); }}
                className="mt-3 w-full bg-purple-500/10 border border-purple-500/30 text-purple-400 py-2 rounded-xl text-sm font-medium hover:bg-purple-500/20 transition-colors">
                Assign Locker →
              </button>
            )}
            {p.status === 'ready' && p.otp && (
              <div className="mt-3 bg-zinc-800 rounded-xl px-4 py-2 flex justify-between items-center">
                <span className="text-zinc-400 text-xs">OTP:</span>
                <span className="text-white font-bold tracking-widest">{p.otp}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function UserManagementScreen({ navigate }: any) {
  const { students, getStudentParcels } = useStore();
  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-10">
      <ScreenHeader title="User Management" subtitle={`${students.length} students`} onBack={() => navigate('admin-dashboard')} />
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {students.map(s => {
          const ps = getStudentParcels(s.id);
          const active = ps.filter(p => p.status === 'ready').length;
          return (
            <div key={s.id} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">{s.name.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{s.name}</p>
                  <p className="text-zinc-400 text-sm">{s.email}</p>
                  <p className="text-zinc-500 text-xs">{s.studentId}</p>
                </div>
                {active > 0 && <span className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2 py-1 rounded-lg border border-emerald-500/30">{active} active</span>}
              </div>
              <div className="flex gap-4 mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-500">
                <span>Total: {ps.length}</span>
                <span>Ready: {ps.filter(p=>p.status==='ready').length}</span>
                <span>Collected: {ps.filter(p=>p.status==='collected').length}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PendingPickupRequestsScreen({ navigate }: any) {
  const { parcels, setSelectedParcelId } = useStore();
  const pending = parcels.filter(p => p.status === 'pending');
  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-10">
      <ScreenHeader title="Pending Parcels" subtitle={`${pending.length} awaiting assignment`} onBack={() => navigate('admin-dashboard')} />
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {pending.length === 0 ? (
          <div className="text-center py-20"><CheckCircle2 className="w-16 h-16 text-zinc-700 mx-auto mb-4" /><p className="text-zinc-400">All parcels assigned!</p></div>
        ) : pending.map(p => (
          <div key={p.id} className="bg-zinc-900 rounded-2xl p-4 border border-yellow-500/20">
            <div className="flex justify-between mb-2"><span className="text-white font-semibold">{p.trackingId}</span><StatusBadge status="pending" /></div>
            <p className="text-zinc-400 text-sm">{p.studentName} · {p.description}</p>
            <p className="text-zinc-500 text-xs mt-1">Arrived: {new Date(p.arrivedAt).toLocaleString()}</p>
            <button onClick={() => { setSelectedParcelId(p.id); navigate('assign-locker'); }}
              className="mt-3 w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
              Assign Locker & Generate OTP →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompletedPickupScreen({ navigate }: any) {
  const { parcels } = useStore();
  const completed = parcels.filter(p => p.status === 'collected');
  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-10">
      <ScreenHeader title="Completed Pickups" subtitle={`${completed.length} collected`} onBack={() => navigate('admin-dashboard')} />
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {completed.map(p => (
          <div key={p.id} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <div className="flex justify-between mb-2"><span className="text-white font-semibold">{p.trackingId}</span><CheckCircle2 className="w-5 h-5 text-emerald-400" /></div>
            <p className="text-zinc-400 text-sm">{p.studentName} · {p.description}</p>
            {p.collectedAt && <p className="text-zinc-500 text-xs mt-1">Collected: {new Date(p.collectedAt).toLocaleString()}</p>}
          </div>
        ))}
        {completed.length === 0 && <div className="text-center py-20"><Package className="w-16 h-16 text-zinc-700 mx-auto mb-4" /><p className="text-zinc-400">No completed pickups yet</p></div>}
      </div>
    </div>
  );
}

function ReportsAnalyticsScreen({ navigate }: any) {
  const { parcels, lockers, students } = useStore();
  const total = parcels.length;
  const collected = parcels.filter(p => p.status === 'collected').length;
  const ready = parcels.filter(p => p.status === 'ready').length;
  const pending = parcels.filter(p => p.status === 'pending').length;
  const collectRate = total > 0 ? Math.round((collected / total) * 100) : 0;

  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-10">
      <ScreenHeader title="Reports & Analytics" subtitle="System overview" onBack={() => navigate('admin-dashboard')} />
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Parcels', value: total, icon: <Package className="w-6 h-6 text-blue-400" /> },
            { label: 'Collected', value: collected, icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" /> },
            { label: 'Ready', value: ready, icon: <Key className="w-6 h-6 text-orange-400" /> },
            { label: 'Pending', value: pending, icon: <Clock className="w-6 h-6 text-yellow-400" /> },
          ].map(s => (
            <div key={s.label} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              {s.icon}
              <p className="text-2xl font-bold text-white mt-2">{s.value}</p>
              <p className="text-zinc-400 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          <div className="flex justify-between mb-3"><span className="text-white font-semibold">Pickup Rate</span><span className="text-emerald-400 font-bold">{collectRate}%</span></div>
          <div className="w-full bg-zinc-800 rounded-full h-3"><div className="bg-gradient-to-r from-emerald-500 to-blue-500 h-full rounded-full" style={{ width: `${collectRate}%` }} /></div>
          <p className="text-zinc-500 text-xs mt-2">{collected} of {total} parcels collected</p>
        </div>
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 space-y-3">
          <p className="text-white font-semibold">Locker Utilization</p>
          {['A', 'B', 'C'].map(sec => {
            const sl = lockers.filter(l => l.section === sec);
            const occ = sl.filter(l => l.isOccupied).length;
            const pct = Math.round((occ / sl.length) * 100);
            return (
              <div key={sec}>
                <div className="flex justify-between text-sm mb-1"><span className="text-zinc-400">Section {sec}</span><span className="text-white">{occ}/{sl.length}</span></div>
                <div className="w-full bg-zinc-800 rounded-full h-2"><div className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          <p className="text-white font-semibold mb-3">Students</p>
          <p className="text-3xl font-bold text-white">{students.length}</p>
          <p className="text-zinc-400 text-sm">Registered students</p>
        </div>
      </div>
    </div>
  );
}

function AdminNotificationsScreen({ navigate }: any) {
  const { parcels } = useStore();
  const pending = parcels.filter(p => p.status === 'pending');
  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-10">
      <ScreenHeader title="Admin Alerts" subtitle="System notifications" onBack={() => navigate('admin-dashboard')} />
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {pending.map(p => (
          <div key={p.id} className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-sm">Parcel Awaiting Assignment</p>
                <p className="text-zinc-400 text-sm">{p.trackingId} · {p.studentName}</p>
                <p className="text-zinc-500 text-xs mt-1">Arrived: {new Date(p.arrivedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
        {pending.length === 0 && (
          <div className="text-center py-20"><CheckCircle2 className="w-16 h-16 text-zinc-700 mx-auto mb-4" /><p className="text-zinc-400">No pending alerts</p></div>
        )}
      </div>
    </div>
  );
}

// ─── Settings & Misc ──────────────────────────────────────────────────────────

function AppSettingsScreen({ navigate }: any) {
  const { currentRole } = useStore();
  const back = currentRole === 'admin' ? 'admin-dashboard' : 'user-profile';
  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-10">
      <ScreenHeader title="App Settings" subtitle="Configure app" onBack={() => navigate(back)} />
      <div className="flex-1 px-6 py-6 space-y-3">
        {[
          { label: 'Help & Support', icon: <HelpCircle className="w-5 h-5 text-zinc-400" />, route: 'help-support' },
          { label: 'FAQ', icon: <Info className="w-5 h-5 text-zinc-400" />, route: 'faq' },
          { label: 'Send Feedback', icon: <MessageSquare className="w-5 h-5 text-zinc-400" />, route: 'feedback' },
          { label: 'Contact Support', icon: <Phone className="w-5 h-5 text-zinc-400" />, route: 'contact-support' },
        ].map(item => (
          <button key={item.label} onClick={() => navigate(item.route as Screen)} className="w-full bg-zinc-900 rounded-2xl px-4 py-4 border border-zinc-800 flex items-center justify-between hover:border-purple-500/50 transition-colors">
            <div className="flex items-center gap-3">{item.icon}<span className="text-white">{item.label}</span></div>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </button>
        ))}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 text-center mt-4">
          <p className="text-zinc-500 text-sm">ParcelVault v1.0.0</p>
          <p className="text-zinc-600 text-xs mt-1">Smart Campus Locker System</p>
        </div>
      </div>
    </div>
  );
}

function HelpSupportScreen({ navigate }: any) {
  const { currentRole } = useStore();
  const back = currentRole === 'admin' ? 'admin-dashboard' : 'user-profile';
  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-10">
      <ScreenHeader title="Help & Support" subtitle="Get assistance" onBack={() => navigate(back)} />
      <div className="flex-1 px-6 py-6 space-y-3">
        {[
          { label: 'FAQ', sub: 'Common questions', icon: <HelpCircle className="w-5 h-5 text-purple-400" />, route: 'faq' },
          { label: 'Contact Support', sub: 'Reach our team', icon: <MessageSquare className="w-5 h-5 text-blue-400" />, route: 'contact-support' },
          { label: 'Send Feedback', sub: 'Share your thoughts', icon: <MessageSquare className="w-5 h-5 text-emerald-400" />, route: 'feedback' },
        ].map(item => (
          <button key={item.label} onClick={() => navigate(item.route as Screen)} className="w-full bg-zinc-900 rounded-2xl p-5 border border-zinc-800 text-left flex items-center gap-4 hover:border-purple-500/50 transition-colors">
            <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center">{item.icon}</div>
            <div className="flex-1"><p className="text-white font-semibold">{item.label}</p><p className="text-zinc-400 text-sm">{item.sub}</p></div>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </button>
        ))}
      </div>
    </div>
  );
}

function FAQScreen({ navigate }: any) {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: 'How do I collect my parcel?', a: 'Go to My Parcels, select the parcel with "Ready" status, and tap "Enter OTP to Collect". Enter the 6-digit OTP given by the admin.' },
    { q: 'How long can I keep a parcel in the locker?', a: 'Parcels must be collected within 5 days of locker assignment. You\'ll get reminders before expiry.' },
    { q: 'What if my OTP doesn\'t work?', a: 'Contact the admin to regenerate a new OTP. The admin can do this from the Generate OTP screen.' },
    { q: 'How will I know when my parcel arrives?', a: 'You\'ll receive a notification as soon as the admin assigns a locker and generates an OTP for your parcel.' },
    { q: 'Can I see which locker my parcel is in?', a: 'Yes! Go to My Parcels or the Assigned Locker screen to see the locker number assigned to your parcel.' },
  ];
  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-10">
      <ScreenHeader title="FAQ" subtitle="Common questions" onBack={() => navigate('help-support')} />
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full p-4 text-left flex items-center justify-between">
              <span className="text-white font-medium pr-4 text-sm">{faq.q}</span>
              <ChevronDown className={`w-5 h-5 text-zinc-400 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <div className="px-4 pb-4"><p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactSupportScreen({ navigate, showToast }: any) {
  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-10">
      <ScreenHeader title="Contact Support" subtitle="Reach our team" onBack={() => navigate('help-support')} />
      <div className="flex-1 px-6 py-6 space-y-4">
        <InputField icon={<User className="w-5 h-5" />} label="Your Name" placeholder="Full name" />
        <InputField icon={<Mail className="w-5 h-5" />} label="Email" type="email" placeholder="your@email.com" />
        <div className="space-y-1.5">
          <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Message</label>
          <textarea placeholder="Describe your issue…" rows={5} className="w-full bg-zinc-900 text-white px-4 py-4 rounded-2xl border border-zinc-800 focus:border-purple-500 focus:outline-none resize-none placeholder:text-zinc-600" />
        </div>
        <PrimaryBtn onClick={() => { showToast('Message sent!', 'success'); navigate('help-support'); }}>Send Message</PrimaryBtn>
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 space-y-2">
          <p className="text-zinc-400 text-sm flex items-center gap-2"><Mail className="w-4 h-4" />support@parcelvault.edu</p>
          <p className="text-zinc-400 text-sm flex items-center gap-2"><Phone className="w-4 h-4" />+91 99999 00000</p>
        </div>
      </div>
    </div>
  );
}

function FeedbackScreen({ navigate, showToast }: any) {
  const [rating, setRating] = useState(0);
  return (
    <div className="size-full flex flex-col bg-zinc-950 pb-10">
      <ScreenHeader title="Feedback" subtitle="Share your thoughts" onBack={() => navigate('help-support')} />
      <div className="flex-1 px-6 py-6 space-y-4">
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 text-center">
          <p className="text-white font-semibold mb-4">How was your experience?</p>
          <div className="flex justify-center gap-3">
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setRating(s)} className={`text-4xl transition-transform ${s <= rating ? 'scale-110' : 'scale-100'}`}>
                {s <= rating ? '⭐' : '☆'}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Your Feedback</label>
          <textarea placeholder="Tell us what you think…" rows={6} className="w-full bg-zinc-900 text-white px-4 py-4 rounded-2xl border border-zinc-800 focus:border-purple-500 focus:outline-none resize-none placeholder:text-zinc-600" />
        </div>
        <PrimaryBtn onClick={() => { showToast('Thank you for your feedback!', 'success'); navigate('help-support'); }}>Submit Feedback</PrimaryBtn>
      </div>
    </div>
  );
}

function LogoutConfirmationScreen({ onCancel, onLogout }: { onCancel: () => void; onLogout: () => void }) {
  return (
    <div className="size-full flex flex-col items-center justify-center bg-zinc-950 px-6">
      <div className="w-24 h-24 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6">
        <LogOut className="w-12 h-12 text-red-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Logout</h2>
      <p className="text-zinc-400 text-center mb-10">Are you sure you want to logout from ParcelVault?</p>
      <div className="w-full max-w-md space-y-3">
        <button onClick={onLogout} className="w-full bg-red-500/10 border border-red-500/30 text-red-400 py-4 rounded-2xl font-semibold hover:bg-red-500/20 transition-colors">Confirm Logout</button>
        <SecondaryBtn onClick={onCancel}>Cancel</SecondaryBtn>
      </div>
    </div>
  );
}
