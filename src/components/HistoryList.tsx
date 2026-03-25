import React from 'react';
import { DecisionResult } from '../types';
import { Clock, Trash2 } from 'lucide-react';

interface HistoryListProps {
  history: DecisionResult[];
  onClear: () => void;
  onSelect: (result: DecisionResult) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onClear, onSelect }) => {
  if (history.length === 0) return null;

  return (
    <div className="mt-12 space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-2xl font-display text-white/60 tracking-wider">
          RECENT DECISIONS
        </h3>
        <button
          onClick={onClear}
          className="p-2 text-white/20 hover:text-red-500 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-white/10">
              <img
                src={item.image}
                alt="Decision thumbnail"
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="flex-grow min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={`font-display text-xl ${
                  item.verdict === 'OUT' ? 'text-cricket-red' : 
                  item.verdict === 'NOT OUT' ? 'text-cricket-green' : 
                  'text-yellow-500'
                }`}>
                  {item.verdict}
                </span>
                <div className="flex items-center gap-1 text-white/20 text-[10px] font-bold">
                  <Clock size={10} />
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <p className="text-white/40 text-xs truncate uppercase tracking-wider">
                {item.appealType} • {item.dismissal_type}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
