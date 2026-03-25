import React, { useState, useEffect } from 'react';
import { CameraView } from './components/CameraView';
import { DecisionDisplay } from './components/DecisionDisplay';
import { HistoryList } from './components/HistoryList';
import { analyzeDismissal } from './services/gemini';
import { DecisionResult, AppealType } from './types';
import { Shield, MessageSquare, History, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const APPEAL_TYPES: AppealType[] = ['LBW', 'Caught', 'Run Out', 'Stumped', 'Bowled'];

export default function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResult, setCurrentResult] = useState<DecisionResult | null>(null);
  const [history, setHistory] = useState<DecisionResult[]>([]);
  const [appealType, setAppealType] = useState<AppealType>('LBW');
  const [context, setContext] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('umpire_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('umpire_history', JSON.stringify(history));
  }, [history]);

  const handleCapture = async (image: string) => {
    setIsProcessing(true);
    try {
      const aiResponse = await analyzeDismissal(image, appealType, context);
      
      const newResult: DecisionResult = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        image,
        appealType,
        context,
        verdict: aiResponse.verdict || 'UNCLEAR',
        dismissal_type: aiResponse.dismissal_type || appealType,
        confidence: aiResponse.confidence || 0,
        reason: aiResponse.reason || 'No reason provided.',
        ball_tracking: aiResponse.ball_tracking || 'No tracking data.',
        advice: aiResponse.advice,
      };

      setCurrentResult(newResult);
      setHistory(prev => [newResult, ...prev].slice(0, 10));
      setContext(''); // Reset context
    } catch (error) {
      console.error("Analysis error:", error);
      alert("AI Analysis failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm("Clear all decision history?")) {
      setHistory([]);
    }
  };

  return (
    <div className="min-h-screen bg-cricket-dark text-white font-sans overflow-x-hidden">
      <div className="max-w-[480px] mx-auto px-4 py-8 relative">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cricket-green rounded-xl shadow-lg shadow-cricket-green/20">
              <Shield size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-display tracking-wider">
              AI THIRD <span className="text-cricket-green">UMPIRE</span>
            </h1>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-3 rounded-xl transition-all ${
              showHistory ? 'bg-cricket-green text-white' : 'bg-white/5 text-white/40'
            }`}
          >
            <History size={20} />
          </button>
        </header>

        <AnimatePresence mode="wait">
          {showHistory ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <HistoryList
                history={history}
                onClear={clearHistory}
                onSelect={(item) => {
                  setCurrentResult(item);
                  setShowHistory(false);
                }}
              />
              {history.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-white/20">
                  <Trophy size={64} className="mb-4 opacity-10" />
                  <p className="font-display text-2xl tracking-widest">NO DECISIONS YET</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="camera"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="space-y-8"
            >
              {/* Camera Section */}
              <div className="relative">
                <CameraView onCapture={handleCapture} isProcessing={isProcessing} />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl z-10">
                    <div className="w-12 h-12 border-4 border-cricket-green border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="font-display text-xl tracking-widest animate-pulse">REFERRING TO THIRD UMPIRE...</p>
                  </div>
                )}
              </div>

              {/* Appeal Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white/40 text-xs uppercase font-bold tracking-wider px-1">
                  <Shield size={14} />
                  <span>Select Appeal Type</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {APPEAL_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setAppealType(type)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        appealType === type
                          ? 'bg-cricket-green text-white shadow-lg shadow-cricket-green/20 scale-105'
                          : 'bg-white/5 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Context Input */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white/40 text-xs uppercase font-bold tracking-wider px-1">
                  <MessageSquare size={14} />
                  <span>Optional Context</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="e.g. 'Ball hit the pad first', 'Edge detected'"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-cricket-green/50 transition-colors"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decision Modal */}
        <DecisionDisplay
          result={currentResult}
          onClose={() => setCurrentResult(null)}
        />

        {/* Footer Info */}
        {!showHistory && (
          <footer className="mt-12 text-center">
            <p className="text-white/20 text-[10px] uppercase tracking-[0.2em] font-bold">
              Powered by Google Gemini AI • Street Cricket Edition
            </p>
          </footer>
        )}
      </div>
    </div>
  );
}

