import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DecisionResult } from '../types';
import { CheckCircle, XCircle, HelpCircle, Info, Activity } from 'lucide-react';

interface DecisionDisplayProps {
  result: DecisionResult | null;
  onClose: () => void;
}

export const DecisionDisplay: React.FC<DecisionDisplayProps> = ({ result, onClose }) => {
  if (!result) return null;

  const isOut = result.verdict === 'OUT';
  const isNotOut = result.verdict === 'NOT OUT';
  const isUnclear = result.verdict === 'UNCLEAR';

  const colorClass = isOut ? 'text-cricket-red' : isNotOut ? 'text-cricket-green' : 'text-yellow-500';
  const bgClass = isOut ? 'bg-cricket-red/10' : isNotOut ? 'bg-cricket-green/10' : 'bg-yellow-500/10';
  const borderClass = isOut ? 'border-cricket-red' : isNotOut ? 'border-cricket-green' : 'border-yellow-500';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <div className={`w-full max-w-md bg-cricket-dark border-2 ${borderClass} rounded-3xl overflow-hidden shadow-2xl`}>
          <div className={`p-8 text-center ${bgClass}`}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="flex justify-center mb-4"
            >
              {isOut && <XCircle size={80} className="text-cricket-red" />}
              {isNotOut && <CheckCircle size={80} className="text-cricket-green" />}
              {isUnclear && <HelpCircle size={80} className="text-yellow-500" />}
            </motion.div>
            
            <h2 className={`text-6xl font-display mb-2 ${colorClass}`}>
              {result.verdict}
            </h2>
            <p className="text-white/60 uppercase tracking-widest text-sm font-medium">
              {result.dismissal_type} • {result.confidence}% Confidence
            </p>
          </div>

          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/40 text-xs uppercase font-bold tracking-wider">
                <Info size={14} />
                <span>Reasoning</span>
              </div>
              <p className="text-white/90 leading-relaxed italic">
                "{result.reason}"
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/40 text-xs uppercase font-bold tracking-wider">
                <Activity size={14} />
                <span>Ball Tracking</span>
              </div>
              <p className="text-white/80 text-sm">
                {result.ball_tracking}
              </p>
            </div>

            {result.advice && (
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-white/60 text-xs italic">
                  Umpire's Note: {result.advice}
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              className={`w-full py-4 rounded-xl font-display text-xl transition-all active:scale-95 ${
                isOut ? 'bg-cricket-red hover:bg-cricket-red/80' : 
                isNotOut ? 'bg-cricket-green hover:bg-cricket-green/80' : 
                'bg-yellow-500 hover:bg-yellow-500/80'
              } text-white shadow-lg`}
            >
              NEXT DELIVERY
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
