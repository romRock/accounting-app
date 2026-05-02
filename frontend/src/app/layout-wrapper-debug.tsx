'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store';

export default function LayoutWrapperDebug({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for Zustand hydration to complete
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const { isAuthenticated: currentAuthState } = useAuthStore.getState();
      
      if (!currentAuthState && pathname !== '/login') {
        router.push('/login');
      }
      
      setIsCheckingAuth(false);
    };

    const timer = setTimeout(checkAuth, 500);
    
    return () => {
      clearTimeout(timer);
    };
  }, [isAuthenticated, pathname, router]);

  // Show loading state while checking auth or hydrating
  if ((isCheckingAuth || !isHydrated) && pathname !== '/login') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (pathname === '/login') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          {children}
        </div>
      </div>
    );
  }

  // Debug: Log everything to identify the issue
  console.log('DEBUG - User:', user);
  console.log('DEBUG - User role:', user?.role);
  console.log('DEBUG - User role type:', typeof user?.role);

  return (
    <div className="min-h-screen bg-white flex">
      {/* Minimal sidebar */}
      <div className="hidden lg:flex lg:w-1/5 bg-white border-r border-gray-200 flex-col h-screen fixed left-0 top-0">
        <div className="flex items-center justify-center h-16 bg-white border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Angadiya</h2>
        </div>
        
        {/* User info section - NO ROLE RENDERING */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="text-sm font-medium text-gray-900">
            User: {user?.firstName} {user?.lastName}
          </div>
          <div className="text-xs text-gray-500">
            Email: {user?.email}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Authenticated: {isAuthenticated ? 'Yes' : 'No'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:w-4/5 flex flex-col overflow-hidden lg:ml-[20%]">
        <main className="flex-1 bg-white overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
