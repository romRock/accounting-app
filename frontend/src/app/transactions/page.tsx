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
import { ClientTypeahead, Client } from '@/components/ui/client-typeahead';
import { useAuthStore } from '@/store/index';
import { formatCurrency, formatDate } from '@/lib/utils';
import { RefreshCw, Trash2, Save } from 'lucide-react';
import { transactionApi, Transaction } from '@/lib/transactions';
import { showSuccessToast, showUpdateToast, showDeleteToast, showErrorToast, Toaster } from '@/lib/toast';

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
  cuttingCommission: z.number().optional(), // For inward transactions
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
  mobileNumber?: string;
  city?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  
  // Tab state for switching between outward and inward
  const [activeTab, setActiveTab] = useState<'outward' | 'inward'>('outward');
  const { user, isAuthenticated } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [selectedReceiverClient, setSelectedReceiverClient] = useState<ClientData | null>(null);
  const [selectedSenderClient, setSelectedSenderClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const centerInputRef = useRef<HTMLInputElement>(null);
  const cityTypeaheadRef = useRef<any>(null);
  const [filterByDate, setFilterByDate] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [cityResetKey, setCityResetKey] = useState('0');

  // Force form update when editingTransaction changes
  useEffect(() => {
    if (editingTransaction) {
      console.log('=== FORM UPDATE EFFECT TRIGGERED ===');
      setValue('transactionId', editingTransaction.transactionId);
      setValue('tokenNo', editingTransaction.tokenNo);
      setValue('date', new Date(editingTransaction.date).toISOString().split('T')[0]);
      setValue('time', new Date().toTimeString().slice(0, 5));
      setValue('centerId', editingTransaction.centerId);
      setValue('amount', editingTransaction.amount);
      setValue('amountType', editingTransaction.amountType as any);
      setValue('commission', editingTransaction.commission);
      setValue('bookingCommission', editingTransaction.bookingCommission);
      setValue('centerCommission', editingTransaction.centerCommission);
      setValue('receiverName', editingTransaction.receiverName);
      setValue('receiverNumber', editingTransaction.receiverNumber || '');
      setValue('senderName', editingTransaction.senderName);
      setValue('senderNumber', editingTransaction.senderNumber || '');
      setValue('remark', editingTransaction.remark || '');
      setValue('status', editingTransaction.status);
      setValue('autoCommission', false);
      
      if (editingTransaction.center) {
        setSelectedCity(editingTransaction.center);
      }
    }
  }, [editingTransaction]);

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
  const fetchNextIds = async (date: string, transactionType?: string) => {
    try {
      const { accessToken } = useAuthStore.getState();
      const type = transactionType || activeTab.toUpperCase();
      console.log('Fetching next IDs with:', { date, type, activeTab });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/transactions/next-ids?date=${date}&type=${type}`, {
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
      const currentDate = today.toLocaleDateString('en-CA'); // Fix timezone issue
      
      // Set current date in form
      setValue('date', currentDate);
      // Fetch next IDs
      fetchNextIds(currentDate, activeTab.toUpperCase()).then(({ nextTransactionId, nextTokenNo }) => {
        setValue('transactionId', nextTransactionId);
        setValue('tokenNo', nextTokenNo);
      });
    }
  }, [editingTransaction, setValue, activeTab]);

  // All commission calculation functions removed - backend handles all calculations

  // Auto-calculate commission using simple 0.01% rule
  useEffect(() => {
    console.log('Commission effect triggered:', { autoCommission, amount, activeTab });
    if (autoCommission && amount > 0) {
      if (activeTab === 'outward') {
        const commission = Math.round(amount * 0.001); // 0.01% commission
        const bookingCommission = Math.round(commission * 0.33); // 33% our commission
        const centerCommission = Math.round(commission * 0.67); // 67% center commission
        
        console.log('Setting outward commission values:', { commission, bookingCommission, centerCommission });
        
        setValue('commission', commission);
        setValue('bookingCommission', bookingCommission);
        setValue('centerCommission', centerCommission);
      } else {
        // Inward - 35% of total commission (1% of amount)
        const totalCommission = Math.round(amount * 0.001); // 1% total commission
        const cuttingCommission = Math.round(totalCommission * 0.35); // 35% of total commission
        
        console.log('Setting inward cutting commission:', { totalCommission, cuttingCommission });
        
        setValue('cuttingCommission', cuttingCommission);
      }
    } else if (amount === 0) {
      // Reset commissions when amount is 0
      console.log('Resetting commission values to 0');
      if (activeTab === 'outward') {
        setValue('commission', 0);
        setValue('bookingCommission', 0);
        setValue('centerCommission', 0);
      } else {
        setValue('cuttingCommission', 0);
      }
    }
  }, [amount, autoCommission, setValue, activeTab]);

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

      const transactionData = {
        ...data,
        type: activeTab.toUpperCase(),
        statusTime: new Date().toISOString(),
      };

      if (editingTransaction) {
        // Update existing transaction
        const updatedTransaction = await transactionApi.updateTransaction(editingTransaction.id, transactionData);
        // Refetch transactions to get complete data with relationships
        await fetchTransactions();
        setEditingTransaction(null);
        showUpdateToast('Transaction updated successfully');
      } else {
        // Create new transaction
        const createdTransaction = await transactionApi.createTransaction(transactionData);
        // Refetch transactions to get complete data with relationships
        await fetchTransactions();
        showSuccessToast('Transaction added successfully');
        
        // Set commission values from backend response
        if (createdTransaction.commission !== undefined) {
          if (activeTab === 'outward') {
            setValue('commission', createdTransaction.commission);
            setValue('bookingCommission', createdTransaction.bookingCommission || 0);
            setValue('centerCommission', createdTransaction.centerCommission || 0);
          } else {
            setValue('cuttingCommission', createdTransaction.bookingCommission || 0);
          }
        }
      }

      reset();
      // Get current date in local timezone (Indian time)
      const today = new Date();
      const currentDate = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');
      fetchNextIds(currentDate, activeTab.toUpperCase()).then(({ nextTransactionId, nextTokenNo }) => {
        setValue('transactionId', nextTransactionId);
        setValue('tokenNo', nextTokenNo);
      });
      setValue('date', currentDate);
      setValue('time', new Date().toTimeString().slice(0, 5));
      setValue('autoCommission', true);
      
      // Focus on center input (keyboard-friendly)
      setTimeout(() => centerInputRef.current?.focus(), 100);
    } catch (err: any) {
      showErrorToast('Failed to save transaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    reset();
    // Get current date in local timezone (Indian time)
    const today = new Date();
    const currentDate = today.toLocaleDateString('en-CA'); // Fix timezone issue
    fetchNextIds(currentDate, activeTab.toUpperCase()).then(({ nextTransactionId, nextTokenNo }) => {
      setValue('transactionId', nextTransactionId);
      setValue('tokenNo', nextTokenNo);
    });
    setValue('date', currentDate);
    setValue('time', new Date().toTimeString().slice(0, 5));
    setValue('autoCommission', true);
    setValue('centerId', ''); // Force clear city input
    setEditingTransaction(null);
    setSelectedCity(null); // Clear city selection
    setSelectedReceiverClient(null); // Clear receiver client
    setSelectedSenderClient(null); // Clear sender client
    setCityResetKey(Date.now().toString()); // Trigger city typeahead reset
        
    setTimeout(() => centerInputRef.current?.focus(), 100);
  };

  const handleDelete = async () => {
    if (editingTransaction) {
      try {
        await transactionApi.deleteTransaction(editingTransaction.id);
        // Refetch transactions to get complete data with relationships
        await fetchTransactions();
        handleClear();
        showDeleteToast('Transaction deleted successfully');
      } catch (err: any) {
        showErrorToast('Failed to delete transaction. Please try again.');
      }
    }
  };

  // Handle row click to edit transaction
  const handleRowClick = (transaction: Transaction) => {
    console.log('=== EDIT TRANSACTION DEBUG ===');
    console.log('Transaction data:', transaction);
    console.log('Transaction.center:', transaction.center);
    console.log('Transaction.receiverName:', transaction.receiverName);
    console.log('Transaction.senderName:', transaction.senderName);
    
    setEditingTransaction(transaction);
    setActiveTab(transaction.type.toLowerCase() as 'outward' | 'inward');
    setValue('transactionId', transaction.transactionId);
    setValue('tokenNo', transaction.tokenNo);
    setValue('date', new Date(transaction.date).toISOString().split('T')[0]);
    setValue('time', new Date().toTimeString().slice(0, 5)); // Show current time when editing
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
    
    // Set selectedCity for editing
    if (transaction.center) {
      console.log('Setting selectedCity to:', transaction.center);
      setSelectedCity(transaction.center);
    }
    
    console.log('=== EDIT TRANSACTION SET VALUES COMPLETE ===');
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
    // Check if date is valid before calling toISOString()
    if (isNaN(transactionDate.getTime())) {
      console.warn('Invalid date value:', transaction.date);
      return false; // Skip this transaction if date is invalid
    }
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

  // Show error toast for validation errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      showErrorToast(firstError?.message || 'Please fill in all required fields');
    }
  }, [errors]);

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
    <>
      <div className="bg-white min-h-screen w-full">
        <div className="pt-16 space-y-4 sm:space-y-6">
        {/* Transaction Form */}
        <Card className="shadow-lg border-gray-200/50 bg-gradient-to-br from-gray-100/90 via-blue-100/80 to-purple-100/75 backdrop-blur-md relative z-10">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">
              {editingTransaction ? 'Edit Transaction' : `${activeTab === 'outward' ? 'Outward' : 'Inward'} Booking`}
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter {activeTab === 'outward' ? 'outward' : 'inward'} transaction details below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                      value={editingTransaction ? new Date().toTimeString().slice(0, 5) : watch('time')}
                      onChange={(e) => setValue('time', e.target.value)}
                      className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm placeholder:text-gray-600"
                    />
                  </div>
                  
                  <CityTypeahead
                    id="centerId"
                    label="Center"
                    value={selectedCity?.name || watch('centerId') || ''}
                    onChange={(value, city) => {
                      console.log('CityTypeahead onChange - value:', value, 'city:', city);
                      setValue('centerId', city?.id || value);
                      setSelectedCity(city);
                    }}
                    placeholder="Search city..."
                    resetKey={cityResetKey}
                    inputRef={centerInputRef}
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
                  
                  {activeTab === 'outward' ? (
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
                ) : (
                  <div>
                    <Label htmlFor="cuttingCommission" className="text-sm font-medium text-gray-700">Cutting Commission</Label>
                    <Input
                      id="cuttingCommission"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={watch('cuttingCommission') || 0}
                      readOnly={autoCommission}
                      className={`border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-bold text-lg placeholder:text-gray-600 ${
                        autoCommission ? 'bg-gray-100 text-gray-500' : 'bg-white text-black'
                      }`}
                    />
                  </div>
                )}
                  
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

                {activeTab === 'outward' ? (
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
                ) : null}
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
                      onChange={(value: string, client?: Client) => {
                        console.log('ReceiverTypeahead onChange - value:', value, 'client:', client);
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
                      onChange={(value: string, client?: Client) => {
                        console.log('SenderTypeahead onChange - value:', value, 'client:', client);
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
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                  
                  {editingTransaction && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 w-full sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
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
                    <Save className="w-4 h-4 mr-2" />
                    {submitting ? 'Saving...' : (editingTransaction ? 'Update' : 'Save')}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Section 4: Recent Transactions */}
        <Card className="shadow-lg border-gray-200/50 bg-gradient-to-br from-gray-100/90 via-blue-100/80 to-purple-100/75 backdrop-blur-md relative z-10">
          <CardHeader className="pb-4">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">Recent Transactions</CardTitle>
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
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-blue-900 text-white">
                          <th className="px-4 py-3 text-left text-sm font-bold">Token</th>
                          <th className="px-4 py-3 text-left text-sm font-bold">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-bold">Time</th>
                          <th className="px-4 py-3 text-left text-sm font-bold">Center</th>
                          <th className="px-4 py-3 text-left text-sm font-bold">Amount</th>
                          <th className="px-4 py-3 text-left text-sm font-bold">Amount Type</th>
                          {activeTab === 'outward' ? (
                            <>
                              <th className="px-4 py-3 text-left text-sm font-bold">Booking Comm</th>
                              <th className="px-4 py-3 text-left text-sm font-bold">Center Comm</th>
                            </>
                          ) : (
                            <th className="px-4 py-3 text-left text-sm font-bold">Cutting Comm</th>
                          )}
                          <th className="px-4 py-3 text-left text-sm font-bold">Receiver Name</th>
                          <th className="px-4 py-3 text-left text-sm font-bold">Sender Name</th>
                          <th className="px-4 py-3 text-left text-sm font-bold">Remark</th>
                          <th className="px-4 py-3 text-center text-sm font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((transaction, index) => (
                          <tr
                            key={transaction.id}
                            onClick={() => handleRowClick(transaction)}
                            className={`border-b cursor-pointer transition-colors ${
                              index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {transaction.tokenNo}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(transaction.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(transaction.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {transaction.center?.name}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {transaction.amountType}
                            </td>
                            {activeTab === 'outward' ? (
                            <>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {formatCurrency(transaction.bookingCommission || 0)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {formatCurrency(transaction.centerCommission || 0)}
                              </td>
                            </>
                          ) : (
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatCurrency(transaction.bookingCommission || 0)}
                            </td>
                          )}
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {transaction.receiverName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {transaction.senderName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {transaction.remark || '-'}
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              <div className="flex justify-center space-x-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRowClick(transaction);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                  title="Edit"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTransaction(transaction);
                                    handleDelete();
                                  }}
                                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                  title="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
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
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-blue-900 text-white">
                          <th className="px-4 py-3 text-left text-sm font-bold">Token</th>
                          <th className="px-4 py-3 text-left text-sm font-bold">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-bold">Time</th>
                          <th className="px-4 py-3 text-left text-sm font-bold">Center</th>
                          <th className="px-4 py-3 text-left text-sm font-bold">Amount</th>
                          <th className="px-4 py-3 text-left text-sm font-bold">Amount Type</th>
                          {activeTab === 'outward' ? (
                            <>
                              <th className="px-4 py-3 text-left text-sm font-bold">Booking Comm</th>
                              <th className="px-4 py-3 text-left text-sm font-bold">Center Comm</th>
                            </>
                          ) : (
                            <th className="px-4 py-3 text-left text-sm font-bold">Cutting Comm</th>
                          )}
                          <th className="px-4 py-3 text-left text-sm font-bold">Receiver Name</th>
                          <th className="px-4 py-3 text-left text-sm font-bold">Sender Name</th>
                          <th className="px-4 py-3 text-left text-sm font-bold">Remark</th>
                          <th className="px-4 py-3 text-center text-sm font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((transaction, index) => (
                          <tr
                            key={transaction.id}
                            onClick={() => handleRowClick(transaction)}
                            className={`border-b cursor-pointer transition-colors ${
                              index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {transaction.tokenNo}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(transaction.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(transaction.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {transaction.center?.name}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {transaction.amountType}
                            </td>
                            {activeTab === 'outward' ? (
                            <>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {formatCurrency(transaction.bookingCommission || 0)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {formatCurrency(transaction.centerCommission || 0)}
                              </td>
                            </>
                          ) : (
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatCurrency(transaction.bookingCommission || 0)}
                            </td>
                          )}
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {transaction.receiverName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {transaction.senderName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {transaction.remark || '-'}
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRowClick(transaction);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                                  title="Edit"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTransaction(transaction);
                                    handleDelete();
                                  }}
                                  className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                                  title="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
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
                        
                        {/* Actions for mobile */}
                        <div className="border-t pt-3 mt-3 flex justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(transaction);
                            }}
                            className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded text-xs font-medium hover:bg-blue-50 border border-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTransaction(transaction);
                              handleDelete();
                            }}
                            className="text-red-600 hover:text-red-800 px-3 py-1 rounded text-xs font-medium hover:bg-red-50 border border-red-200"
                          >
                            Delete
                          </button>
                        </div>
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
    <Toaster />
    </>
  );
}
