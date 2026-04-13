import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Trophy, Target, BookOpen } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface GoalTrackerProps {
  completed: number;
  goal: number;
  currentReading: number;
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({ completed, goal, currentReading }) => {
  const percentage = Math.min(Math.round((completed / goal) * 100), 100);
  
  const data = [
    { name: 'Completed', value: completed },
    { name: 'Remaining', value: Math.max(goal - completed, 0) },
  ];
  
  const COLORS = ['#141414', '#e5e5e5'];

  return (
    <Card className="border-none shadow-lg bg-white/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
          <Target className="w-4 h-4" />
          2024 Reading Goal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-3xl font-black tracking-tighter">{completed} / {goal}</p>
            <p className="text-xs text-muted-foreground font-medium uppercase">Books Finished</p>
          </div>
          <div className="h-20 w-20">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={25}
                  outerRadius={35}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
            <span>Progress</span>
            <span>{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2 bg-muted" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-white/80 rounded-xl p-3 shadow-sm border border-black/5">
            <Trophy className="w-4 h-4 mb-1 text-yellow-600" />
            <p className="text-lg font-bold leading-none">{completed}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Completed</p>
          </div>
          <div className="bg-white/80 rounded-xl p-3 shadow-sm border border-black/5">
            <BookOpen className="w-4 h-4 mb-1 text-blue-600" />
            <p className="text-lg font-bold leading-none">{currentReading}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Reading</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
