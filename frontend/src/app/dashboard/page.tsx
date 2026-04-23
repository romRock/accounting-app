'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DashboardStats {
  totalTransactions: number;
  totalAmount: number;
  totalCommission: number;
  inwardTransactions: number;
  outwardTransactions: number;
  pendingTransactions: number;
  completedTransactions: number;
}

interface RecentTransaction {
  id: string;
  transactionId: string;
  date: string;
  type: string;
  fromCity: { name: string };
  toCity: { name: string };
  party: { name: string };
  amount: number;
  commission: number;
  status: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchDashboardData();
  }, [isAuthenticated, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await fetch('/api/transactions/stats', {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch recent transactions
      const transactionsResponse = await fetch('/api/transactions?limit=5', {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
      });

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setRecentTransactions(transactionsData.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName} {user?.lastName}
          </p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalCommission)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingTransactions}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction Type Breakdown */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Inward Transactions</CardTitle>
              <CardDescription>
                Money coming into the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.inwardTransactions}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalTransactions > 0 
                  ? `${((stats.inwardTransactions / stats.totalTransactions) * 100).toFixed(1)}% of total`
                  : '0% of total'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outward Transactions</CardTitle>
              <CardDescription>
                Money going out of the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats.outwardTransactions}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalTransactions > 0 
                  ? `${((stats.outwardTransactions / stats.totalTransactions) * 100).toFixed(1)}% of total`
                  : '0% of total'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Latest transactions in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{transaction.transactionId}</span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          transaction.type === 'INWARD'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {transaction.type}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          transaction.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : transaction.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {transaction.fromCity.name} → {transaction.toCity.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Party: {transaction.party.name}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-bold">
                      {formatCurrency(transaction.amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(transaction.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks you might want to perform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              onClick={() => router.push('/transactions')}
              className="w-full"
            >
              New Transaction
            </Button>
            <Button
              onClick={() => router.push('/accounting')}
              variant="outline"
              className="w-full"
            >
              View Ledger
            </Button>
            <Button
              onClick={() => router.push('/reports')}
              variant="outline"
              className="w-full"
            >
              Generate Reports
            </Button>
            <Button
              onClick={() => router.push('/master')}
              variant="outline"
              className="w-full"
            >
              Manage Master Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
