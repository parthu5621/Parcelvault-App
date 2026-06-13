import { Package } from 'lucide-react';
import { useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950">
      <div className="animate-bounce">
        <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/30">
          <Package className="w-14 h-14 text-white" strokeWidth={2} />
        </div>
      </div>
      <h1 className="text-4xl font-bold text-white mt-8 mb-2">ParcelVault</h1>
      <p className="text-zinc-400">Smart Package Locker System</p>
      <div className="mt-12 flex gap-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}
