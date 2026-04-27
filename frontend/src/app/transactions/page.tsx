'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
import { mockApi } from '@/lib/mock-api';

// Modern transaction schema
const transactionSchema = z.object({
  id: z.string().optional(),
  tokenNo: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  center: z.string().min(1, 'Center is required'),
  amount: z.number().positive('Amount must be positive'),
  amountType: z.enum(['CASH', 'ACCOUNT / CREDIT']),
  commission: z.number().min(0, 'Commission must be non-negative'),
  autoCommission: z.boolean(),
  bookingCommission: z.number().optional(),
  centerCommission: z.number().optional(),
  receiverName: z.string().min(1, 'Receiver name is required'),
  receiverNumber: z.string().min(1, 'Receiver number is required'),
  senderName: z.string().min(1, 'Sender name is required'),
  senderNumber: z.string().min(1, 'Sender number is required'),
  remark: z.string().optional(),
  status: z.boolean(),
});

type TransactionForm = z.infer<typeof transactionSchema>;

interface Transaction {
  id: string;
  token: string;
  date: string;
  time: string;
  center: string;
  amount: number;
  type: string;
  amountType: string;
  commission: number;
  bookingCommission: number;
  centerCommission: number;
  receiverName: string;
  receiverNumber: string;
  senderName: string;
  senderNumber: string;
  remark?: string;
  status: boolean;
  statusTime: string;
}

