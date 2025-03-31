
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Settings, BookOpen, Heart, Clock, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import MobileNavBar from '@/components/MobileNavBar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

const ProfilePage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [voiceGuidance, setVoiceGuidance] = useState(true);
  const [measurementSystem, setMeasurementSystem] = useState('metric');
  const { toast } = useToast();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    toast({
      description: `${!darkMode ? 'Dark' : 'Light'} mode activated`,
    });
  };

  const toggleVoiceGuidance = () => {
    setVoiceGuidance(!voiceGuidance);
    toast({
      description: `Voice guidance ${!voiceGuidance ? 'enabled' : 'disabled'}`,
    });
  };

  const toggleMeasurementSystem = () => {
    const newSystem = measurementSystem === 'metric' ? 'imperial' : 'metric';
    setMeasurementSystem(newSystem);
    toast({
      description: `Switched to ${newSystem} measurements`,
    });
  };
  
  return (
    <div className="pb-20 min-h-screen">
      {/* Header with Filipino-inspired design */}
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-kusina-orange to-kusina-brown opacity-80"></div>
        <div className="relative p-4 text-white">
          <h1 className="text-xl font-bold">Profile</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-6">
        {/* User Profile with Filipino-inspired design */}
        <Card className="overflow-hidden border-2 border-kusina-orange/20">
          <div className="h-24 bg-gradient-to-r from-kusina-orange/30 to-kusina-brown/30 relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-30">
              <img 
                src="https://images.unsplash.com/photo-1543363950-c78545037afc?q=80&w=1856" 
                alt="Filipino Pattern" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
          <CardContent className="p-6 flex items-center gap-4 -mt-10">
            <Avatar className="h-20 w-20 border-4 border-card">
              <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1780" alt="User" />
              <AvatarFallback>JS</AvatarFallback>
            </Avatar>
            <div className="pt-8">
              <h2 className="font-bold text-lg">Juan Santos</h2>
              <p className="text-sm text-muted-foreground">Home cook enthusiast</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs font-normal">
                  18 recipes cooked
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Stats with Filipino-inspired design */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-2 border-kusina-orange/20">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <BookOpen className="h-8 w-8 text-kusina-orange mb-2" />
              <span className="text-2xl font-bold">18</span>
              <span className="text-xs text-muted-foreground">Recipes Cooked</span>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-kusina-red/20">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <Heart className="h-8 w-8 text-kusina-red mb-2" />
              <span className="text-2xl font-bold">5</span>
              <span className="text-xs text-muted-foreground">Favorites</span>
            </CardContent>
          </Card>
        </div>

        {/* Preferences Preview */}
        <Card className="border-2 border-kusina-green/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Dark Mode</p>
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Voice Guidance</p>
              </div>
              <Switch checked={voiceGuidance} onCheckedChange={toggleVoiceGuidance} />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Measurement System</p>
              </div>
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={toggleMeasurementSystem}>
                {measurementSystem === 'metric' ? 'Metric' : 'Imperial'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-2">
          <Link to="/settings">
            <Card className="border-2 border-kusina-orange/10 hover:border-kusina-orange/30">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-center">
                  <Settings className="mr-2 h-5 w-5 text-kusina-orange" />
                  <span>Settings</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/cooking-history">
            <Card className="border-2 border-kusina-brown/10 hover:border-kusina-brown/30">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-kusina-brown" />
                  <span>Cooking History</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
          
          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </div>

        {/* Connect to Supabase CTA with Filipino design */}
        <Card className="bg-gradient-to-r from-kusina-green/20 to-kusina-cream/30 border-2 border-kusina-green/20">
          <CardHeader>
            <CardTitle className="text-base">Connect to Database</CardTitle>
            <CardDescription>
              Save your recipes, shopping lists, and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-kusina-green hover:bg-kusina-green/80">Connect to Supabase</Button>
          </CardContent>
        </Card>
      </main>

      {/* Mobile Nav Bar */}
      <MobileNavBar />
    </div>
  );
};

export default ProfilePage;
