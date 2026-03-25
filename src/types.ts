export type Verdict = 'OUT' | 'NOT OUT' | 'UNCLEAR';

export interface DecisionResult {
  id: string;
  timestamp: number;
  image: string; // base64
  verdict: Verdict;
  dismissal_type: string;
  confidence: number;
  reason: string;
  ball_tracking: string;
  advice?: string;
  appealType: string;
  context?: string;
}

export type AppealType = 'LBW' | 'Caught' | 'Run Out' | 'Stumped' | 'Bowled';
