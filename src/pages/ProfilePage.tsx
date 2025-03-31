
import React from 'react';
import { User, Settings, BookOpen, Heart, Clock, LogOut } from 'lucide-react';
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

const ProfilePage = () => {
  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold">Profile</h1>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-6">
        {/* User Profile */}
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="https://github.com/shadcn.png" alt="User" />
              <AvatarFallback>JS</AvatarFallback>
            </Avatar>
            <div>
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

        {/* Activity Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <span className="text-2xl font-bold">18</span>
              <span className="text-xs text-muted-foreground">Recipes Cooked</span>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <Heart className="h-8 w-8 text-red-500 mb-2" />
              <span className="text-2xl font-bold">5</span>
              <span className="text-xs text-muted-foreground">Favorites</span>
            </CardContent>
          </Card>
        </div>

        {/* Preferences */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Voice Guidance</p>
                <p className="text-xs text-muted-foreground">Enable voice instructions while cooking</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Measurement System</p>
                <p className="text-xs text-muted-foreground">Choose between metric and imperial</p>
              </div>
              <Button variant="outline" size="sm" className="text-xs h-8">
                Metric
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          
          <Button variant="outline" className="w-full justify-start">
            <Clock className="mr-2 h-4 w-4" />
            Cooking History
          </Button>
          
          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </div>

        {/* Connect to Supabase CTA */}
        <Card className="bg-gradient-to-r from-kusina-orange/20 to-kusina-brown/20">
          <CardHeader>
            <CardTitle className="text-base">Connect to Database</CardTitle>
            <CardDescription>
              Connect to Supabase to save your recipes, shopping lists, and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Connect to Supabase</Button>
          </CardContent>
        </Card>
      </main>

      {/* Mobile Nav Bar */}
      <MobileNavBar />
    </div>
  );
};

export default ProfilePage;
