
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import voiceService from '@/services/voiceService';

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
  onRestartTimer: () => void;
  timerRunning: boolean;
  remainingTime: number;
  onToggleVoice: () => void;
  voiceEnabled: boolean;
  sequenceMode?: boolean;
}

const RecipeStepCard: React.FC<RecipeStepCardProps> = ({
  step,
  isActive,
  isCompleted,
  onStartTimer,
  onStopTimer,
  onRestartTimer,
  timerRunning,
  remainingTime,
  onToggleVoice,
  voiceEnabled,
  sequenceMode = false,
}) => {
  useEffect(() => {
    // When a step becomes active and voice is enabled, read the instruction
    if (isActive && voiceEnabled && !isCompleted) {
      const announcement = `Step ${step.number}. ${step.instruction}`;
      voiceService.speak(announcement, { stepNumber: step.number });
    }
  }, [isActive, step, voiceEnabled, isCompleted]);

  // Format remaining time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Reliable food image fallbacks from Unsplash
  const getFallbackImage = () => {
    const fallbackImages = [
      "https://images.unsplash.com/photo-1556040220-4096d522378d?q=80&w=1887&auto=format&fit=crop",  // Filipino food 1
      "https://images.unsplash.com/photo-1617611647086-baf8019744ab?q=80&w=2070",  // Filipino food 2
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=2070",  // Filipino food 3
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=2072", // Food cooking
      "https://images.unsplash.com/photo-1518739745383-0ef26e9dd7fd?q=80&w=1886" // Food preparation
    ];
    
    // Use step number to determine which fallback to use (cycling through options)
    return fallbackImages[step.number % fallbackImages.length];
  };

  const handleToggleVoice = () => {
    onToggleVoice();
    
    // If enabling voice, immediately request permission and speak the instruction
    if (!voiceEnabled && isActive) {
      const announcement = `Step ${step.number}. ${step.instruction}`;
      // The force:true will ensure it speaks after permission is granted
      voiceService.speak(announcement, { force: true, stepNumber: step.number });
    }
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
            {sequenceMode && step.number <= voiceService.lastSpokenStep && (
              <Badge variant="secondary" className="text-xs">Spoken</Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleVoice}
            className="h-8 w-8"
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </Button>
        </div>

        <p className="text-sm mb-3">{step.instruction}</p>

        {step.imageUrl && (
          <div className="mb-3 relative" style={{ height: '9rem', overflow: 'hidden' }}>
            <img 
              src={step.imageUrl} 
              alt={`Step ${step.number}`} 
              className="rounded-md w-full h-36 object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = getFallbackImage();
              }}
            />
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
            <div className="flex gap-1">
              {timerRunning ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={onStopTimer}
                >
                  <Pause size={14} /> Pause
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1"
                  onClick={onStartTimer}
                >
                  <Play size={14} /> Start
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={onRestartTimer}
              >
                <RefreshCw size={14} /> Reset
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecipeStepCard;
