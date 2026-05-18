'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, Users, MapPin } from 'lucide-react';

// Dashboard Metrics Interfaces
interface DashboardMetrics {
  totalOutwardBookingCommission: number;
  totalInwardBookingCommission: number;
  transactionCounts: {
    outward: number;
    inward: number;
    hawala: number;
    accounting: number;
    specialEntry: number;
    total: number;
  };
  totalClients: number;
  totalCities: number;
  customerReview: {
    plusCustomers: Array<{ name: string; balance: number }>;
    minusCustomers: Array<{ name: string; balance: number }>;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customerReview, setCustomerReview] = useState<{ plusCustomers: Array<{ name: string; balance: number }>; minusCustomers: Array<{ name: string; balance: number }> } | null>(null);

  // Check dashboard permissions and redirect if not allowed
  useEffect(() => {
    if (!user?.role?.permissions) return;

    // Parse permissions from JSON string if needed
    let permissions;
    try {
      permissions = typeof user.role.permissions === 'string' 
        ? JSON.parse(user.role.permissions) 
        : user.role.permissions;
    } catch (error) {
      console.error('Error parsing permissions:', error);
      return;
    }

    // Check if user has dashboard permission
    const hasDashboardPermission = permissions.dashboard?.view || permissions.dashboard?.read || false;

    if (!hasDashboardPermission) {
      // Redirect to first allowed page
      const pagePriority = [
        { path: '/transactions', check: () => permissions.transactions?.outward || permissions.transactions?.inward || permissions.transactions?.read },
        { path: '/reports', check: () => permissions.reports?.read || Object.values(permissions.reports || {}).some(Boolean) },
        { path: '/accounting', check: () => permissions.accounting === 'all' || permissions.accounting?.read },
        { path: '/hawala', check: () => permissions.hawala === 'all' || permissions.hawala?.read },
        { path: '/balance-sheet', check: () => permissions.balanceSheet === 'all' || permissions.balanceSheet?.read },
        { path: '/master', check: () => permissions.masterData === 'full_access' || permissions.master?.read },
        { path: '/help', check: () => true } // Help is always accessible
      ];

      for (const page of pagePriority) {
        if (page.check()) {
          router.push(page.path);
          return;
        }
      }

      // If no permissions found, redirect to help
      router.push('/help');
    }
  }, [user, router]);

  // Fetch dashboard metrics
  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/dashboard/metrics?date=${selectedDate}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard metrics');
        }

        const data = await response.json();
        if (data.success) {
          setMetrics(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch dashboard metrics');
        }
      } catch (error: any) {
        console.error('Error fetching dashboard metrics:', error);
        setError(error.message || 'Failed to fetch dashboard metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardMetrics();
  }, [selectedDate]);

  // Listen for custom events from layout wrapper
  useEffect(() => {
    const handleSetDashboardDate = (event: Event) => {
      const customEvent = event as CustomEvent;
      setSelectedDate(customEvent.detail);
    };

    window.addEventListener('setDashboardDate', handleSetDashboardDate as EventListener);

    return () => {
      window.removeEventListener('setDashboardDate', handleSetDashboardDate as EventListener);
    };
  }, []);

  // Fetch customer review data
  useEffect(() => {
    const fetchCustomerReview = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/dashboard/customer-review`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch customer review');
        }

        const data = await response.json();
        if (data.success) {
          setCustomerReview(data.data);
        }
      } catch (error: any) {
        console.error('Error fetching customer review:', error);
      }
    };

    fetchCustomerReview();
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Navigation handlers
  const navigateToPage = (page: string) => {
    window.location.href = `/${page}`;
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen w-full flex items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white min-h-screen w-full flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen w-full">
      <div className="pt-16 space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Outward Booking Commission */}
          <Card className="relative overflow-hidden shadow-lg border-0 bg-gradient-to-br from-blue-50 via-white to-blue-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300">
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Total Outward Booking</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatCurrency(metrics?.totalOutwardBookingCommission || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Booking Commission Only</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl ml-4 shadow-lg">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Inward Booking Commission */}
          <Card className="relative overflow-hidden shadow-lg border-0 bg-gradient-to-br from-indigo-50 via-white to-indigo-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-r before:from-indigo-500/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300">
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Total Inward Booking</p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {formatCurrency(metrics?.totalInwardBookingCommission || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Booking Commission Only</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 rounded-xl ml-4 shadow-lg">
                  <TrendingDown className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Transactions Count */}
          <Card className="relative overflow-hidden shadow-lg border-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-r before:from-gray-500/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300">
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Total Transactions</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {metrics?.transactionCounts?.total || 0}
                  </p>
                  <div className="flex gap-2 mt-2 text-xs text-gray-500">
                    <span>Out: {metrics?.transactionCounts?.outward || 0}</span>
                    <span>In: {metrics?.transactionCounts?.inward || 0}</span>
                    <span>Haw: {metrics?.transactionCounts?.hawala || 0}</span>
                    <span>Acc: {metrics?.transactionCounts?.accounting || 0}</span>
                    <span>Spec: {metrics?.transactionCounts?.specialEntry || 0}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-600 to-gray-700 p-4 rounded-xl ml-4 shadow-lg">
                  <Activity className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Clients Count */}
          <Card className="relative overflow-hidden shadow-lg border-0 bg-gradient-to-br from-green-50 via-white to-green-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-r before:from-green-500/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300">
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Total Clients</p>
                  <p className="text-3xl font-bold text-green-600">
                    {metrics?.totalClients || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Active Clients</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl ml-4 shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Cities Count */}
          <Card className="relative overflow-hidden shadow-lg border-0 bg-gradient-to-br from-purple-50 via-white to-purple-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-r before:from-purple-500/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300">
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Total Centers</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {metrics?.totalCities || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Active Centers</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl ml-4 shadow-lg">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Review Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plus Customers (Income/Positive Balance) */}
          <Card className="relative overflow-hidden shadow-lg border-0 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-r before:from-emerald-500/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300">
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                Income Clients
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              {customerReview?.plusCustomers && customerReview.plusCustomers.length > 0 ? (
                <div className="space-y-3">
                  {customerReview.plusCustomers.map((client, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{client.name}</p>
                        <p className="text-xs text-gray-500">Balance</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">{formatCurrency(client.balance)}</p>
                        <p className="text-xs text-gray-500">Credit</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No income clients found</p>
              )}
            </CardContent>
          </Card>

          {/* Minus Customers (Expense/Negative Balance) */}
          <Card className="relative overflow-hidden shadow-lg border-0 bg-gradient-to-br from-red-50 via-white to-red-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-r before:from-red-500/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300">
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <div className="bg-gradient-to-br from-red-500 to-rose-600 p-2 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                Expense Clients
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              {customerReview?.minusCustomers && customerReview.minusCustomers.length > 0 ? (
                <div className="space-y-3">
                  {customerReview.minusCustomers.map((client, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-red-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{client.name}</p>
                        <p className="text-xs text-gray-500">Balance</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{formatCurrency(client.balance)}</p>
                        <p className="text-xs text-gray-500">Debit</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No expense clients found</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
