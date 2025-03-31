
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, History, Settings } from 'lucide-react';
import MobileNavBar from '@/components/MobileNavBar';

const ProfilePage = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-20 min-h-screen">
      <div className="bg-primary/10 py-8 px-4 text-center">
        <div className="mx-auto w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-4">
          <User className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Guest User</h1>
        <p className="text-sm text-muted-foreground mt-1">
          User
        </p>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/settings')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/cooking-history')}
            >
              <History className="mr-2 h-4 w-4" />
              Cooking History
            </Button>
          </CardContent>
        </Card>
      </div>

      <MobileNavBar />
    </div>
  );
};

export default ProfilePage;
