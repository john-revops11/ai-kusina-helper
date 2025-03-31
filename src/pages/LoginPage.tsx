
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChefHat, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { initializeUsers } from '@/services/authService';
import { toast } from 'sonner';

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof formSchema>;

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLoggingInAsUser, setIsLoggingInAsUser] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setErrorMessage(null);
      await login(values.email, values.password);
      navigate('/');
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Handle different error codes
      if (error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password') {
        setErrorMessage("Invalid email or password. Please try again.");
      } else if (error?.code === 'auth/too-many-requests') {
        setErrorMessage("Too many failed login attempts. Please try again later.");
      } else if (error?.code?.includes('api-key-not-valid')) {
        setErrorMessage("Authentication service is temporarily unavailable. Please try again later.");
      } else {
        setErrorMessage("Login failed. Please check your credentials and try again.");
      }
      
      toast.error(errorMessage || "Login failed. Please try again.");
    }
  };

  const handleLoginAsUser = async () => {
    try {
      setIsLoggingInAsUser(true);
      setErrorMessage(null);
      await login("user@example.com", "password123");
      toast.success("Logged in as demo user");
      navigate('/');
    } catch (error: any) {
      console.error("Demo login failed:", error);
      if (error?.code?.includes('api-key-not-valid')) {
        setErrorMessage("Authentication service is temporarily unavailable. Please try again later.");
      } else {
        setErrorMessage("Demo login failed. Please initialize users first.");
      }
      toast.error(errorMessage || "Demo login failed. Please try again.");
    } finally {
      setIsLoggingInAsUser(false);
    }
  };

  const handleInitializeUsers = async () => {
    try {
      setIsInitializing(true);
      setErrorMessage(null);
      await initializeUsers();
      toast.success("Users initialized! You can now use the demo login buttons.");
    } catch (error: any) {
      console.error("Failed to initialize users:", error);
      if (error?.code?.includes('api-key-not-valid')) {
        setErrorMessage("Authentication service is temporarily unavailable. Please try again later.");
      } else {
        setErrorMessage("Error initializing users. Please try again.");
      }
      toast.error(errorMessage || "Error initializing users. Please try again.");
    } finally {
      setIsInitializing(false);
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <div className="min-h-screen flex justify-center items-center bg-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <ChefHat className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your Kusina account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {errorMessage}
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute left-3 top-3 text-gray-400">
                          <Mail size={18} />
                        </div>
                        <Input
                          placeholder="user@example.com"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute left-3 top-3 text-gray-400">
                          <Lock size={18} />
                        </div>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="password123"
                          className="pl-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={toggleShowPassword}
                          className="absolute right-3 top-3 text-gray-400"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
          </Form>
          
          <div className="mt-4 space-y-2">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              onClick={handleLoginAsUser}
              disabled={isLoggingInAsUser}
            >
              <User size={16} />
              {isLoggingInAsUser ? "Logging in..." : "Login as Demo User"}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Don't have an account?{" "}
                <Button variant="link" className="p-0" onClick={() => navigate('/register')}>
                  Sign up
                </Button>
              </p>
            </div>
            
            <div className="pt-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleInitializeUsers}
                disabled={isInitializing}
                className="w-full"
              >
                {isInitializing ? "Initializing..." : "Initialize Demo Users"}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="text-xs text-muted-foreground text-center mt-2">
            <p>For testing:</p>
            <p>Admin: admin@example.com</p>
            <p>User: user@example.com</p>
            <p>Password: password123</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
