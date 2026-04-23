'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store';
import { formatCurrency, formatDate } from '@/lib/utils';

const transactionSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['INWARD', 'OUTWARD']),
  fromCityId: z.string().min(1, 'From city is required'),
  toCityId: z.string().min(1, 'To city is required'),
  partyId: z.string().min(1, 'Party is required'),
  amount: z.number().positive('Amount must be positive'),
  paymentType: z.enum(['CASH', 'CREDIT']),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
});

type TransactionForm = z.infer<typeof transactionSchema>;

interface Transaction {
  id: string;
  transactionId: string;
  date: string;
  type: string;
  fromCity: { id: string; name: string };
  toCity: { id: string; name: string };
  party: { id: string; name: string };
  amount: number;
  commission: number;
  paymentType: string;
  referenceId?: string;
  notes?: string;
  status: string;
}

interface City {
  id: string;
  name: string;
  code: string;
}

interface Party {
  id: string;
  name: string;
  phone?: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: 'INWARD',
      amount: 0,
      paymentType: 'CASH',
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchTransactions();
    fetchCities();
    fetchParties();
  }, [isAuthenticated, router]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions', {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await fetch('/api/master/cities', {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCities(data.cities || []);
      }
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    }
  };

  const fetchParties = async () => {
    try {
      const response = await fetch('/api/master/parties', {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setParties(data.parties || []);
      }
    } catch (error) {
      console.error('Failed to fetch parties:', error);
    }
  };

  const onSubmit = async (data: TransactionForm) => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }

      const newTransaction = await response.json();
      setTransactions([newTransaction.transaction, ...transactions]);
      reset();
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-800 bg-green-100';
      case 'PENDING':
        return 'text-yellow-800 bg-yellow-100';
      case 'CANCELLED':
        return 'text-red-800 bg-red-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'INWARD' 
      ? 'text-green-800 bg-green-100' 
      : 'text-blue-800 bg-blue-100';
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Manage inward and outward bookings
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Transaction'}
        </Button>
      </div>

      {/* Transaction Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Transaction</CardTitle>
            <CardDescription>
              Enter transaction details for inward or outward booking
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    {...register('date')}
                    className={errors.date ? 'border-red-500' : ''}
                  />
                  {errors.date && (
                    <p className="text-sm text-red-600">{errors.date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Transaction Type</Label>
                  <select
                    id="type"
                    {...register('type')}
                    className={`w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.type ? 'border-red-500' : ''}`}
                  >
                    <option value="INWARD">Inward</option>
                    <option value="OUTWARD">Outward</option>
                  </select>
                  {errors.type && (
                    <p className="text-sm text-red-600">{errors.type.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromCityId">From City</Label>
                  <select
                    id="fromCityId"
                    {...register('fromCityId')}
                    className={`w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.fromCityId ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select From City</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                  {errors.fromCityId && (
                    <p className="text-sm text-red-600">{errors.fromCityId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toCityId">To City</Label>
                  <select
                    id="toCityId"
                    {...register('toCityId')}
                    className={`w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.toCityId ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select To City</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                  {errors.toCityId && (
                    <p className="text-sm text-red-600">{errors.toCityId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partyId">Party</Label>
                  <select
                    id="partyId"
                    {...register('partyId')}
                    className={`w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.partyId ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select Party</option>
                    {parties.map((party) => (
                      <option key={party.id} value={party.id}>
                        {party.name}
                      </option>
                    ))}
                  </select>
                  {errors.partyId && (
                    <p className="text-sm text-red-600">{errors.partyId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('amount', { valueAsNumber: true })}
                    className={errors.amount ? 'border-red-500' : ''}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-600">{errors.amount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentType">Payment Type</Label>
                  <select
                    id="paymentType"
                    {...register('paymentType')}
                    className={`w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.paymentType ? 'border-red-500' : ''}`}
                  >
                    <option value="CASH">Cash</option>
                    <option value="CREDIT">Credit</option>
                  </select>
                  {errors.paymentType && (
                    <p className="text-sm text-red-600">{errors.paymentType.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referenceId">Reference ID</Label>
                  <Input
                    id="referenceId"
                    placeholder="Optional reference number"
                    {...register('referenceId')}
                    className={errors.referenceId ? 'border-red-500' : ''}
                  />
                  {errors.referenceId && (
                    <p className="text-sm text-red-600">{errors.referenceId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    rows={3}
                    placeholder="Additional notes..."
                    {...register('notes')}
                    className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.notes ? 'border-red-500' : ''}`}
                  />
                  {errors.notes && (
                    <p className="text-sm text-red-600">{errors.notes.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Transaction'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Latest transactions in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{transaction.transactionId}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(transaction.type)}`}>
                        {transaction.type}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {transaction.fromCity.name} → {transaction.toCity.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Party: {transaction.party.name}
                    </div>
                    {transaction.referenceId && (
                      <div className="text-sm text-muted-foreground">
                        Ref: {transaction.referenceId}
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-bold">
                      {formatCurrency(transaction.amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(transaction.date)}
                    </div>
                    {transaction.commission > 0 && (
                      <div className="text-sm text-green-600">
                        Commission: {formatCurrency(transaction.commission)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
