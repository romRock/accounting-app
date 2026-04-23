'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store';
import { formatCurrency, formatDate } from '@/lib/utils';

interface LedgerEntry {
  id: string;
  date: string;
  accountId: string;
  accountType: string;
  description: string;
  debitAmount: number | null;
  creditAmount: number | null;
  balance: number;
  transaction?: {
    transactionId: string;
    fromCity: { name: string };
    toCity: { name: string };
    party: { name: string };
  };
  creator: {
    firstName: string;
    lastName: string;
  };
}

export default function AccountingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    accountType: '',
    search: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchLedgerEntries();
  }, [isAuthenticated, router]);

  const fetchLedgerEntries = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters.accountType) queryParams.append('accountType', filters.accountType);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(`/api/accounting?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLedgerEntries(data.ledgerEntries || []);
      }
    } catch (error) {
      console.error('Failed to fetch ledger entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAccountBalance = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.accountType) queryParams.append('accountType', filters.accountType);

      const response = await fetch(`/api/accounting/balance?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Current Balance: ${formatCurrency(data.currentBalance)}`);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const getTrialBalance = async () => {
    try {
      const response = await fetch('/api/accounting/trial-balance', {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Trial Balance - Total Debits: ${formatCurrency(data.summary.totalDebits)}, Total Credits: ${formatCurrency(data.summary.totalCredits)}`);
      }
    } catch (error) {
      console.error('Failed to fetch trial balance:', error);
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
          <p className="mt-4 text-lg">Loading ledger entries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounting</h1>
          <p className="text-muted-foreground">
            Manage ledger entries and account balances
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={getAccountBalance} variant="outline">
            Get Balance
          </Button>
          <Button onClick={getTrialBalance} variant="outline">
            Trial Balance
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter ledger entries by date, account type, or search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountType">Account Type</Label>
              <select
                id="accountType"
                value={filters.accountType}
                onChange={(e) => setFilters({ ...filters, accountType: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All Types</option>
                <option value="PARTY">Party</option>
                <option value="BRANCH">Branch</option>
                <option value="CASH">Cash</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search description or account..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button onClick={fetchLedgerEntries}>
              Apply Filters
            </Button>
            <Button 
              onClick={() => setFilters({ dateFrom: '', dateTo: '', accountType: '', search: '' })}
              variant="outline"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Ledger Entries</CardTitle>
          <CardDescription>
            All accounting transactions and balances
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ledgerEntries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No ledger entries found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ledgerEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{entry.description}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(entry.date)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Account: {entry.accountId} ({entry.accountType})
                    </div>
                    {entry.transaction && (
                      <div className="text-sm text-muted-foreground">
                        Transaction: {entry.transaction.transactionId} - {entry.transaction.fromCity.name} → {entry.transaction.toCity.name}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      Created by: {entry.creator.firstName} {entry.creator.lastName}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    {entry.debitAmount && (
                      <div className="text-red-600">
                        Debit: {formatCurrency(entry.debitAmount)}
                      </div>
                    )}
                    {entry.creditAmount && (
                      <div className="text-green-600">
                        Credit: {formatCurrency(entry.creditAmount)}
                      </div>
                    )}
                    <div className="font-bold">
                      Balance: {formatCurrency(entry.balance)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create New Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common accounting tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              onClick={() => router.push('/accounting/create')}
              className="w-full"
            >
              Create Ledger Entry
            </Button>
            <Button
              onClick={() => router.push('/accounting/reconcile')}
              variant="outline"
              className="w-full"
            >
              Reconcile Accounts
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
