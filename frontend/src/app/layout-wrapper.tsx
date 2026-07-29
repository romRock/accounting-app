'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AppLogo } from '@/components/app-logo';
import { useAuthStore } from '@/store';
import { useBranchStore } from '@/store/branch-store';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import ScrollToTop from '@/components/ScrollToTop';
import { SidebarStars } from '@/components/layout/sidebar-stars';
import { ExcelExportIcon, PdfExportIcon } from '@/components/icons/export-format-icons';
import TermsConsentModal from '@/components/legal/terms-consent-modal';

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const assignedBranches = useBranchStore((state) => state.assignedBranches);
  const activeTransactionBranchId = useBranchStore((state) => state.activeTransactionBranchId);
  const setActiveTransactionBranchId = useBranchStore((state) => state.setActiveTransactionBranchId);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for Zustand hydration to complete
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fromUser =
      user.branches ?? (user.branch ? [user.branch] : []);
    if (fromUser.length > 0) {
      useBranchStore.getState().setAssignedBranches(fromUser);
    }
  }, [user]);

  // Per-user single-device: if THIS user logs in elsewhere, clear this tab only
  useEffect(() => {
    if (!isHydrated || pathname === '/login') return;

    const { isAuthenticated: authed, verifySession } = useAuthStore.getState();
    if (!authed) return;

    let cancelled = false;

    const checkSession = async () => {
      const stillValid = await verifySession();
      if (!cancelled && !stillValid) {
        router.replace('/login?reason=session_revoked');
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isHydrated, pathname, router]);
  const [activeTransactionTab, setActiveTransactionTab] = useState<'outward' | 'inward'>('outward');
  const [activeReport, setActiveReport] = useState<'outward' | 'inward' | 'combo' | 'outward-centerwise' | 'inward-centerwise' | 'amount-type' | 'customer' | 'transaction-refund'>('customer');
  const [activeMasterTab, setActiveMasterTab] = useState<'users' | 'roles' | 'centers' | 'clients' | 'branches'>('users');
  const [activeBalanceSheetTab, setActiveBalanceSheetTab] = useState<'final' | 'statutory'>('final');
  const [activeAccountingTab, setActiveAccountingTab] = useState<'accounts' | 'category' | 'reports'>('accounts');
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const reportDropdownRef = useRef<HTMLDivElement>(null);

  const getSelectedReportButtonLabel = (
    report: typeof activeReport
  ): string => {
    if (report === 'outward') return 'Booking Report';
    if (report === 'inward') return 'Cutting Report';
    return `${report.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Report`;
  };

  // Close report dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reportDropdownRef.current && !reportDropdownRef.current.contains(event.target as Node)) {
        setReportDropdownOpen(false);
      }
    };

    if (reportDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [reportDropdownOpen]);

  // Global keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'd', ctrl: true, action: () => router.push('/dashboard'), description: 'Navigate to Dashboard' },
    { key: 'x', ctrl: true, action: () => router.push('/transactions'), description: 'Navigate to Transactions' },
    { key: 'a', ctrl: true, action: () => router.push('/accounting'), description: 'Navigate to Accounting' },
    { key: 'h', ctrl: true, action: () => router.push('/hawala'), description: 'Navigate to Hawala' },
    { key: 's', ctrl: true, action: () => router.push('/spl'), description: 'Navigate to Special Entry' },
    { key: 'b', ctrl: true, action: () => router.push('/balance-sheet'), description: 'Navigate to Balance Sheet' },
    { key: 'r', ctrl: true, action: () => router.push('/reports'), description: 'Navigate to Reports' },
    { key: 'm', ctrl: true, action: () => router.push('/master'), description: 'Navigate to Master' },
    { key: 'p', ctrl: true, action: () => router.push('/help'), description: 'Navigate to Help' },
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

  // Check if user has permission for a specific module
  const hasPermission = (module: string, action?: string) => {
    if (!user?.role?.permissions) return false;
    
    // Parse permissions from JSON string if needed
    let permissions;
    try {
      permissions = typeof user.role.permissions === 'string' 
        ? JSON.parse(user.role.permissions) 
        : user.role.permissions;
    } catch (error) {
      console.error('Error parsing permissions:', error);
      return false;
    }
    
    // Handle both old and new permission formats
    switch (module) {
      case 'dashboard':
        // Strict RBAC - only allow if user has explicit dashboard permission
        return permissions.dashboard?.view || permissions.dashboard?.read || false;
      case 'transactions':
        // Check both new format and old production format
        if (action === 'outward') {
          return permissions.transactions?.outward || permissions.transactions?.read || false;
        } else if (action === 'inward') {
          return permissions.transactions?.inward || permissions.transactions?.read || false;
        } else {
          return permissions.transactions?.outward || permissions.transactions?.inward || 
                 permissions.transactions?.read || false;
        }
      case 'accounting':
        // Strict RBAC - only allow if user has explicit accounting permission
        return permissions.accounting === 'all' || permissions.accounting?.read || permissions.accounting?.write;
      case 'hawala':
        // Strict RBAC - only allow if user has explicit hawala permission
        return permissions.hawala === 'all' || permissions.hawala?.read || permissions.hawala?.write;
      case 'specialEntry':
        // Strict RBAC - only allow if user has explicit specialEntry permission
        return permissions.specialEntry === 'all' || permissions.specialEntry?.read || permissions.specialEntry?.write;
      case 'reports':
        // Strict RBAC - only allow if user has explicit reports permission
        if (action && action.startsWith('report_')) {
          // Check for specific report permission
          return permissions.reports?.[action] === true;
        }
        return permissions.reports?.read || permissions.reports?.write ||
               Object.values(permissions.reports || {}).some(Boolean);
      case 'balanceSheet':
        // Strict RBAC - only allow if user has explicit balanceSheet permission
        return permissions.balanceSheet === 'all' || permissions.balanceSheet?.read || permissions.balanceSheet?.write;
      case 'master':
        // Check for backward compatibility with old masterData format
        if (permissions.masterData === 'full_access') {
          return true;
        }
        // All authenticated users can open Master → Users (self profile only)
        if (!action || action === 'users') {
          return true;
        }
        // Handle granular master permissions
        if (action === 'roles') {
          return permissions.master?.roles === 'all';
        } else if (action === 'cities') {
          return permissions.master?.cities === 'all';
        } else if (action === 'clients') {
          return permissions.master?.clients === 'all';
        } else if (action === 'branches') {
          return permissions.master?.branches === 'all';
        }
        // Check if user has any master access
        return permissions.master?.users === 'all' ||
               permissions.master?.roles === 'all' ||
               permissions.master?.cities === 'all' ||
               permissions.master?.clients === 'all' ||
               permissions.master?.branches === 'all' ||
               permissions.masterData === 'full_access' ||
               permissions.master?.read ||
               permissions.master?.write;
      default:
        return true; // Help page is always accessible
    }
  };

  // Get required permissions for a route
  const getRoutePermissions = (path: string) => {
    if (path.startsWith('/dashboard')) return { module: 'dashboard', action: 'view' };
    if (path.startsWith('/transactions')) return { module: 'transactions' };
    if (path.startsWith('/accounting')) return { module: 'accounting' };
    if (path.startsWith('/hawala')) return { module: 'hawala' };
    if (path.startsWith('/spl')) return { module: 'specialEntry' };
    if (path.startsWith('/reports')) return { module: 'reports' };
    if (path.startsWith('/balance-sheet')) return { module: 'balanceSheet' };
    if (path.startsWith('/master')) return { module: 'master' };
    // Help page doesn't require permissions
    return null;
  };

  useEffect(() => {
    // Only run auth checks after component has mounted to avoid hydration issues
    const checkAuth = () => {
      const { isAuthenticated: currentAuthState } = useAuthStore.getState();
      const isPublicPath =
        pathname === '/login' || pathname === '/' || pathname === '/terms';

      if (!currentAuthState && !isPublicPath) {
        // Default public entry is home; login is only via explicit /login or CTAs
        router.push('/');
      }

      // Logged-in users hitting the marketing home go to dashboard
      if (currentAuthState && pathname === '/') {
        router.push('/dashboard');
        setIsCheckingAuth(false);
        return;
      }

      // Check route permissions if authenticated (terms stays public for logged-in users too)
      if (currentAuthState && !isPublicPath) {
        const routePermissions = getRoutePermissions(pathname);
        if (routePermissions && !hasPermission(routePermissions.module, routePermissions.action)) {
          // Redirect to dashboard if no access
          router.push('/dashboard');
        }
      }

      // Stop checking auth after initial check
      setIsCheckingAuth(false);
    };

    // Delay auth checks to avoid hydration mismatch
    const timer = setTimeout(checkAuth, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [isAuthenticated, pathname, router]);

  // Show loading state while checking auth or hydrating - prevent any rendering until hydrated
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show loading state while checking auth (public pages render immediately)
  if (isCheckingAuth && pathname !== '/login' && pathname !== '/' && pathname !== '/terms') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (pathname === '/login' || pathname === '/' || pathname === '/terms') {
    return (
      <>
        <TermsConsentModal />
        {children}
      </>
    );
  }

  // Client ledger opens in its own tab — fullscreen view without app chrome
  if (pathname.startsWith('/reports/client-ledger')) {
    return <>{children}</>;
  }

  const allNavigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      permission: { module: 'dashboard', action: 'view' },
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: 'Transactions', 
      href: '/transactions', 
      permission: { module: 'transactions' },
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      name: 'Accounting', 
      href: '/accounting', 
      permission: { module: 'accounting' },
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      name: 'Hawala', 
      href: '/hawala', 
      permission: { module: 'hawala' },
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      name: 'Special Entry', 
      href: '/spl', 
      permission: { module: 'specialEntry' },
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    },
    { 
      name: 'Reports', 
      href: '/reports', 
      permission: { module: 'reports' },
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      name: 'Balance Sheet', 
      href: '/balance-sheet', 
      permission: { module: 'balanceSheet' },
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
      permission: { module: 'master' },
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
      permission: null, // Always accessible
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
  ];

  // Filter navigation based on user permissions - with extra safety checks
  const navigation = allNavigation.filter(item => {
    if (!item.permission) {
      return true; // Always show items without permission requirements
    }
    
    // Multiple safety checks to prevent React errors
    if (!user) {
      return false;
    }
    
    if (!user.role) {
      return false;
    }
    
    if (!user.role.permissions) {
      return false;
    }
    
    try {
      const hasAccess = hasPermission(item.permission.module, item.permission.action);
      return hasAccess;
    } catch (error) {
      console.error('Error checking permissions for navigation:', error);
      return false; // Hide item on error
    }
  });

  return (
    <>
    <TermsConsentModal />
    <div className="min-h-screen bg-white flex">
      {/* Sidebar - Collapsible on desktop */}
      <div className={`hidden lg:flex sidebar-shell flex-col h-screen fixed left-0 top-0 transition-all duration-300 ${
        isSidebarCollapsed ? 'w-16' : 'w-1/5'
      }`}>
        <div className={`sidebar-header flex items-center justify-center h-20 flex-shrink-0 ${isSidebarCollapsed ? 'px-2' : ''}`}>
          {isSidebarCollapsed ? (
            <AppLogo width={50} height={50} className="object-contain" priority />
          ) : (
            <AppLogo width={100} height={50} className="object-contain" priority />
          )}
        </div>
        
        <nav className="sidebar-nav pt-4 pb-3 min-h-0">
          <SidebarStars />
          <div className={`space-y-1.5 relative z-[2] ${isSidebarCollapsed ? 'px-2' : 'px-3'}`}>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`sidebar-nav-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                  pathname === item.href ? 'sidebar-nav-link--active' : ''
                } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                title={isSidebarCollapsed ? item.name : ''}
              >
                <span className="sidebar-nav-icon">
                  {item.icon}
                </span>
                {!isSidebarCollapsed && (
                  <>
                    <span className="ml-3 truncate">{item.name}</span>
                    {item.name === 'Dashboard' && (
                      <span className="sidebar-kbd ml-auto text-xs px-2 py-1 rounded-md hidden lg:block">[ Ctrl+D ]</span>
                    )}
                    {item.name === 'Transactions' && (
                      <span className="sidebar-kbd ml-auto text-xs px-2 py-1 rounded-md hidden lg:block">[ Ctrl+X ]</span>
                    )}
                    {item.name === 'Accounting' && (
                      <span className="sidebar-kbd ml-auto text-xs px-2 py-1 rounded-md hidden lg:block">[ Ctrl+A ]</span>
                    )}
                    {item.name === 'Hawala' && (
                      <span className="sidebar-kbd ml-auto text-xs px-2 py-1 rounded-md hidden lg:block">[ Ctrl+H ]</span>
                    )}
                    {item.name === 'Special Entry' && (
                      <span className="sidebar-kbd ml-auto text-xs px-2 py-1 rounded-md hidden lg:block">[ Ctrl+S ]</span>
                    )}
                    {item.name === 'Reports' && (
                      <span className="sidebar-kbd ml-auto text-xs px-2 py-1 rounded-md hidden lg:block">[ Ctrl+R ]</span>
                    )}
                    {item.name === 'Balance Sheet' && (
                      <span className="sidebar-kbd ml-auto text-xs px-2 py-1 rounded-md hidden lg:block">[ Ctrl+B ]</span>
                    )}
                    {item.name === 'Master Data' && (
                      <span className="sidebar-kbd ml-auto text-xs px-2 py-1 rounded-md hidden lg:block">[ Ctrl+M ]</span>
                    )}
                    {item.name === 'Help' && (
                      <span className="sidebar-kbd ml-auto text-xs px-2 py-1 rounded-md hidden lg:block">[ Ctrl+P ]</span>
                    )}
                  </>
                )}
              </Link>
            ))}
          </div>
        </nav>

        <div className={`sidebar-user-section p-4 ${isSidebarCollapsed ? 'px-2' : ''}`}>
          <div className="sidebar-user-content">
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="sidebar-avatar w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <Button
                onClick={logout}
                variant="outline"
                className="sidebar-signout p-2"
                title="Sign Out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center mb-4">
                <div className="sidebar-avatar w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {user?.email}
                  </div>
                  <div className="sidebar-role text-xs font-medium">
                    {(() => {
                      try {
                        const roleName = user?.role?.name;
                        if (typeof roleName === 'string') {
                          return roleName;
                        }
                        if (typeof roleName === 'object' && roleName !== null) {
                          console.warn('Role name is an object, converting to string');
                          return String(roleName);
                        }
                        return 'No Role';
                      } catch (error) {
                        console.error('Error rendering role name:', error);
                        return 'No Role';
                      }
                    })()}
                  </div>
                </div>
              </div>
              <Button
                onClick={logout}
                variant="outline"
                className="sidebar-signout w-full"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </Button>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Main Content Area - Adjust margin based on sidebar state */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 lg:ml-0 ${
        isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-[20%]'
      }`}>
        {/* Top Bar */}
        <div className="app-main-header flex-shrink-0 fixed w-full top-0 z-50" style={{ zIndex: 9999999 }}>
          <div className="app-main-header-inner flex items-center gap-2 px-2 sm:px-6 lg:px-8 h-14 sm:h-20">
            {/* Mobile only: small logo on the left */}
            <Link
              href="/dashboard"
              className="lg:hidden flex-shrink-0 flex items-center"
              aria-label="Home"
            >
              <AppLogo width={36} height={36} className="object-contain" priority />
            </Link>

            {/* Center: page tabs / branch / controls (scroll on mobile) */}
            <div className="flex items-center gap-2 sm:space-x-4 min-w-0 flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin-mobile">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden lg:flex relative overflow-hidden items-center justify-center rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500 via-orange-400 to-orange-500 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-orange-400/60 hover:text-white hover:from-orange-900 hover:via-gray-900 hover:to-black active:scale-95 before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent,rgba(249,115,22,0.25),transparent)] before:translate-x-[-150%] hover:before:translate-x-[150%] before:transition-transform before:duration-1000 flex-shrink-0"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <svg
                  className="h-6 w-6 relative z-10 transition-transform duration-500 group-hover:rotate-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isSidebarCollapsed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  )}
                </svg>
              </Button>
              
              {/* Branch selector — transactions, accounting, hawala, special entry */}
              {['/transactions', '/accounting', '/hawala', '/spl'].includes(pathname) &&
                assignedBranches.length > 0 && (
                <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                  {assignedBranches.length === 1 ? (
                    <div className="relative overflow-hidden items-center justify-center rounded-2xl border border-orange-500/30 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 font-medium text-xs sm:text-sm bg-orange-600 border-orange-400 text-white">
                      <span className="relative z-10">{assignedBranches[0].code}</span>
                    </div>
                  ) : (
                    <select
                      value={activeTransactionBranchId || assignedBranches[0]?.id || ''}
                      onChange={(e) => {
                        setActiveTransactionBranchId(e.target.value);
                        window.dispatchEvent(
                          new CustomEvent('setActiveBranch', { detail: e.target.value })
                        );
                        window.dispatchEvent(
                          new CustomEvent('setTransactionBranch', { detail: e.target.value })
                        );
                      }}
                      className="h-9 sm:h-10 min-w-[100px] max-w-[140px] sm:max-w-none rounded-2xl border border-orange-500/30 bg-gradient-to-br from-gray-900 via-gray-800 to-orange-950 px-2 sm:px-4 text-xs sm:text-sm font-medium text-orange-100 focus:border-orange-400 focus:outline-none"
                      aria-label="Select branch"
                    >
                      {assignedBranches.map((branch) => (
                        <option key={branch.id} value={branch.id} className="bg-gray-900 text-white">
                          {branch.name} ({branch.code})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Transaction Tabs - Only show on transactions page with RBAC */}
              {pathname === '/transactions' && (
                <div className="flex items-center gap-2 sm:space-x-3 flex-shrink-0">
                  {hasPermission('transactions', 'outward') && (
                    <button
                      onClick={() => {
                        setActiveTransactionTab('outward');
                        // Dispatch event for transactions page
                        const event = new CustomEvent('setTransactionTab', { detail: 'outward' });
                        window.dispatchEvent(event);
                      }}
                      className={`relative overflow-hidden items-center justify-center rounded-2xl border border-orange-500/30 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent,rgba(249,115,22,0.25),transparent)] before:translate-x-[-150%] hover:before:translate-x-[150%] before:transition-transform before:duration-1000 px-2.5 sm:px-4 py-1.5 sm:py-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                        activeTransactionTab === 'outward'
                          ? 'bg-orange-600 border-orange-400 text-white'
                          : 'bg-gradient-to-br from-gray-900 via-gray-800 to-orange-950 text-orange-200 hover:border-orange-400/60 hover:text-white hover:from-orange-900 hover:via-gray-900 hover:to-black'
                      }`}
                    >
                      <span className="relative z-10">Booking</span>
                    </button>
                  )}
                  {hasPermission('transactions', 'inward') && (
                    <button
                      onClick={() => {
                        setActiveTransactionTab('inward');
                        // Dispatch event for transactions page
                        const event = new CustomEvent('setTransactionTab', { detail: 'inward' });
                        window.dispatchEvent(event);
                      }}
                      className={`relative overflow-hidden items-center justify-center rounded-2xl border border-orange-500/30 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent,rgba(249,115,22,0.25),transparent)] before:translate-x-[-150%] hover:before:translate-x-[150%] before:transition-transform before:duration-1000 px-2.5 sm:px-4 py-1.5 sm:py-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                        activeTransactionTab === 'inward'
                          ? 'bg-orange-600 border-orange-400 text-white'
                          : 'bg-gradient-to-br from-gray-900 via-gray-800 to-orange-950 text-orange-200 hover:border-orange-400/60 hover:text-white hover:from-orange-900 hover:via-gray-900 hover:to-black'
                      }`}
                    >
                      <span className="relative z-10">Cutting</span>
                    </button>
                  )}
                </div>
              )}
              
              {/* Master Tabs - Only show on master page */}
              {pathname === '/master' && (
                <div className="flex items-center gap-2 sm:space-x-3 flex-shrink-0">
                  {/* Users tab: available to all authenticated users (self-profile for non–super-admin) */}
                  <button
                      onClick={() => {
                        setActiveMasterTab('users');
                        // Dispatch event for master page
                        const event = new CustomEvent('setMasterTab', { detail: 'users' });
                        window.dispatchEvent(event);
                      }}
                      className={`relative overflow-hidden items-center justify-center rounded-2xl border border-orange-500/30 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent,rgba(249,115,22,0.25),transparent)] before:translate-x-[-150%] hover:before:translate-x-[150%] before:transition-transform before:duration-1000 px-2.5 sm:px-4 py-1.5 sm:py-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                      activeMasterTab === 'users'
                        ? 'bg-orange-600 border-orange-400 text-white'
                        : 'bg-gradient-to-br from-gray-900 via-gray-800 to-orange-950 text-orange-200 hover:border-orange-400/60 hover:text-white hover:from-orange-900 hover:via-gray-900 hover:to-black'
                    }`}
                    >
                      <span className="relative z-10">Users</span>
                    </button>
                  {hasPermission('master', 'roles') && (
                    <button
                      onClick={() => {
                        setActiveMasterTab('roles');
                        // Dispatch event for master page
                        const event = new CustomEvent('setMasterTab', { detail: 'roles' });
                        window.dispatchEvent(event);
                      }}
                      className={`relative overflow-hidden items-center justify-center rounded-2xl border border-orange-500/30 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent,rgba(249,115,22,0.25),transparent)] before:translate-x-[-150%] hover:before:translate-x-[150%] before:transition-transform before:duration-1000 px-2.5 sm:px-4 py-1.5 sm:py-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                      activeMasterTab === 'roles'
                        ? 'bg-orange-600 border-orange-400 text-white'
                        : 'bg-gradient-to-br from-gray-900 via-gray-800 to-orange-950 text-orange-200 hover:border-orange-400/60 hover:text-white hover:from-orange-900 hover:via-gray-900 hover:to-black'
                    }`}
                    >
                      <span className="relative z-10">Roles</span>
                    </button>
                  )}
                  {hasPermission('master', 'cities') && (
                    <button
                      onClick={() => {
                        setActiveMasterTab('centers');
                        // Dispatch event for master page
                        const event = new CustomEvent('setMasterTab', { detail: 'centers' });
                        window.dispatchEvent(event);
                      }}
                      className={`relative overflow-hidden items-center justify-center rounded-2xl border border-orange-500/30 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent,rgba(249,115,22,0.25),transparent)] before:translate-x-[-150%] hover:before:translate-x-[150%] before:transition-transform before:duration-1000 px-2.5 sm:px-4 py-1.5 sm:py-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                      activeMasterTab === 'centers'
                        ? 'bg-orange-600 border-orange-400 text-white'
                        : 'bg-gradient-to-br from-gray-900 via-gray-800 to-orange-950 text-orange-200 hover:border-orange-400/60 hover:text-white hover:from-orange-900 hover:via-gray-900 hover:to-black'
                    }`}
                    >
                      <span className="relative z-10">Centers</span>
                    </button>
                  )}
                  {hasPermission('master', 'clients') && (
                    <button
                      onClick={() => {
                        setActiveMasterTab('clients');
                        // Dispatch event for master page
                        const event = new CustomEvent('setMasterTab', { detail: 'clients' });
                        window.dispatchEvent(event);
                      }}
                      className={`relative overflow-hidden items-center justify-center rounded-2xl border border-orange-500/30 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent,rgba(249,115,22,0.25),transparent)] before:translate-x-[-150%] hover:before:translate-x-[150%] before:transition-transform before:duration-1000 px-2.5 sm:px-4 py-1.5 sm:py-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                      activeMasterTab === 'clients'
                        ? 'bg-orange-600 border-orange-400 text-white'
                        : 'bg-gradient-to-br from-gray-900 via-gray-800 to-orange-950 text-orange-200 hover:border-orange-400/60 hover:text-white hover:from-orange-900 hover:via-gray-900 hover:to-black'
                    }`}
                    >
                      <span className="relative z-10">Clients</span>
                    </button>
                  )}
                  {hasPermission('master', 'branches') && (
                    <button
                      onClick={() => {
                        setActiveMasterTab('branches');
                        // Dispatch event for master page
                        const event = new CustomEvent('setMasterTab', { detail: 'branches' });
                        window.dispatchEvent(event);
                      }}
                      className={`relative overflow-hidden items-center justify-center rounded-2xl border border-orange-500/30 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent,rgba(249,115,22,0.25),transparent)] before:translate-x-[-150%] hover:before:translate-x-[150%] before:transition-transform before:duration-1000 px-2.5 sm:px-4 py-1.5 sm:py-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                      activeMasterTab === 'branches'
                        ? 'bg-orange-600 border-orange-400 text-white'
                        : 'bg-gradient-to-br from-gray-900 via-gray-800 to-orange-950 text-orange-200 hover:border-orange-400/60 hover:text-white hover:from-orange-900 hover:via-gray-900 hover:to-black'
                    }`}
                    >
                      <span className="relative z-10">Branches</span>
                    </button>
                  )}
                </div>
              )}
              
              {/* Balance Sheet export — icon buttons only */}
              {pathname === '/balance-sheet' && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const event = new CustomEvent('exportBalanceSheet', { detail: 'excel' });
                      window.dispatchEvent(event);
                    }}
                    className="relative overflow-hidden flex items-center justify-center rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-green-400/60 hover:text-white hover:from-green-400 hover:via-green-500 hover:to-green-600 active:scale-95 before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent,rgba(34,197,94,0.25),transparent)] before:translate-x-[-150%] hover:before:translate-x-[150%] before:transition-transform before:duration-1000 p-2.5"
                    title="Export Excel"
                    aria-label="Export Excel"
                  >
                    <ExcelExportIcon className="h-6 w-6 relative z-10" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const event = new CustomEvent('exportBalanceSheet', { detail: 'pdf' });
                      window.dispatchEvent(event);
                    }}
                    className="relative overflow-hidden flex items-center justify-center rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-red-400/60 hover:text-white hover:from-red-400 hover:via-red-500 hover:to-red-600 active:scale-95 before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent,rgba(239,68,68,0.25),transparent)] before:translate-x-[-150%] hover:before:translate-x-[150%] before:transition-transform before:duration-1000 p-2.5"
                    title="Export PDF"
                    aria-label="Export PDF"
                  >
                    <PdfExportIcon className="h-6 w-6 relative z-10" />
                  </button>
                </div>
              )}
              
              {/* Accounting Tabs - Only show on accounting page */}
              {pathname === '/accounting' && (
                <div className="flex items-center gap-2 sm:space-x-3 flex-shrink-0">
                  <button
                    onClick={() => {
                      setActiveAccountingTab('accounts');
                      // Dispatch event for accounting page
                      const event = new CustomEvent('setAccountingTab', { detail: 'accounts' });
                      window.dispatchEvent(event);
                    }}
                    className={`relative overflow-hidden items-center justify-center rounded-2xl border border-orange-500/30 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent,rgba(249,115,22,0.25),transparent)] before:translate-x-[-150%] hover:before:translate-x-[150%] before:transition-transform before:duration-1000 px-2.5 sm:px-4 py-1.5 sm:py-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                      activeAccountingTab === 'accounts'
                        ? 'bg-orange-600 border-orange-400 text-white'
                        : 'bg-gradient-to-br from-gray-900 via-gray-800 to-orange-950 text-orange-200 hover:border-orange-400/60 hover:text-white hover:from-orange-900 hover:via-gray-900 hover:to-black'
                    }`}
                  >
                    <span className="relative z-10">Accounts</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveAccountingTab('category');
                      // Dispatch event for accounting page
                      const event = new CustomEvent('setAccountingTab', { detail: 'category' });
                      window.dispatchEvent(event);
                    }}
                    className={`relative overflow-hidden items-center justify-center rounded-2xl border border-orange-500/30 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent,rgba(249,115,22,0.25),transparent)] before:translate-x-[-150%] hover:before:translate-x-[150%] before:transition-transform before:duration-1000 px-2.5 sm:px-4 py-1.5 sm:py-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                      activeAccountingTab === 'category'
                        ? 'bg-orange-600 border-orange-400 text-white'
                        : 'bg-gradient-to-br from-gray-900 via-gray-800 to-orange-950 text-orange-200 hover:border-orange-400/60 hover:text-white hover:from-orange-900 hover:via-gray-900 hover:to-black'
                    }`}
                  >
                    <span className="relative z-10">Category</span>
                  </button>
                </div>
              )}
              
              {/* Dashboard Controls - Only show on dashboard page */}
              {pathname === '/dashboard' && (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-200 pointer-events-none" />
                    <input
                      type="date"
                      defaultValue={(() => {
                        const now = new Date();
                        const formatter = new Intl.DateTimeFormat('en-CA', {
                          timeZone: 'Asia/Kolkata',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        });
                        const parts = formatter.formatToParts(now);
                        const year = parts.find(p => p.type === 'year')?.value;
                        const month = parts.find(p => p.type === 'month')?.value;
                        const day = parts.find(p => p.type === 'day')?.value;
                        return `${year}-${month}-${day}`;
                      })()}
                      className="pl-10 pr-4 py-2 bg-gradient-to-br from-gray-900 via-gray-800 to-orange-950 border border-orange-500/30 rounded-2xl text-orange-200 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer hover:border-orange-400/60 hover:text-white hover:from-orange-900 hover:via-gray-900 hover:to-black transition-all duration-300"
                      onChange={(e) => {
                        // Dispatch event for dashboard page
                        const event = new CustomEvent('setDashboardDate', { detail: e.target.value });
                        window.dispatchEvent(event);
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* Reports — Customer Report tab + other reports dropdown */}
              {pathname === '/reports' && (
                <div className="flex items-center gap-2 sm:space-x-3 flex-shrink-0">
                  {hasPermission('reports', 'report_6') && (
                    <button
                      onClick={() => {
                        setActiveReport('customer');
                        setReportDropdownOpen(false);
                        const event = new CustomEvent('setActiveReport', { detail: 'customer' });
                        window.dispatchEvent(event);
                      }}
                      className={`relative overflow-hidden items-center justify-center rounded-2xl border border-orange-500/30 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent,rgba(249,115,22,0.25),transparent)] before:translate-x-[-150%] hover:before:translate-x-[150%] before:transition-transform before:duration-1000 px-2.5 sm:px-4 py-1.5 sm:py-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                        activeReport === 'customer'
                          ? 'bg-orange-600 border-orange-400 text-white'
                          : 'bg-gradient-to-br from-gray-900 via-gray-800 to-orange-950 text-orange-200 hover:border-orange-400/60 hover:text-white hover:from-orange-900 hover:via-gray-900 hover:to-black'
                      }`}
                    >
                      <span className="relative z-10">Customer Report</span>
                    </button>
                  )}
                  <div className="relative z-[200]" ref={reportDropdownRef}>
                    <button
                      onClick={() => setReportDropdownOpen(!reportDropdownOpen)}
                      className={`relative overflow-hidden items-center justify-center rounded-2xl border border-orange-500/30 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-orange-400/60 hover:text-white active:scale-95 before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent,rgba(249,115,22,0.25),transparent)] before:translate-x-[-150%] hover:before:translate-x-[150%] before:transition-transform before:duration-1000 px-2.5 sm:px-4 py-1.5 sm:py-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 flex space-x-2 ${
                        activeReport !== 'customer'
                          ? 'bg-gradient-to-br from-orange-500 via-orange-400 to-orange-500 text-white hover:from-orange-900 hover:via-gray-900 hover:to-black'
                          : 'bg-gradient-to-br from-gray-900 via-gray-800 to-orange-950 text-orange-200 hover:from-orange-900 hover:via-gray-900 hover:to-black'
                      }`}
                    >
                      <span className="relative z-10">
                        {activeReport === 'customer' ? 'Reports' : getSelectedReportButtonLabel(activeReport)}
                      </span>
                      <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {reportDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white backdrop-blur-2xl border-2 border-orange-300 rounded-2xl shadow-xl shadow-orange-200/50 z-[210]">
                        <div className="py-2">
                          {[
                            { id: 'outward', name: 'Booking Report', permission: 'report_1' },
                            { id: 'inward', name: 'Cutting Report', permission: 'report_2' },
                            { id: 'combo', name: 'Combo Report', permission: 'report_3' },
                            { id: 'amount-type', name: 'Amount Type Report', permission: 'report_4' },
                            { id: 'transaction', name: 'Transaction Report', permission: 'report_5' },
                            { id: 'transaction-refund', name: 'Transaction Refund Report', permission: 'report_7' },
                          ].filter((report) => {
                            return hasPermission('reports', report.permission);
                          }).map((report) => (
                            <button
                              key={report.id}
                              onClick={() => {
                                setActiveReport(report.id as any);
                                setReportDropdownOpen(false);
                                const event = new CustomEvent('setActiveReport', { detail: report.id });
                                window.dispatchEvent(event);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm transition-all duration-200 ${
                                activeReport === report.id
                                  ? 'bg-orange-500 text-white font-medium'
                                  : 'text-gray-800 hover:bg-orange-500/20'
                              }`}
                            >
                              {report.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile only: hamburger on the right */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden flex-shrink-0 h-10 w-10 p-0 text-gray-700 hover:text-gray-900 hover:bg-orange-100/80 rounded-xl border border-orange-200/60"
              aria-label="Open menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Page Content - Scrollable area */}
        <main className="flex-1 bg-white overflow-y-auto overflow-x-hidden">
          <div className="p-2 sm:p-4 lg:p-6 max-w-[100vw]">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Mega Sidebar */}
      <div className={`fixed inset-0 z-[100000000] lg:hidden ${
        sidebarOpen ? 'block' : 'hidden'
      }`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-full max-w-sm sidebar-shell flex flex-col">
          <div className="sidebar-header flex items-center justify-between h-20 px-3 flex-shrink-0">
            <AppLogo width={120} height={32} className="object-contain" priority />
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="h-10 w-10 inline-flex items-center justify-center rounded-xl text-gray-700 hover:bg-orange-100/80 border border-orange-200/60"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <nav className="sidebar-nav flex-1 pt-4 px-2 pb-3 min-h-0">
            <SidebarStars count={56} />
            <div className="space-y-1.5 relative z-[2] px-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`sidebar-nav-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                    pathname === item.href ? 'sidebar-nav-link--active' : ''
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sidebar-nav-icon mr-3">
                    {item.icon}
                  </span>
                  <span className="truncate">{item.name}</span>
                {item.name === 'Dashboard' && (
                  <span className="sidebar-kbd ml-auto text-xs px-2 py-1 rounded-md hidden">[ Ctrl+D ]</span>
                )}
                {item.name === 'Transactions' && (
                  <span className="sidebar-kbd ml-auto text-xs px-2 py-1 rounded-md hidden">[ Ctrl+T ]</span>
                )}
                {item.name === 'Accounting' && (
                  <span className="sidebar-kbd ml-auto text-xs px-2 py-1 rounded-md hidden">[ Ctrl+A ]</span>
                )}
                {item.name === 'Hawala' && (
                  <span className="sidebar-kbd ml-auto text-xs px-2 py-1 rounded-md hidden">[ Ctrl+H ]</span>
                )}
                {item.name === 'Special Entry' && (
                  <span className="sidebar-kbd ml-auto text-xs px-2 py-1 rounded-md hidden">[ Ctrl+S ]</span>
                )}
                {item.name === 'Reports' && (
                  <span className="sidebar-kbd ml-auto text-xs px-2 py-1 rounded-md hidden">[ Ctrl+R ]</span>
                )}
                {item.name === 'Balance Sheet' && (
                  <span className="sidebar-kbd ml-auto text-xs px-2 py-1 rounded-md hidden">[ Ctrl+B ]</span>
                )}
                {item.name === 'Master Data' && (
                  <span className="sidebar-kbd ml-auto text-xs px-2 py-1 rounded-md hidden">[ Ctrl+M ]</span>
                )}
                {item.name === 'Help' && (
                  <span className="sidebar-kbd ml-auto text-xs px-2 py-1 rounded-md hidden">[ Ctrl+P ]</span>
                )}
                </Link>
              ))}
            </div>
          </nav>

          <div className="sidebar-user-section p-4 flex-shrink-0">
            <div className="sidebar-user-content">
              <div className="flex items-center mb-4">
                <div className="sidebar-avatar w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {user?.email}
                  </div>
                  <div className="sidebar-role text-xs font-medium">
                    {(() => {
                      try {
                        const roleName = user?.role?.name;
                        if (typeof roleName === 'string') {
                          return roleName;
                        }
                        if (typeof roleName === 'object' && roleName !== null) {
                          console.warn('Mobile: Role name is an object, converting to string');
                          return String(roleName);
                        }
                        return 'No Role';
                      } catch (error) {
                        console.error('Mobile: Error rendering role name:', error);
                        return 'No Role';
                      }
                    })()}
                  </div>
                </div>
              </div>
              <Button
                onClick={logout}
                variant="outline"
                className="sidebar-signout w-full"
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
      <ScrollToTop />
    </div>
    </>
  );
}
