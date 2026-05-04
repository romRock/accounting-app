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
import { CityTypeahead } from '@/components/ui/typeahead';
import { ClientTypeahead } from '@/components/ui/client-typeahead';
import { useAuthStore } from '@/store/index';
import { formatCurrency, formatDate } from '@/lib/utils';
import { transactionApi, Transaction } from '@/lib/transactions';

// Modern transaction schema matching backend
const transactionSchema = z.object({
  id: z.string().optional(),
  transactionId: z.string().optional(),
  tokenNo: z.number().optional(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  centerId: z.string().min(1, 'Center is required'),
  amount: z.number().positive('Amount must be positive'),
  amountType: z.enum(['CASH', 'CREDIT']),
  commission: z.number().min(0, 'Commission must be non-negative'),
  autoCommission: z.boolean(),
  bookingCommission: z.number().optional(),
  centerCommission: z.number().optional(),
  receiverName: z.string().min(1, 'Receiver name is required'),
  receiverNumber: z.string().optional(),
  senderName: z.string().min(1, 'Sender name is required'),
  senderNumber: z.string().optional(),
  receiverClientId: z.string().optional(),
  senderClientId: z.string().optional(),
  remark: z.string().optional(),
  status: z.boolean(),
  type: z.enum(['OUTWARD', 'INWARD']),
});

type TransactionForm = z.infer<typeof transactionSchema>;

interface Center {
  id: string;
  name: string;
  code: string;
}

interface ClientData {
  id: string;
  name: string;
  mobileNumber: string;
  city: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [selectedReceiverClient, setSelectedReceiverClient] = useState<ClientData | null>(null);
  const [selectedSenderClient, setSelectedSenderClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'outward' | 'inward'>('outward');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filterByDate, setFilterByDate] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSelectingRange, setIsSelectingRange] = useState(false);
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
      transactionId: '',
      tokenNo: 1,
      date: (() => {
        const today = new Date();
        return today.getFullYear() + '-' + 
          String(today.getMonth() + 1).padStart(2, '0') + '-' + 
          String(today.getDate()).padStart(2, '0');
      })(),
      time: new Date().toTimeString().slice(0, 5),
      centerId: '',
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
      type: 'OUTWARD',
    },
  });

  const autoCommission = watch('autoCommission');
  const amount = watch('amount');

  // Fetch next transaction IDs from backend
  const fetchNextIds = async (date: string) => {
    try {
      const { accessToken } = useAuthStore.getState();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/transactions/next-ids?date=${date}&type=${activeTab.toUpperCase()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Next IDs fetched:', data);
        return data;
      } else {
        console.error('Failed to fetch next IDs:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch next IDs:', error);
    }
    return { nextTransactionId: 'PM2_001', nextTokenNo: 1 };
  };

  // Set current date and fetch next transaction IDs on mount and when editing changes or tab changes
  useEffect(() => {
    if (!editingTransaction) {
      // Get current date in local timezone (Indian time)
      const today = new Date();
      const currentDate = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');
      // Set current date in form
      setValue('date', currentDate);
      // Fetch next IDs
      fetchNextIds(currentDate).then(({ nextTransactionId, nextTokenNo }) => {
        setValue('transactionId', nextTransactionId);
        setValue('tokenNo', nextTokenNo);
      });
    }
  }, [editingTransaction, setValue, activeTab]);

  // Manual commission calculation for testing
  const calculateCommissionManually = () => {
    const currentAmount = watch('amount');
    const currentAutoCommission = watch('autoCommission');
    console.log('Manual calculation triggered:', { currentAmount, currentAutoCommission });
    
    if (currentAutoCommission && currentAmount > 0) {
      const commission = Math.round(currentAmount * 0.001); // 0.1% commission
      const bookingCommission = Math.round(commission * 0.35); // 35% booking
      const centerCommission = Math.round(commission * 0.65); // 65% center
      
      console.log('Manual setting commission values:', { commission, bookingCommission, centerCommission });
      
      setValue('commission', commission);
      setValue('bookingCommission', bookingCommission);
      setValue('centerCommission', centerCommission);
      
      alert(`Commission calculated: Total=${commission}, Booking=${bookingCommission}, Center=${centerCommission}`);
    } else {
      alert('Please enable Auto Commission and enter an amount > 0');
    }
  };

  // Auto-calculate commission
  useEffect(() => {
    console.log('Commission effect triggered:', { autoCommission, amount });
    if (autoCommission && amount > 0) {
      const commission = Math.round(amount * 0.001); // 0.1% commission
      const bookingCommission = Math.round(commission * 0.35); // 35% booking
      const centerCommission = Math.round(commission * 0.65); // 65% center
      
      console.log('Setting commission values:', { commission, bookingCommission, centerCommission });
      
      setValue('commission', commission);
      setValue('bookingCommission', bookingCommission);
      setValue('centerCommission', centerCommission);
      
      // Force a re-render by triggering a small delay
      setTimeout(() => {
        console.log('Commission values after timeout:', {
          commission: watch('commission'),
          bookingCommission: watch('bookingCommission'),
          centerCommission: watch('centerCommission')
        });
      }, 100);
    } else if (amount === 0) {
      // Reset commissions when amount is 0
      console.log('Resetting commission values to 0');
      setValue('commission', 0);
      setValue('bookingCommission', 0);
      setValue('centerCommission', 0);
    }
  }, [amount, autoCommission, setValue, watch]);

  // Calculate total commission as sum of booking and center when manual mode
  useEffect(() => {
    if (!autoCommission) {
      const bookingCommission = watch('bookingCommission') || 0;
      const centerCommission = watch('centerCommission') || 0;
      const totalCommission = bookingCommission + centerCommission;
      console.log('Manual mode - calculating total commission:', { bookingCommission, centerCommission, totalCommission });
      setValue('commission', totalCommission);
    }
  }, [watch('bookingCommission'), watch('centerCommission'), autoCommission, setValue]);

  // Update time continuously every second
  useEffect(() => {
    const updateTime = () => {
      if (!editingTransaction) {
        const currentTime = new Date().toTimeString().slice(0, 5);
        setValue('time', currentTime);
        console.log('Time updated:', currentTime);
      }
    };

    // Update immediately and then every second
    updateTime();
    const interval = setInterval(updateTime, 1000); // Update every 1 second

    return () => clearInterval(interval);
  }, [editingTransaction, setValue]);

  // Fetch data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchTransactions();
  }, [isAuthenticated, router, activeTab]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      console.log('Fetching transactions with type:', activeTab.toUpperCase());
      const data = await transactionApi.getTransactions({
        page: currentPage,
        limit: 20,
        type: activeTab.toUpperCase(),
      });
      console.log('Transactions received:', data);
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
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
        const updatedTransaction = await transactionApi.updateTransaction(editingTransaction.id, transactionData);
        setTransactions(transactions.map(t => 
          t.id === editingTransaction.id ? updatedTransaction : t
        ));
        setEditingTransaction(null);
      } else {
        // Create new transaction
        await transactionApi.createTransaction(transactionData);
        // Refetch transactions to get complete data with relationships
        await fetchTransactions();
      }

      reset();
      // Get current date in local timezone (Indian time)
      const today = new Date();
      const currentDate = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');
      fetchNextIds(currentDate).then(({ nextTransactionId, nextTokenNo }) => {
        setValue('transactionId', nextTransactionId);
        setValue('tokenNo', nextTokenNo);
      });
      setValue('date', currentDate);
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
    // Get current date in local timezone (Indian time)
    const today = new Date();
    const currentDate = today.toLocaleDateString('en-CA'); // Fix timezone issue
    fetchNextIds(currentDate).then(({ nextTransactionId, nextTokenNo }) => {
      setValue('transactionId', nextTransactionId);
      setValue('tokenNo', nextTokenNo);
    });
    setValue('date', currentDate);
    setValue('time', new Date().toTimeString().slice(0, 5));
    setValue('autoCommission', true);
    setEditingTransaction(null);
    setError(null);
    setTimeout(() => firstInputRef.current?.focus(), 100);
  };

  const handleDelete = async () => {
    if (editingTransaction) {
      try {
        await transactionApi.deleteTransaction(editingTransaction.id);
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
    setValue('transactionId', transaction.transactionId);
    setValue('tokenNo', transaction.tokenNo);
    setValue('date', transaction.date);
    setValue('time', transaction.time);
    setValue('centerId', transaction.centerId);
    setValue('amount', transaction.amount);
    setValue('amountType', transaction.amountType as any);
    setValue('commission', transaction.commission);
    setValue('bookingCommission', transaction.bookingCommission);
    setValue('centerCommission', transaction.centerCommission);
    setValue('receiverName', transaction.receiverName);
    setValue('receiverNumber', transaction.receiverNumber || '');
    setValue('senderName', transaction.senderName);
    setValue('senderNumber', transaction.senderNumber || '');
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
      transaction.transactionId.toLowerCase().includes(searchLower) ||
      transaction.tokenNo.toString().includes(searchLower) ||
      transaction.amount.toString().includes(searchLower) ||
      transaction.commission?.toString().includes(searchLower) ||
      transaction.receiverNumber?.toLowerCase().includes(searchLower) ||
      transaction.senderNumber?.toLowerCase().includes(searchLower) ||
      transaction.center?.name?.toLowerCase().includes(searchLower) ||
      transaction.amountType?.toLowerCase().includes(searchLower) ||
      transaction.date?.includes(searchLower) ||
      transaction.time?.includes(searchLower) ||
      transaction.remark?.toLowerCase().includes(searchLower);
    
    // Convert transaction date to Date object for comparison
    const transactionDate = new Date(transaction.date);
    const transactionDateString = transactionDate.toISOString().split('T')[0];
    
    // Get today's date in local timezone for comparison
    const today = new Date();
    const todayString = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0');
    
    // Default to showing current day transactions, or filter by date range
    const matchesDate = !filterByDate ? 
      transactionDateString === todayString : 
      (isSelectingRange && startDate && endDate ? 
        transactionDateString >= startDate && transactionDateString <= endDate :
        dateFilter && transactionDateString === dateFilter);
    
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
                    <Label htmlFor="transactionId" className="text-sm font-medium text-gray-700">Id No</Label>
                    <Input
                      id="transactionId"
                      {...register('transactionId')}
                      readOnly
                      className="bg-gray-50 border-gray-300 text-gray-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tokenNo" className="text-sm font-medium text-gray-700">Token No</Label>
                    <Input
                      id="tokenNo"
                      {...register('tokenNo')}
                      readOnly
                      className="bg-gray-50 border-gray-300 text-gray-500 text-sm"
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
                  
                  <CityTypeahead
                    id="centerId"
                    label="Center"
                    value={watch('centerId') || ''}
                    onChange={(value, city) => {
                      setValue('centerId', value);
                      setSelectedCity(city);
                    }}
                    placeholder="Search city..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="amount" className="text-sm font-medium text-gray-700">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0"
                      value={watch('amount') || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setValue('amount', value);
                        console.log('Amount changed to:', value);
                        // Trigger commission calculation immediately
                        if (watch('autoCommission') && value > 0) {
                          const commission = Math.round(value * 0.001); // 0.1% commission
                          const bookingCommission = Math.round(commission * 0.35);
                          const centerCommission = Math.round(commission * 0.65);
                          console.log('Immediate commission calculation:', { commission, bookingCommission, centerCommission });
                          setValue('commission', commission);
                          setValue('bookingCommission', bookingCommission);
                          setValue('centerCommission', centerCommission);
                        } else {
                          setValue('commission', 0);
                          setValue('bookingCommission', 0);
                          setValue('centerCommission', 0);
                        }
                      }}
                      className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-bold text-black text-lg placeholder:text-gray-600"
                      ref={firstInputRef}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="amountType" className="text-sm font-medium text-gray-700">Amount Type</Label>
                    <select
                      id="amountType"
                      {...register('amountType')}
                      className="w-full h-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-black text-sm"
                    >
                      <option value="CASH">CASH</option>
                      <option value="CREDIT">CREDIT</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="commission" className="text-sm font-medium text-gray-700">Commission</Label>
                    <Input
                      id="commission"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={watch('commission') || 0}
                      readOnly={autoCommission}
                      className={`border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-bold text-lg placeholder:text-gray-600 ${
                        autoCommission ? 'bg-gray-100 text-gray-500' : 'bg-white text-black'
                      }`}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="autoCommission"
                      checked={watch('autoCommission')}
                      onChange={(e) => setValue('autoCommission', e.target.checked)}
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
                      onChange={(e) => setValue('bookingCommission', Number(e.target.value))}
                      readOnly={autoCommission}
                      className={`border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-medium text-sm ${
                        autoCommission ? 'bg-gray-50 text-green-600' : 'bg-white text-black'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Center Commission</Label>
                    <Input
                      value={watch('centerCommission') || 0}
                      onChange={(e) => setValue('centerCommission', Number(e.target.value))}
                      readOnly={autoCommission}
                      className={`border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-medium text-sm ${
                        autoCommission ? 'bg-gray-50 text-green-600' : 'bg-white text-black'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Contact Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="relative" style={{ zIndex: 101 }}>
                    <ClientTypeahead
                      id="receiverName"
                      label="Receiver Name"
                      value={watch('receiverName') || ''}
                      onChange={(value: string, client?: ClientData) => {
                        setValue('receiverName', value);
                        if (client && client.mobileNumber) {
                          setValue('receiverNumber', client.mobileNumber);
                          setSelectedReceiverClient(client);
                        } else {
                          setSelectedReceiverClient(null);
                        }
                      }}
                      placeholder="Search receiver name..."
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
                  
                  <div className="relative" style={{ zIndex: 99 }}>
                    <ClientTypeahead
                      id="senderName"
                      label="Sender Name"
                      value={watch('senderName') || ''}
                      onChange={(value: string, client?: ClientData) => {
                        setValue('senderName', value);
                        if (client && client.mobileNumber) {
                          setValue('senderNumber', client.mobileNumber);
                          setSelectedSenderClient(client);
                        } else {
                          setSelectedSenderClient(null);
                        }
                      }}
                      placeholder="Search sender name..."
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

                              </div>

              {/* Section 3: Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0 pt-4 border-t">
                <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    className="bg-red-600 hover:bg-red-700 text-white border-red-600 w-full sm:w-auto"
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
                    className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                  >
                    {submitting ? 'Saving...' : (editingTransaction ? 'Update' : 'Save')}
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
                        // Reset states when enabling filter
                        const today = new Date();
                        const currentDate = today.getFullYear() + '-' + 
                          String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(today.getDate()).padStart(2, '0');
                        setDateFilter(currentDate);
                        setStartDate('');
                        setEndDate('');
                        setIsSelectingRange(false);
                      } else {
                        // Reset all date states when disabling filter
                        setDateFilter('');
                        setStartDate('');
                        setEndDate('');
                        setIsSelectingRange(false);
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="filterByDate" className="text-sm font-medium text-gray-700">
                    By Date
                  </Label>
                  {filterByDate && (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setStartDate('');
                            setEndDate('');
                            setDateFilter('');
                            setIsSelectingRange(false);
                          }}
                          className={`px-3 py-1 text-xs rounded ${
                            !isSelectingRange && !dateFilter 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Single Date
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStartDate('');
                            setEndDate('');
                            setDateFilter('');
                            setIsSelectingRange(true);
                          }}
                          className={`px-3 py-1 text-xs rounded ${
                            isSelectingRange 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Date Range
                        </button>
                      </div>
                      
                      {!isSelectingRange ? (
                        <Input
                          type="date"
                          value={dateFilter}
                          onChange={(e) => {
                            setDateFilter(e.target.value);
                          }}
                          className="h-8 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm"
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            placeholder="Start date"
                            className="h-8 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm"
                          />
                          <span className="text-gray-500 text-sm">to</span>
                          <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            placeholder="End date"
                            className="h-8 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm"
                          />
                        </div>
                      )}
                    </div>
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
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Center</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Type</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Comm</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Center Comm</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receiver Name</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender Name</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTransactions.map((transaction) => (
                          <tr
                            key={transaction.id}
                            onClick={() => handleRowClick(transaction)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                          >
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {transaction.tokenNo}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {new Date(transaction.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {new Date(transaction.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {transaction.center?.name}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs font-semibold text-blue-600">
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {transaction.amountType}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {formatCurrency(transaction.bookingCommission || 0)}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {formatCurrency(transaction.centerCommission || 0)}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {transaction.receiverName}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {transaction.senderName}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                              {transaction.remark || '-'}
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
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Center</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Type</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Comm</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Center Comm</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receiver Name</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender Name</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTransactions.map((transaction) => (
                          <tr
                            key={transaction.id}
                            onClick={() => handleRowClick(transaction)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                          >
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {transaction.tokenNo}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {new Date(transaction.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {new Date(transaction.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {transaction.center?.name}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-blue-600">
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {transaction.amountType}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(transaction.bookingCommission || 0)}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(transaction.centerCommission || 0)}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {transaction.receiverName}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {transaction.senderName}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {transaction.remark || '-'}
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
                          <p className="font-medium text-gray-900 text-sm">Token: {transaction.tokenNo}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600 text-sm">{formatCurrency(transaction.amount)}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                        <div>
                          <span className="font-medium">Date:</span> {new Date(transaction.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </div>
                        <div>
                          <span className="font-medium">Time:</span> {new Date(transaction.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                        <div>
                          <span className="font-medium">Center:</span> {transaction.center?.name}
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
