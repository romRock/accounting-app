'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Button } from '@/components/ui/button';

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTransactionTab, setActiveTransactionTab] = useState<'outward' | 'inward'>('outward');
  const [activeReport, setActiveReport] = useState<'outward' | 'inward' | 'combo' | 'outward-centerwise' | 'inward-centerwise' | 'amount-type' | 'customer'>('outward');
  const [activeMasterTab, setActiveMasterTab] = useState<'users' | 'roles' | 'centers' | 'clients'>('users');
  const [activeBalanceSheetTab, setActiveBalanceSheetTab] = useState<'final' | 'statutory'>('final');
  const [activeAccountingTab, setActiveAccountingTab] = useState<'accounts' | 'category' | 'reports'>('accounts');
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Global keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'd', action: () => router.push('/'), description: 'Navigate to Dashboard' },
    { key: 't', action: () => router.push('/transactions'), description: 'Navigate to Transactions' },
    { key: 'a', action: () => router.push('/accounting'), description: 'Navigate to Accounting' },
    { key: 's', action: () => router.push('/spl'), description: 'Navigate to Special Entry' },
    { key: 'b', action: () => router.push('/balance-sheet'), description: 'Navigate to Balance Sheet' },
    { key: 'r', action: () => router.push('/reports'), description: 'Navigate to Reports' },
    { key: 'm', action: () => router.push('/master'), description: 'Navigate to Master' },
    { key: 'h', action: () => router.push('/help'), description: 'Navigate to Help' },
  ]);

  useEffect(() => {
    // Listen for tab changes from transactions page
    const handleTabChange = (e: CustomEvent) => {
      setActiveTransactionTab(e.detail);
    };

    // Listen for report changes from reports page
    const handleReportChange = (e: CustomEvent) => {
      setActiveReport(e.detail);
    };

    // Listen for master tab changes from master page
    const handleMasterTabChange = (e: CustomEvent) => {
      setActiveMasterTab(e.detail);
    };

    // Listen for balance sheet tab changes from balance sheet page
    const handleBalanceSheetTabChange = (e: CustomEvent) => {
      setActiveBalanceSheetTab(e.detail);
    };

    // Listen for accounting tab changes from accounting page
    const handleAccountingTabChange = (e: CustomEvent) => {
      setActiveAccountingTab(e.detail);
    };

    window.addEventListener('setTransactionTab', handleTabChange as EventListener);
    window.addEventListener('setActiveReport', handleReportChange as EventListener);
    window.addEventListener('setMasterTab', handleMasterTabChange as EventListener);
    window.addEventListener('setBalanceSheetTab', handleBalanceSheetTabChange as EventListener);
    window.addEventListener('setAccountingTab', handleAccountingTabChange as EventListener);
    
    return () => {
      window.removeEventListener('setTransactionTab', handleTabChange as EventListener);
      window.removeEventListener('setActiveReport', handleReportChange as EventListener);
      window.removeEventListener('setMasterTab', handleMasterTabChange as EventListener);
      window.removeEventListener('setBalanceSheetTab', handleBalanceSheetTabChange as EventListener);
      window.removeEventListener('setAccountingTab', handleAccountingTabChange as EventListener);
    };
  }, []);

  useEffect(() => {
    // Check authentication state with delays to allow for rehydration
    const checkAuth = () => {
      const { isAuthenticated: currentAuthState } = useAuthStore.getState();
      
      if (!currentAuthState && pathname !== '/login' && pathname !== '/signup') {
        router.push('/login');
      }
      
      // Stop checking auth after initial check
      setIsCheckingAuth(false);
    };

    // Multiple checks to ensure auth state is properly loaded
    const timer1 = setTimeout(checkAuth, 100);
    const timer2 = setTimeout(checkAuth, 300);
    
    // Also check on route changes
    if (!isAuthenticated && pathname !== '/login' && pathname !== '/signup') {
      checkAuth();
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isAuthenticated, pathname, router]);

  // Show loading state while checking auth
  if (isCheckingAuth && pathname !== '/login' && pathname !== '/signup') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (pathname === '/login' || pathname === '/signup') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          {children}
        </div>
      </div>
    );
  }

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: 'Transactions', 
      href: '/transactions', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      name: 'Accounting', 
      href: '/accounting', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      name: 'Special Entry', 
      href: '/spl', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    },
    { 
      name: 'Reports', 
      href: '/reports', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      name: 'Balance Sheet', 
      href: '/balance-sheet', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6m3 0V8a2 2 0 012-2h4a2 2 0 012 2v6" />
        </svg>
      )
    },
    { 
      name: 'Master Data', 
      href: '/master', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    { 
      name: 'Help', 
      href: '/help', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar - 20% width on desktop */}
      <div className={`hidden lg:flex lg:w-1/5 bg-white border-r border-gray-200 flex-col h-screen fixed left-0 top-0`}>
        <div className="flex items-center justify-center h-16 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Angadiya</h2>
          </div>
        </div>
        
        <nav className="flex-1 mt-8 px-4 overflow-hidden">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className={`mr-3 transition-transform duration-200 group-hover:scale-110 ${
                  pathname === item.href ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-600'
                }`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.name}</span>
                {item.name === 'Dashboard' && (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md">[ D ]</span>
                )}
                {item.name === 'Transactions' && (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md">[ T ]</span>
                )}
                {item.name === 'Accounting' && (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md">[ A ]</span>
                )}
                {item.name === 'Special Entry' && (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md">[ S ]</span>
                )}
                {item.name === 'Reports' && (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md">[ R ]</span>
                )}
                {item.name === 'Balance Sheet' && (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md">[ B ]</span>
                )}
                {item.name === 'Master Data' && (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md">[ M ]</span>
                )}
                {item.name === 'Help' && (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md">[ H ]</span>
                )}
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium shadow-lg">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.email}
              </div>
              <div className="text-xs text-blue-600 font-medium">
                {user?.role?.name}
              </div>
            </div>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="w-full border-gray-300 text-gray-50 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400 transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content Area - 80% width on desktop */}
      <div className="flex-1 lg:w-4/5 flex flex-col overflow-hidden lg:ml-[20%]">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 fixed w-full top-0 bg-white z-50">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
              
              {/* Transaction Tabs - Only show on transactions page */}
              {pathname === '/transactions' && (
                <div className="flex items-center space-x-1 fixed">
                  <button
                    onClick={() => {
                      setActiveTransactionTab('outward');
                      // Dispatch event for transactions page
                      const event = new CustomEvent('setTransactionTab', { detail: 'outward' });
                      window.dispatchEvent(event);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                      activeTransactionTab === 'outward'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Outward Booking
                  </button>
                  <button
                    onClick={() => {
                      setActiveTransactionTab('inward');
                      // Dispatch event for transactions page
                      const event = new CustomEvent('setTransactionTab', { detail: 'inward' });
                      window.dispatchEvent(event);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                      activeTransactionTab === 'inward'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Inward Booking
                  </button>
                </div>
              )}
              
              {/* Master Tabs - Only show on master page */}
              {pathname === '/master' && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setActiveMasterTab('users');
                      // Dispatch event for master page
                      const event = new CustomEvent('setMasterTab', { detail: 'users' });
                      window.dispatchEvent(event);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                      activeMasterTab === 'users'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Users
                  </button>
                  <button
                    onClick={() => {
                      setActiveMasterTab('roles');
                      // Dispatch event for master page
                      const event = new CustomEvent('setMasterTab', { detail: 'roles' });
                      window.dispatchEvent(event);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                      activeMasterTab === 'roles'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Roles & Permissions
                  </button>
                  <button
                    onClick={() => {
                      setActiveMasterTab('centers');
                      // Dispatch event for master page
                      const event = new CustomEvent('setMasterTab', { detail: 'centers' });
                      window.dispatchEvent(event);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                      activeMasterTab === 'centers'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Centers
                  </button>
                  <button
                    onClick={() => {
                      setActiveMasterTab('clients');
                      // Dispatch event for master page
                      const event = new CustomEvent('setMasterTab', { detail: 'clients' });
                      window.dispatchEvent(event);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                      activeMasterTab === 'clients'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Clients
                  </button>
                </div>
              )}
              
              {/* Balance Sheet Tabs - Only show on balance sheet page */}
              {pathname === '/balance-sheet' && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setActiveBalanceSheetTab('final');
                      // Dispatch event for balance sheet page
                      const event = new CustomEvent('setBalanceSheetTab', { detail: 'final' });
                      window.dispatchEvent(event);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                      activeBalanceSheetTab === 'final'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Final Balance Sheet
                  </button>
                  <button
                    onClick={() => {
                      setActiveBalanceSheetTab('statutory');
                      // Dispatch event for balance sheet page
                      const event = new CustomEvent('setBalanceSheetTab', { detail: 'statutory' });
                      window.dispatchEvent(event);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                      activeBalanceSheetTab === 'statutory'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Statutory Balance Sheet
                  </button>
                </div>
              )}
              
              {/* Accounting Tabs - Only show on accounting page */}
              {pathname === '/accounting' && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setActiveAccountingTab('accounts');
                      // Dispatch event for accounting page
                      const event = new CustomEvent('setAccountingTab', { detail: 'accounts' });
                      window.dispatchEvent(event);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                      activeAccountingTab === 'accounts'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Accounts
                  </button>
                  <button
                    onClick={() => {
                      setActiveAccountingTab('category');
                      // Dispatch event for accounting page
                      const event = new CustomEvent('setAccountingTab', { detail: 'category' });
                      window.dispatchEvent(event);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                      activeAccountingTab === 'category'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Category
                  </button>
                  <button
                    onClick={() => {
                      setActiveAccountingTab('reports');
                      // Dispatch event for accounting page
                      const event = new CustomEvent('setAccountingTab', { detail: 'reports' });
                      window.dispatchEvent(event);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                      activeAccountingTab === 'reports'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Reports
                  </button>
                </div>
              )}
              
              {/* Dashboard Controls - Only show on dashboard page */}
              {pathname === '/dashboard' && (
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onChange={(e) => {
                      // Dispatch event for dashboard page
                      const event = new CustomEvent('setDashboardDate', { detail: e.target.value });
                      window.dispatchEvent(event);
                    }}
                  />
                  <button
                    onClick={() => {
                      // Dispatch event for dashboard page
                      const event = new CustomEvent('refreshDashboard');
                      window.dispatchEvent(event);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
              )}
              
              {/* Reports Dropdown - Only show on reports page */}
              {pathname === '/reports' && (
                <div className="relative">
                  <button
                    onClick={() => setReportDropdownOpen(!reportDropdownOpen)}
                    className="px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm bg-blue-600 text-white shadow-sm hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <span>{activeReport.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Report</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {reportDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="py-2">
                        {[
                          { id: 'outward', name: 'Outward Report' },
                          { id: 'inward', name: 'Inward Report' },
                          { id: 'combo', name: 'Combo Report' },
                          { id: 'outward-centerwise', name: 'Outward Centerwise Report' },
                          { id: 'inward-centerwise', name: 'Inward Centerwise Report' },
                          { id: 'amount-type', name: 'Amount Type Report' },
                          { id: 'customer', name: 'Customer Transaction Report' },
                        ].map((report) => (
                          <button
                            key={report.id}
                            onClick={() => {
                              setActiveReport(report.id as any);
                              setReportDropdownOpen(false);
                              // Dispatch event for reports page
                              const event = new CustomEvent('setActiveReport', { detail: report.id });
                              window.dispatchEvent(event);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                              activeReport === report.id
                                ? 'bg-blue-50 text-blue-600 font-medium'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {report.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {user?.branch && (
                <div className="hidden sm:flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    {user.branch.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content - Scrollable area */}
        <main className="flex-1 bg-white overflow-y-auto overflow-x-hidden">
          <div className="p-2 sm:p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Mega Sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${
        sidebarOpen ? 'block' : 'hidden'
      }`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-full max-w-sm bg-white">
          <div className="flex items-center justify-center h-16 bg-white border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Angadiya</h2>
            </div>
          </div>
          
          <nav className="mt-8 px-4">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    pathname === item.href
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className={`mr-3 transition-transform duration-200 group-hover:scale-110 ${
                    pathname === item.href ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-600'
                  }`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.name}</span>
                {item.name === 'Dashboard' && (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md">[ D ]</span>
                )}
                {item.name === 'Transactions' && (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md">[ T ]</span>
                )}
                {item.name === 'Accounting' && (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md">[ A ]</span>
                )}
                {item.name === 'Balance Sheet' && (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md">[ B ]</span>
                )}
                {item.name === 'Master Data' && (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md">[ M ]</span>
                )}
                {item.name === 'Help' && (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md">[ H ]</span>
                )}
                </Link>
              ))}
            </div>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="border-t border-gray-800 pt-4">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium shadow-lg">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {user?.email}
                  </div>
                  <div className="text-xs text-blue-400 font-medium">
                    {user?.role?.name}
                  </div>
                </div>
              </div>
              <Button
                onClick={logout}
                variant="outline"
                className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-600 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
