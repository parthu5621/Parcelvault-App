import { Package, ArrowRight } from 'lucide-react';

interface Onboarding1Props {
  onNext: () => void;
  onSkip: () => void;
}

export function Onboarding1({ onNext, onSkip }: Onboarding1Props) {
  return (
    <div className="size-full flex flex-col bg-zinc-950">
      <div className="flex justify-end p-6">
        <button onClick={onSkip} className="text-zinc-400 hover:text-white transition-colors">
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-64 h-64 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mb-8">
          <Package className="w-32 h-32 text-blue-400" strokeWidth={1.5} />
        </div>

        <h2 className="text-3xl font-bold text-white mb-4 text-center">Secure Package Storage</h2>
        <p className="text-zinc-400 text-center mb-8 px-4">
          Store your packages safely in our smart lockers with 24/7 access and real-time notifications
        </p>

        <div className="flex gap-2 mb-8">
          <div className="w-8 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
          <div className="w-2 h-2 bg-zinc-700 rounded-full"></div>
          <div className="w-2 h-2 bg-zinc-700 rounded-full"></div>
        </div>
      </div>

      <div className="p-6">
        <button
          onClick={onNext}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          Next
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