interface Center {
  id: string;
  name: string;
  code: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'outward' | 'inward'>('outward');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filterByDate, setFilterByDate] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      center: '',
      amount: 0,
      amountType: 'CASH',
      commission: 0,
      autoCommission: true,
      receiverName: '',
      receiverNumber: '',
      senderName: '',
      senderNumber: '',
      remark: '',
      status: true,
    },
  });

  const autoCommission = watch('autoCommission');
  const amount = watch('amount');

  // Auto-generate ID and token
  const generateId = () => 'TXN' + Date.now();
  const generateToken = () => 'TKN' + Math.floor(Math.random() * 10000);

  // Initialize form with auto-generated values
  useEffect(() => {
    if (!editingTransaction) {
      setValue('id', generateId());
      setValue('tokenNo', generateToken());
    }
  }, [editingTransaction, setValue]);

  // Auto-calculate commission
  useEffect(() => {
    if (autoCommission && amount > 0) {
      const commission = Math.round(amount * 0.02); // 2% commission
      setValue('commission', commission);
      setValue('bookingCommission', Math.round(commission * 0.6));
      setValue('centerCommission', Math.round(commission * 0.4));
    }
  }, [amount, autoCommission, setValue]);

  // Fetch data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchTransactions();
    fetchCenters();
  }, [isAuthenticated, router]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await mockApi.getTransactions({
        page: currentPage,
        limit: 20,
        type: activeTab.toUpperCase(),
      });
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCenters = async () => {
    try {
      const data = await mockApi.getBranches();
      setCenters(data);
    } catch (error) {
      console.error('Failed to fetch centers:', error);
    }
  };

  const onSubmit = async (data: TransactionForm) => {
    try {
      setSubmitting(true);
      setError(null);

      const transactionData = {
        ...data,
        type: activeTab.toUpperCase(),
        statusTime: new Date().toISOString(),
      };

      if (editingTransaction) {
        // Update existing transaction
        const updatedTransaction = await mockApi.updateTransaction(editingTransaction.id, transactionData);
        setTransactions(transactions.map(t => 
          t.id === editingTransaction.id ? updatedTransaction : t
        ));
        setEditingTransaction(null);
      } else {
        // Create new transaction
        const newTransaction = await mockApi.createTransaction(transactionData);
        setTransactions([newTransaction, ...transactions]);
      }

      reset();
      setValue('id', generateId());
      setValue('tokenNo', generateToken());
      setValue('date', new Date().toISOString().split('T')[0]);
      setValue('time', new Date().toTimeString().slice(0, 5));
      setValue('autoCommission', true);
      
      // Focus on first input
      setTimeout(() => firstInputRef.current?.focus(), 100);
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    reset();
    setValue('id', generateId());
    setValue('tokenNo', generateToken());
    setValue('date', new Date().toISOString().split('T')[0]);
    setValue('time', new Date().toTimeString().slice(0, 5));
    setValue('autoCommission', true);
    setEditingTransaction(null);
    setError(null);
    setTimeout(() => firstInputRef.current?.focus(), 100);
  };

  const handleDelete = async () => {
    if (editingTransaction) {
      try {
        await mockApi.deleteTransaction(editingTransaction.id);
        setTransactions(transactions.filter(t => t.id !== editingTransaction.id));
        handleClear();
      } catch (err: any) {
        setError(err.message || 'Failed to delete transaction');
      }
    }
  };

  const handleRowClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setValue('id', transaction.id);
    setValue('tokenNo', transaction.token);
    setValue('date', transaction.date);
    setValue('time', transaction.time);
    setValue('center', transaction.center);
    setValue('amount', transaction.amount);
    setValue('amountType', transaction.amountType as any);
    setValue('commission', transaction.commission);
    setValue('bookingCommission', transaction.bookingCommission);
    setValue('centerCommission', transaction.centerCommission);
    setValue('receiverName', transaction.receiverName);
    setValue('receiverNumber', transaction.receiverNumber);
    setValue('senderName', transaction.senderName);
    setValue('senderNumber', transaction.senderNumber);
    setValue('remark', transaction.remark || '');
    setValue('status', transaction.status);
    setValue('autoCommission', false);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      transaction.receiverName.toLowerCase().includes(searchLower) ||
      transaction.senderName.toLowerCase().includes(searchLower) ||
      transaction.token.toLowerCase().includes(searchLower) ||
      transaction.amount.toString().includes(searchLower) ||
      transaction.commission?.toString().includes(searchLower) ||
      transaction.receiverNumber?.toLowerCase().includes(searchLower) ||
      transaction.senderNumber?.toLowerCase().includes(searchLower) ||
      transaction.center?.toLowerCase().includes(searchLower) ||
      transaction.amountType?.toLowerCase().includes(searchLower) ||
      transaction.date?.includes(searchLower) ||
      transaction.time?.includes(searchLower) ||
      transaction.remark?.toLowerCase().includes(searchLower);
    
    const matchesDate = !filterByDate || 
      (dateFilter && transaction.date === dateFilter);
    
    return matchesSearch && matchesDate;
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingTransaction]);

  // Listen for tab changes from header
  useEffect(() => {
    const handleTabChange = (e: CustomEvent) => {
      setActiveTab(e.detail);
    };

    window.addEventListener('setTransactionTab', handleTabChange as EventListener);
    return () => window.removeEventListener('setTransactionTab', handleTabChange as EventListener);
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen w-full">
      <div className="pt-16 space-y-4 sm:space-y-6">
        {/* Transaction Form */}
        <Card className="shadow-sm border-gray-200 bg-gray-100">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">
              {editingTransaction ? 'Edit Transaction' : `${activeTab === 'outward' ? 'Outward' : 'Inward'} Booking`}
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter transaction details below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Section 1: General Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">General Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="id" className="text-sm font-medium text-gray-700">Id No</Label>
                    <Input
                      id="id"
                      {...register('id')}
                      readOnly
                      className="bg-gray-50 border-gray-300 text-gray-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tokenNo" className="text-sm font-medium text-gray-700">Token No</Label>
                    <Input
                      id="tokenNo"
                      {...register('tokenNo')}
                      className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm placeholder:text-gray-600"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="date" className="text-sm font-medium text-gray-700">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      {...register('date')}
                      className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm placeholder:text-gray-600"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="time" className="text-sm font-medium text-gray-700">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      {...register('time')}
                      className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm placeholder:text-gray-600"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="center" className="text-sm font-medium text-gray-700">Center</Label>
                    <select
                      id="center"
                      {...register('center')}
                      className="w-full h-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                    >
                      <option value="">Select Center</option>
                      {centers.map((center) => (
                        <option key={center.id} value={center.name}>
                          {center.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="amount" className="text-sm font-medium text-gray-700">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register('amount', { valueAsNumber: true })}
                      className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-bold text-black text-lg placeholder:text-gray-600"
                      ref={firstInputRef}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="amountType" className="text-sm font-medium text-gray-700">Amount Type</Label>
                    <select
                      id="amountType"
                      {...register('amountType')}
                      className="w-full h-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                    >
                      <option value="CASH">CASH</option>
                      <option value="ACCOUNT / CREDIT">ACCOUNT / CREDIT</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="commission" className="text-sm font-medium text-gray-700">Commission</Label>
                    <Input
                      id="commission"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register('commission', { valueAsNumber: true })}
                      disabled={autoCommission}
                      className={`border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-bold text-lg placeholder:text-gray-600 ${
                        autoCommission ? 'bg-gray-100 text-gray-500' : 'bg-white text-black'
                      }`}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="autoCommission"
                      {...register('autoCommission')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="autoCommission" className="text-sm font-medium text-gray-700">
                      Auto
                    </Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Booking Commission</Label>
                    <Input
                      value={watch('bookingCommission') || 0}
                      readOnly
                      className="bg-gray-50 border-gray-300 text-green-600 font-medium text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Center Commission</Label>
                    <Input
                      value={watch('centerCommission') || 0}
                      readOnly
                      className="bg-gray-50 border-gray-300 text-green-600 font-medium text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Contact Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="receiverName" className="text-sm font-medium text-gray-700">Receiver Name</Label>
                    <Input
                      id="receiverName"
                      placeholder="Enter receiver name"
                      {...register('receiverName')}
                      className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm placeholder:text-gray-600"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="receiverNumber" className="text-sm font-medium text-gray-700">Receiver Number</Label>
                    <Input
                      id="receiverNumber"
                      placeholder="Enter receiver number"
                      {...register('receiverNumber')}
                      className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm placeholder:text-gray-600"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="senderName" className="text-sm font-medium text-gray-700">Sender Name</Label>
                    <Input
                      id="senderName"
                      placeholder="Enter sender name"
                      {...register('senderName')}
                      className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm placeholder:text-gray-600"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="senderNumber" className="text-sm font-medium text-gray-700">Sender Number</Label>
                    <Input
                      id="senderNumber"
                      placeholder="Enter sender number"
                      {...register('senderNumber')}
                      className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm placeholder:text-gray-600"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="remark" className="text-sm font-medium text-gray-700">Remark</Label>
                  <Input
                    id="remark"
                    placeholder="Enter any remarks"
                    {...register('remark')}
                    className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm placeholder:text-gray-600"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="status"
                      {...register('status')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                      Active
                    </Label>
                  </div>
                  <span className="text-xs text-gray-500 sm:text-sm">
                    Status: {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Section 3: Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0 pt-4 border-t">
                <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
                  >
                    Clear
                  </Button>
                  
                  {editingTransaction && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                    >
                      Delete
                    </Button>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 w-full sm:w-auto">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400 shadow-sm w-full sm:w-auto"
                  >
                    {submitting ? 'Saving...' : (editingTransaction ? 'Update' : 'Save')}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400 shadow-sm w-full sm:w-auto"
                  >
                    Print
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Section 4: Recent Transactions */}
        <Card className="shadow-sm border-gray-200 bg-gray-100">
          <CardHeader className="pb-4">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">Recent Transactions</CardTitle>
                <CardDescription className="text-gray-600">
                  Latest {activeTab} transactions
                </CardDescription>
              </div>
              
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="filterByDate"
                    checked={filterByDate}
                    onChange={(e) => {
                      setFilterByDate(e.target.checked);
                      if (e.target.checked) {
                        // Set today's date when filter is enabled
                        const today = new Date().toISOString().split('T')[0];
                        setDateFilter(today);
                      } else {
                        setDateFilter('');
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="filterByDate" className="text-sm font-medium text-gray-700">
                    By Date
                  </Label>
                  {filterByDate && (
                    <Input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="h-8 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm placeholder:text-gray-600"
                    />
                  )}
                </div>
                
                <div className="hidden sm:block">
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white w-48 lg:w-64 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm placeholder:text-gray-600"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No transactions found</p>
              </div>
            ) : (
              <>
                {/* Tablet Table - All Columns */}
                <div className="hidden md:block lg:hidden">
                  <div className="w-full overflow-x-auto">
                    <table className="min-w-[1400px] divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Id</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Center</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Type</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Comm</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Center Comm</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receiver Name</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receiver Number</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender Name</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender Number</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTransactions.map((transaction) => (
                          <tr
                            key={transaction.id}
                            onClick={() => handleRowClick(transaction)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                          >
                            <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                              {transaction.id}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {transaction.token}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {transaction.date}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {transaction.time}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {transaction.center}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs font-semibold text-blue-600">
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {transaction.amountType}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              <span className={`px-1 py-0.5 text-xs rounded-full ${
                                transaction.type === 'OUTWARD' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {transaction.type}
                              </span>
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {formatCurrency(transaction.bookingCommission)}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {formatCurrency(transaction.centerCommission)}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {transaction.receiverName}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {transaction.receiverNumber}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {transaction.senderName}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {transaction.senderNumber}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {transaction.remark || '-'}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              <span className={`px-1 py-0.5 text-xs rounded-full ${
                                transaction.status 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {transaction.status ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Desktop Table - All Columns */}
                <div className="hidden lg:block">
                  <div className="w-full overflow-x-auto">
                    <table className="min-w-[1400px] divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Id</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Center</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Type</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Comm</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Center Comm</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receiver Name</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receiver Number</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender Name</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender Number</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTransactions.map((transaction) => (
                          <tr
                            key={transaction.id}
                            onClick={() => handleRowClick(transaction)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                          >
                            <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {transaction.id}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {transaction.token}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {transaction.date}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {transaction.time}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {transaction.center}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-blue-600">
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {transaction.amountType}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                transaction.type === 'OUTWARD' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {transaction.type}
                              </span>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(transaction.bookingCommission)}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(transaction.centerCommission)}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {transaction.receiverName}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {transaction.receiverNumber}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {transaction.senderName}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {transaction.senderNumber}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {transaction.remark || '-'}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                transaction.status 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {transaction.status ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-3">
                  {filteredTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      onClick={() => handleRowClick(transaction)}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{transaction.id}</p>
                          <p className="text-xs text-gray-500">{transaction.token}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600 text-sm">{formatCurrency(transaction.amount)}</p>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            transaction.type === 'OUTWARD' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {transaction.type}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                        <div>
                          <span className="font-medium">Date:</span> {transaction.date}
                        </div>
                        <div>
                          <span className="font-medium">Time:</span> {transaction.time}
                        </div>
                        <div>
                          <span className="font-medium">Center:</span> {transaction.center}
                        </div>
                        <div>
                          <span className="font-medium">Status:</span>
                          <span className={`ml-1 px-1 py-0.5 text-xs rounded-full ${
                            transaction.status 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="border-t pt-2">
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">Receiver:</span> {transaction.receiverName}
                          </div>
                          <div>
                            <span className="font-medium">Sender:</span> {transaction.senderName}
                          </div>
                        </div>
                        {transaction.remark && (
                          <div className="mt-2 text-xs text-gray-600">
                            <span className="font-medium">Remark:</span> {transaction.remark}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
