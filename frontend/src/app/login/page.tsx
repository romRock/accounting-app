'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      
      // Perform login with a callback to handle successful authentication
      await new Promise<void>(async (resolve, reject) => {
        try {
          await login(data.email, data.password);
          
          // Wait a moment for state to be persisted
          setTimeout(() => {
            const { isAuthenticated } = useAuthStore.getState();
            if (isAuthenticated) {
              router.push('/dashboard');
              resolve();
            } else {
              setError('Login failed - please try again');
              reject(new Error('Authentication failed'));
            }
          }, 100);
        } catch (error) {
          reject(error);
        }
      });
      
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center px-4">
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <Image
          src="/images/login-bg.png"
          alt="Login Background"
          fill
          className="w-full h-full object-fill"
          priority
        />
        {/* Dark overlay to make form text readable over the background */}
        <div className="absolute inset-0 bg-black/70"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">

        <Card className="bg-gray-300 border-gray-100 shadow-2xl lg:mt-20">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-black">Sign In</CardTitle>
            <CardDescription className="text-gray-600">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-800">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@angadiya.com"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-20 transition-all duration-200"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-800">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-20 transition-all duration-200"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-red-400">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <Alert className="bg-red-900/20 border-red-800/50 text-red-400">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-200">
            © 2026 All rights reserved. <br /><br /> Romil Hingrajiya - Contact : ( +91 87806 70096 ) 
          </p>
        </div>
      </div>
    </div>
  );
}
