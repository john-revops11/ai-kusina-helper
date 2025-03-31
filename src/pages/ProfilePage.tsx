
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut, History, Settings, ChefHat } from 'lucide-react';
import MobileNavBar from '@/components/MobileNavBar';

const ProfilePage = () => {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="pb-20 min-h-screen">
      <div className="bg-primary/10 py-8 px-4 text-center">
        <div className="mx-auto w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-4">
          <User className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">{currentUser?.email}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAdmin ? 'Administrator' : 'User'}
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
            
            {isAdmin && (
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/admin')}
              >
                <ChefHat className="mr-2 h-4 w-4" />
                Admin Dashboard
              </Button>
            )}
            
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>

      <MobileNavBar />
    </div>
  );
};

export default ProfilePage;
