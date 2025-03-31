
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type RecipeStep = {
  id: string;
  number: number;
  instruction: string;
  imageUrl?: string;
  timeInMinutes: number;
  isCritical?: boolean;
};

interface RecipeStepCardProps {
  step: RecipeStep;
  isActive: boolean;
  isCompleted: boolean;
  onStartTimer: () => void;
  onStopTimer: () => void;
  timerRunning: boolean;
  remainingTime: number;
  onToggleVoice: () => void;
  voiceEnabled: boolean;
}

const RecipeStepCard: React.FC<RecipeStepCardProps> = ({
  step,
  isActive,
  isCompleted,
  onStartTimer,
  onStopTimer,
  timerRunning,
  remainingTime,
  onToggleVoice,
  voiceEnabled,
}) => {
  // Format remaining time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Card className={`mb-4 transition-all duration-300 ${isActive ? 'ring-2 ring-primary' : ''} ${isCompleted ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-full h-6 w-6 flex items-center justify-center p-0">
              {step.number}
            </Badge>
            {step.isCritical && (
              <Badge variant="destructive" className="text-xs">Critical Step</Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleVoice}
            className="h-8 w-8"
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </Button>
        </div>

        <p className="text-sm mb-3">{step.instruction}</p>

        {step.imageUrl && (
          <div className="mb-3">
            <img src={step.imageUrl} alt={`Step ${step.number}`} className="rounded-md w-full h-36 object-cover" />
          </div>
        )}

        {step.timeInMinutes > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm">
              <span className="text-muted-foreground mr-2">Time:</span>
              {timerRunning ? (
                <span className="font-semibold animate-pulse-slow">{formatTime(remainingTime)}</span>
              ) : (
                <span>{step.timeInMinutes} min</span>
              )}
            </div>
            <Button
              variant={timerRunning ? "outline" : "default"}
              size="sm"
              className="gap-1"
              onClick={timerRunning ? onStopTimer : onStartTimer}
            >
              {timerRunning ? (
                <>
                  <Pause size={14} /> Pause
                </>
              ) : (
                <>
                  <Play size={14} /> Start Timer
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecipeStepCard;
