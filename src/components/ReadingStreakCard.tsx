import React from 'react';
import { Card, CardContent } from './ui/card';
import { TrendingUp } from 'lucide-react';

export const ReadingStreakCard: React.FC = () => {
  return (
    <Card className="border-none shadow-lg bg-black text-white rounded-3xl overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <h4 className="text-xl font-bold tracking-tight">Reading Streak</h4>
        <p className="text-white/60 text-sm">
          You've read for 5 days in a row! Keep it up to reach your weekly goal.
        </p>
        <div className="flex gap-2">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <div
              key={i}
              className={`flex-1 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                i < 5
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/40'
              }`}
            >
              {day}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
