
import React, { useState } from 'react';
import { ArrowLeft, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import MobileNavBar from '@/components/MobileNavBar';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SettingsPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [voiceGuidance, setVoiceGuidance] = useState(true);
  const [measurementSystem, setMeasurementSystem] = useState('metric');
  const [language, setLanguage] = useState('english');
  const { toast } = useToast();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    toast({
      description: `${!darkMode ? 'Dark' : 'Light'} mode activated`,
    });
    // In a real app, this would update the theme
  };

  const toggleVoiceGuidance = () => {
    setVoiceGuidance(!voiceGuidance);
    toast({
      description: `Voice guidance ${!voiceGuidance ? 'enabled' : 'disabled'}`,
    });
  };

  const changeMeasurementSystem = (value: string) => {
    setMeasurementSystem(value);
    toast({
      description: `Measurement system changed to ${value}`,
    });
  };

  const changeLanguage = (value: string) => {
    setLanguage(value);
    toast({
      description: `Language changed to ${value}`,
    });
  };

  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <header className="p-4 border-b flex items-center gap-2">
        <Link to="/profile">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Settings</h1>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">App Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2 items-center">
                {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <div>
                  <p className="font-medium text-sm">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="flex gap-2 items-center">
                {voiceGuidance ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                <div>
                  <p className="font-medium text-sm">Voice Guidance</p>
                  <p className="text-xs text-muted-foreground">Enable voice instructions while cooking</p>
                </div>
              </div>
              <Switch checked={voiceGuidance} onCheckedChange={toggleVoiceGuidance} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Cooking Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Measurement System</p>
                <p className="text-xs text-muted-foreground">Choose between metric and imperial</p>
              </div>
              <Select value={measurementSystem} onValueChange={changeMeasurementSystem}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="metric">Metric</SelectItem>
                    <SelectItem value="imperial">Imperial</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Language</p>
                <p className="text-xs text-muted-foreground">Choose the language for recipes</p>
              </div>
              <Select value={language} onValueChange={changeLanguage}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="English" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="filipino">Filipino</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Mobile Nav Bar */}
      <MobileNavBar />
    </div>
  );
};

export default SettingsPage;
