'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store';
import { formatCurrency, formatDate, formatTime, matchesTableSearch } from '@/lib/utils';
import { RefreshCw, Trash2, Save } from 'lucide-react';
import UpdatedEntryBadge from '@/components/reports/updated-entry-badge';
import { ClientTypeahead } from '@/components/ui/client-typeahead';
import { accountingApi, AccountingEntry } from '@/lib/accounting';
import { getFetchDateRange, matchesDateFilter } from '@/lib/date-filter';
import { compareEntriesByTimeDesc } from '@/lib/entry-sort';
import { DatePicker } from '@/components/ui/date-picker';
import { showSuccessToast, showUpdateToast, showDeleteToast, showErrorToast, Toaster } from '@/lib/toast';

// Category Data Structure
interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
}

// Transaction Form Data
interface TransactionForm {
  transactionNo: string;
  date: string;
  time: string;
  amount: number | '';
  amountType: 'INCOME' | 'EXPENSE';
  category: string;
  account: string;
  remark: string;
}

export default function AccountingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'accounts' | 'category'>('accounts');
  const [transactions, setTransactions] = useState<AccountingEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<AccountingEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByDate, setFilterByDate] = useState(false);
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [dateFilter, setDateFilter] = useState(() => {
    // Get current date in Indian timezone (UTC+5:30)
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
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryForm, setCategoryForm] = useState({ name: '', type: 'INCOME' as 'INCOME' | 'EXPENSE' });
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Generate transaction ID based on latest accounting transactions
  const generateTransactionId = () => {
    if (transactions.length === 0) {
      return 'TRN001';
    }

    // Find the highest existing transaction number from entryId or transactionId fields
    const transactionNumbers = transactions
      .map(t => t.entryId || t.transactionId)
      .filter((no): no is string => Boolean(no))
      .map(no => {
        const match = no.match(/TRN(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);

    const highestNumber = Math.max(...transactionNumbers, 0);
    const nextNumber = highestNumber + 1;
    return `TRN${nextNumber.toString().padStart(3, '0')}`;
  };

  // Transaction Form State
  const [transactionForm, setTransactionForm] = useState<TransactionForm>({
    transactionNo: 'TRN001',
    date: (() => {
      // Get current date in Indian timezone (UTC+5:30)
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
    })(),
    time: (() => {
      // Get current time in Indian timezone (UTC+5:30)
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      return formatter.format(now);
    })(),
    amount: '',
    amountType: 'INCOME',
    category: '',
    account: '',
    remark: ''
  });

  // Listen for tab changes from header
  useEffect(() => {
    const handleTabChange = (e: CustomEvent) => {
      setActiveTab(e.detail);
    };

    window.addEventListener('setAccountingTab', handleTabChange as EventListener);
    return () => window.removeEventListener('setAccountingTab', handleTabChange as EventListener);
  }, []);

  // Auto-refresh time every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      // Format Indian time (HH:MM)
      const indianTime = now.toLocaleTimeString('en-IN', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      });
      setTransactionForm(prev => ({ ...prev, time: indianTime }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch accounting entries
  const fetchAccountingEntries = async () => {
    try {
      const { dateFrom, dateTo } = getFetchDateRange(
        filterByDate,
        dateFilter,
        isSelectingRange,
        startDate,
        endDate
      );
      const response = await accountingApi.getAccountEntries({
        page: 1,
        limit: 1000,
        dateFrom,
        dateTo,
      });
      setTransactions(response.entries || []);
      return response.entries || [];
    } catch (error) {
      console.error('Failed to fetch accounting entries:', error);
      setTransactions([]);
      return [];
    }
  };

  const fetchNextTransactionId = async (): Promise<string> => {
    try {
      const response = await accountingApi.getNextTransactionId();
      return response?.nextTransactionId || generateTransactionId();
    } catch (error) {
      console.error('Failed to fetch next transaction ID:', error);
      return generateTransactionId();
    }
  };


  // Generate mock data and auto-generate transaction ID
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        const nextIdResponse = await accountingApi.getNextTransactionId();
        if (nextIdResponse?.nextTransactionId) {
          setTransactionForm(prev => ({ ...prev, transactionNo: nextIdResponse.nextTransactionId }));
        } else {
          setTransactionForm(prev => ({ ...prev, transactionNo: 'TRN001' }));
        }
      } catch (error) {
        console.error('Failed to fetch next transaction ID:', error);
        setTransactionForm(prev => ({ ...prev, transactionNo: 'TRN001' }));
      }

      try {
        const categories = await accountingApi.getAccountCategories();
        setCategories(categories);
      } catch (error) {
        console.error('Failed to fetch accounting categories:', error);
        setCategories([
          { id: '1', name: 'Cash', type: 'INCOME' },
          { id: '2', name: 'LBL', type: 'INCOME' },
          { id: '3', name: 'LBL', type: 'EXPENSE' },
          { id: '4', name: 'Money Transfer', type: 'EXPENSE' }
        ]);
      }
    };

    void loadData();
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchAccountingEntries();
  }, [isAuthenticated, filterByDate, dateFilter, startDate, endDate, isSelectingRange]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter((transaction) => {
        const typeLabel =
          transaction.type ||
          (transaction.accountType === 'INCOME_ACCOUNT' ? 'INCOME' : 'EXPENSE');
        const incomeAmount =
          transaction.type === 'INCOME' || transaction.accountType === 'INCOME_ACCOUNT'
            ? transaction.amount ?? transaction.creditAmount ?? 0
            : null;
        const expenseAmount =
          transaction.type === 'EXPENSE' || transaction.accountType === 'EXPENSE_ACCOUNT'
            ? transaction.amount ?? transaction.debitAmount ?? 0
            : null;

        return matchesTableSearch(
          searchTerm,
          formatDate(transaction.date),
          transaction.date,
          transaction.time,
          transaction.statusTime,
          transaction.createdAt,
          transaction.time ? formatTime(transaction.time) : '',
          transaction.statusTime ? formatTime(transaction.statusTime) : '',
          typeLabel,
          incomeAmount,
          expenseAmount,
          transaction.amount,
          transaction.creditAmount,
          transaction.debitAmount,
          incomeAmount != null ? formatCurrency(incomeAmount) : '',
          expenseAmount != null ? formatCurrency(expenseAmount) : '',
          transaction.category?.name,
          transaction.party?.name,
          transaction.partyId,
          transaction.accountId,
          transaction.description,
          transaction.entryId,
          transaction.transactionId,
        );
      });
    }

    // Backend now filters by current day and branch by default
    // Frontend only filters if user explicitly enables date filter
    if (filterByDate) {
      filtered = filtered.filter((transaction) =>
        matchesDateFilter(
          transaction.date,
          filterByDate,
          dateFilter,
          isSelectingRange,
          startDate,
          endDate,
        ),
      );
    }

    return filtered.sort(compareEntriesByTimeDesc);
  }, [transactions, searchTerm, filterByDate, dateFilter, isSelectingRange, startDate, endDate]);

  // Save transaction
  const saveTransaction = async () => {
    const amountValue =
      typeof transactionForm.amount === 'number' ? transactionForm.amount : 0;

    if (!amountValue || !transactionForm.category || !transactionForm.account) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    try {
      const entryData = {
        date: transactionForm.date,
        time: transactionForm.time,
        categoryId: transactionForm.category,
        amount: amountValue,
        description: transactionForm.remark || '',
        partyId: transactionForm.account,
        totalAmount: amountValue,
        type: transactionForm.amountType,
        status: 'COMPLETED',
      };

      if (selectedTransaction) {
        // Update existing transaction
        await accountingApi.updateAccountEntry(selectedTransaction.id, entryData);
        setSelectedTransaction(null);
        showUpdateToast('Accounting entry updated successfully');
      } else {
        // Add new transaction - backend will generate entryId
        await accountingApi.createAccountEntry(entryData);
        showSuccessToast('Accounting entry added successfully');
      }

      // Refresh data with a small delay to ensure backend has committed the entry
      await new Promise(resolve => setTimeout(resolve, 200));
      await fetchAccountingEntries();
      await clearForm();

      // Reset form to today after save
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
      const currentDate = `${year}-${month}-${day}`;
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const currentTime = timeFormatter.format(now);

      setTransactionForm(prev => ({
        ...prev,
        date: currentDate,
        time: currentTime,
      }));

      // Focus on amount input (keyboard-friendly)
      setTimeout(() => amountInputRef.current?.focus(), 100);
    } catch (error) {
      console.error('Failed to save transaction:', error);
      showErrorToast('Failed to save transaction. Please try again.');
    }
  };

  const formatTransactionTime = (time?: string, date?: string, fallback?: string) => {
    if (time) {
      if (/^\d{2}:\d{2}$/.test(time)) {
        return time;
      }
      return formatTime(time);
    }

    if (fallback) {
      return formatTime(fallback);
    }

    if (date) {
      return formatTime(date);
    }

    return '';
  };

  // Update transaction
  const updateTransaction = (transaction: AccountingEntry) => {
    console.log('📋 updateTransaction called with:', {
      id: transaction.id,
      entryId: transaction.entryId,
      transactionId: transaction.transactionId,
      type: transaction.type,
      date: transaction.date,
      party: transaction.party?.name,
    });
    setSelectedTransaction(transaction);
    
    // Format time to HH:MM (Indian time format)
    let timeValue = '00:00';
    if (transaction.statusTime) {
      // If statusTime has time component
      if (transaction.statusTime.includes('T')) {
        const timePart = transaction.statusTime.split('T')[1];
        if (timePart) {
          timeValue = timePart.substring(0, 5);
        }
      }
    } else if (transaction.time) {
      // Fallback to time field
      if (/^\d{2}:\d{2}/.test(transaction.time)) {
        timeValue = transaction.time.substring(0, 5);
      } else if (transaction.time.includes('T')) {
        const timePart = transaction.time.split('T')[1];
        if (timePart) {
          timeValue = timePart.substring(0, 5);
        }
      }
    } else if (transaction.date && transaction.date.includes('T')) {
      // Fallback: try to extract from date if it has time component
      const timePart = transaction.date.split('T')[1];
      if (timePart) {
        timeValue = timePart.substring(0, 5);
      }
    }

    // Format date to YYYY-MM-DD
    let dateValue = '';
    if (transaction.date) {
      if (transaction.date.includes('T')) {
        // If it's ISO format, take just the date part
        dateValue = transaction.date.split('T')[0];
      } else if (/^\d{4}-\d{2}-\d{2}/.test(transaction.date)) {
        // Already in correct format
        dateValue = transaction.date.substring(0, 10);
      } else {
        // Try to parse and format
        const date = new Date(transaction.date);
        if (!isNaN(date.getTime())) {
          dateValue = date.toISOString().split('T')[0];
        }
      }
    }

    // Get category ID from the categories list
    let categoryId = transaction.categoryId || '';
    if (transaction.category?.id) {
      categoryId = transaction.category.id;
    } else if (transaction.category?.name) {
      // Find category by name
      const foundCategory = categories.find(c => c.name === transaction.category?.name);
      if (foundCategory) {
        categoryId = foundCategory.id;
      }
    }

    // Determine amount type from type field or accountType
    const amountType = transaction.type ? transaction.type : (transaction.accountType === 'INCOME_ACCOUNT' ? 'INCOME' : 'EXPENSE');

    const transactionNo = transaction.entryId || transaction.transactionId || '';
    console.log('✏️ Setting transactionNo to:', transactionNo);

    setTransactionForm({
      transactionNo,
      date: dateValue,
      time: timeValue,
      amount: transaction.amount || transaction.creditAmount || transaction.debitAmount || '',
      amountType: amountType as 'INCOME' | 'EXPENSE',
      category: categoryId,
      account: transaction.party?.name || transaction.partyId || transaction.accountId || '',
      remark: transaction.description || ''
    });
  };

  // Delete transaction
  const deleteTransaction = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await accountingApi.deleteAccountEntry(id);
        showDeleteToast('Accounting entry deleted successfully');
        await fetchAccountingEntries();
        if (selectedTransaction?.id === id) {
          setSelectedTransaction(null);
          clearForm();
        }
      } catch (error) {
        console.error('Failed to delete transaction:', error);
        showErrorToast('Failed to delete transaction. Please try again.');
      }
    }
  };

  // Clear form
  const clearForm = async () => {
    const nextTransactionNo = await fetchNextTransactionId();
    setTransactionForm({
      transactionNo: nextTransactionNo,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      amount: '',
      amountType: 'INCOME',
      category: '',
      account: '',
      remark: ''
    });
    setSelectedTransaction(null);
    
    // Focus on amount input (keyboard-friendly)
    setTimeout(() => amountInputRef.current?.focus(), 100);
  };

  // Category management functions
  const saveCategory = () => {
    if (!categoryForm.name) {
      showErrorToast('Please enter category name');
      return;
    }

    if (selectedCategory) {
      // Update existing category
      setCategories(prev => prev.map(c => 
        c.id === selectedCategory.id 
          ? { ...c, name: categoryForm.name, type: categoryForm.type }
          : c
      ));
      setSelectedCategory(null);
      showUpdateToast('Category updated successfully');
    } else {
      // Add new category
      const newCategory: Category = {
        id: Date.now().toString(),
        name: categoryForm.name,
        type: categoryForm.type
      };
      setCategories(prev => [...prev, newCategory]);
      showSuccessToast('Category added successfully');
    }

    setCategoryForm({ name: '', type: 'INCOME' });
  };

  const updateCategory = (category: Category) => {
    setSelectedCategory(category);
    setCategoryForm({ name: category.name, type: category.type });
  };

  const deleteCategory = (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      setCategories(prev => prev.filter(c => c.id !== id));
      if (selectedCategory?.id === id) {
        setSelectedCategory(null);
        setCategoryForm({ name: '', type: 'INCOME' });
      }
    }
  };

  const clearCategoryForm = () => {
    setCategoryForm({ name: '', type: 'INCOME' });
    setSelectedCategory(null);
  };

  // Export functions
  if (!isAuthenticated) {
    return null;
  }

  const isIncome = transactionForm.amountType === 'INCOME';
  const glassBase =
    'rounded-2xl backdrop-blur-md transition-all duration-200 shadow-[inset_0_2px_8px_rgba(15,23,42,0.07)]';
  const inactiveFieldClass = `${glassBase} bg-slate-100/80 border border-slate-200/90 text-slate-500 cursor-not-allowed`;
  const datePickerClass = `${glassBase} h-10 border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-slate-100/50 to-slate-100/70 text-slate-600 hover:from-blue-50 hover:via-blue-50/80 hover:to-slate-100/80 hover:text-slate-700 shadow-[inset_0_2px_8px_rgba(59,130,246,0.12)]`;
  const timeFieldClass = `${glassBase} bg-white/80 border border-slate-200/90 text-slate-800 focus:ring-2 focus:ring-slate-400/25 focus:border-slate-400`;
  const incomeFieldClass = `${glassBase} bg-emerald-50/75 border border-emerald-300/80 text-emerald-950 placeholder:text-emerald-500/70 focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500 shadow-[inset_0_2px_8px_rgba(16,185,129,0.12)]`;
  const expenseFieldClass = `${glassBase} bg-red-50/85 border border-red-300/80 text-red-900 placeholder:text-red-400 focus:ring-2 focus:ring-red-500/35 focus:border-red-500 shadow-[inset_0_2px_8px_rgba(239,68,68,0.12)]`;
  const incomeSelectClass = `${glassBase} border-emerald-300/80 focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500 bg-emerald-50/75 text-emerald-950 font-semibold`;
  const expenseSelectClass = `${glassBase} border-red-300/80 focus:ring-2 focus:ring-red-500/35 focus:border-red-500 bg-red-50/85 text-red-900 font-semibold`;
  const typeFieldClass = isIncome ? incomeFieldClass : expenseFieldClass;
  const typeSelectClass = isIncome ? incomeSelectClass : expenseSelectClass;
  const typeLabelClass = isIncome ? 'text-emerald-800' : 'text-red-800';
  const contactFieldClass = `${glassBase} bg-white/95 border border-gray-200/90 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-orange-400/30 focus:border-orange-300 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)]`;
  const contactTypeaheadClass = `${glassBase} !rounded-2xl !bg-white/95 !border-gray-200/90 !text-gray-900 placeholder:!text-gray-500 focus:!ring-2 focus:!ring-orange-400/30 focus:!border-orange-300 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)]`;
  const isCategoryIncome = categoryForm.type === 'INCOME';
  const categoryTypeSelectClass = isCategoryIncome ? incomeSelectClass : expenseSelectClass;

  return (
    <>
      <div className="bg-white min-h-screen w-full">
        <div className="pt-16 space-y-4 sm:space-y-6">
        
        {/* TAB 1: ACCOUNTS */}
        {activeTab === 'accounts' && (
          <>

            {/* Transaction Entry Form */}
            <Card className="shadow-lg border-orange-200/40 bg-gradient-to-br from-white via-orange-50/95 to-orange-100/80 backdrop-blur-md relative z-10">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    General Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="transactionNo" className="text-sm font-medium text-slate-500">Transaction ID</Label>
                      <Input
                        id="transactionNo"
                        value={transactionForm.transactionNo}
                        readOnly
                        className={`mt-1 ${inactiveFieldClass} text-sm`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="date" className="text-sm font-medium text-slate-500">Date</Label>
                      <DatePicker
                        id="date"
                        value={transactionForm.date}
                        onChange={(date) => setTransactionForm(prev => ({ ...prev, date }))}
                        className={`mt-1 text-sm font-medium ${datePickerClass}`}
                        iconClassName="text-blue-500 drop-shadow-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="time" className="text-sm font-medium text-gray-700">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={transactionForm.time}
                        onChange={(e) => setTransactionForm(prev => ({ ...prev, time: e.target.value }))}
                        className={`mt-1 ${timeFieldClass} text-sm`}
                      />
                    </div>
                  </div>
                </div>

                <div className={`space-y-4 rounded-2xl border bg-white p-4 sm:p-5 shadow-sm ${isIncome ? 'border-emerald-200' : 'border-red-200'}`}>
                  <h3 className={`text-lg font-semibold border-b pb-2 ${isIncome ? 'text-emerald-900 border-emerald-200' : 'text-red-900 border-red-200'}`}>
                    {isIncome ? 'Income Entry' : 'Expense Entry'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="amount" className={`text-sm font-medium ${typeLabelClass}`}>Amount *</Label>
                      <Input
                        id="amount"
                        ref={amountInputRef}
                        type="number"
                        placeholder=""
                        value={transactionForm.amount === '' ? '' : transactionForm.amount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            setTransactionForm(prev => ({ ...prev, amount: '' }));
                            return;
                          }
                          if (/^\d+$/.test(value)) {
                            setTransactionForm(prev => ({ ...prev, amount: parseInt(value, 10) }));
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E' || e.key === '.') {
                            e.preventDefault();
                          }
                        }}
                        min="0"
                        step="1"
                        onWheel={(e) => e.currentTarget.blur()}
                        className={`mt-1 ${typeFieldClass} font-bold text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="amountType" className={`text-sm font-medium ${typeLabelClass}`}>Amount Type</Label>
                      <select
                        id="amountType"
                        value={transactionForm.amountType}
                        onChange={(e) => setTransactionForm(prev => ({ ...prev, amountType: e.target.value as 'INCOME' | 'EXPENSE' }))}
                        className={`w-full mt-1 h-10 px-3 text-sm ${typeSelectClass}`}
                      >
                        <option value="INCOME">INCOME</option>
                        <option value="EXPENSE">EXPENSE</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="category" className={`text-sm font-medium ${typeLabelClass}`}>Category</Label>
                      <select
                        id="category"
                        value={transactionForm.category}
                        onChange={(e) => setTransactionForm(prev => ({ ...prev, category: e.target.value }))}
                        className={`w-full mt-1 h-10 px-3 text-sm ${typeSelectClass}`}
                      >
                        <option value="">Select Category</option>
                        {categories.filter(c => c.type === transactionForm.amountType).map(category => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Account Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="account" className="text-sm font-medium text-gray-700">Account</Label>
                      <ClientTypeahead
                        id="account"
                        label=""
                        value={transactionForm.account}
                        onChange={(value, client) => setTransactionForm(prev => ({ ...prev, account: client?.name || value }))}
                        placeholder="Search client or enter account..."
                        className={`mt-1 h-10 ${contactTypeaheadClass}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="remark" className="text-sm font-medium text-gray-700">Remark</Label>
                      <Input
                        id="remark"
                        value={transactionForm.remark}
                        onChange={(e) => setTransactionForm(prev => ({ ...prev, remark: e.target.value }))}
                        className={`mt-1 ${contactFieldClass} text-sm`}
                        placeholder="Enter remark"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                      <Button
                        onClick={saveTransaction}
                        className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {selectedTransaction ? 'Update' : 'Save'}
                      </Button>
                      <Button
                        onClick={clearForm}
                        className="bg-red-600 hover:bg-red-700 text-white border-red-600 w-full sm:w-auto"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                      <Button
                        onClick={() => selectedTransaction ? deleteTransaction(selectedTransaction.id) : null}
                        disabled={!selectedTransaction}
                        className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 w-full sm:w-auto"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
              </CardContent>
            </Card>


            {/* Data Table */}
            <Card className="shadow-lg border-orange-200/40 bg-gradient-to-br from-white via-orange-50/95 to-orange-100/80 backdrop-blur-md relative z-10">
              <CardHeader className="pb-0">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-lg font-semibold text-gray-900">Accounting Entries</div>
                  <div className="flex items-center gap-2">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="filterByDate"
                        checked={filterByDate}
                        onChange={(e) => {
                          setFilterByDate(e.target.checked);
                          if (!e.target.checked) {
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
                    </div>

                    {filterByDate && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setStartDate('');
                              setEndDate('');
                              setDateFilter('');
                              setIsSelectingRange(false);
                            }}
                            className={`px-3 py-1 text-xs rounded ${!isSelectingRange && !dateFilter
                              ? 'bg-orange-600 text-white'
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
                            className={`px-3 py-1 text-xs rounded ${isSelectingRange
                              ? 'bg-orange-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                          >
                            Date Range
                          </button>
                        </div>

                        {!isSelectingRange ? (
                          <DatePicker
                            value={dateFilter}
                            onChange={setDateFilter}
                            placeholder="Select date"
                            className="h-8 text-sm"
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <DatePicker
                              value={startDate}
                              onChange={setStartDate}
                              placeholder="Start date"
                              className="h-8 text-sm"
                            />
                            <span className="text-gray-500 text-sm">to</span>
                            <DatePicker
                              value={endDate}
                              onChange={setEndDate}
                              placeholder="End date"
                              className="h-8 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="min-w-[260px] flex-1">
                    <Input
                      placeholder="Search accounting entries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`${contactFieldClass} w-full text-sm`}
                    />
                  </div>
                  </div>

                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 text-white">
                        <th className="px-4 py-3 text-left text-sm font-bold">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-bold">Time</th>
                        <th className="px-4 py-3 text-left text-sm font-bold">Type</th>
                        <th className="px-4 py-3 text-right text-sm font-bold">Income</th>
                        <th className="px-4 py-3 text-right text-sm font-bold">Expense</th>
                        <th className="px-4 py-3 text-left text-sm font-bold">Category</th>
                        <th className="px-4 py-3 text-left text-sm font-bold">Account</th>
                        <th className="px-4 py-3 text-left text-sm font-bold">Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction, index) => (
                        <tr
                          key={transaction.id}
                          className={`border-b cursor-pointer transition-colors ${
                            index % 2 === 0 ? 'bg-white/90 hover:bg-orange-50/70' : 'bg-orange-50/45 hover:bg-orange-100/55'
                          }`}
                          onClick={() => updateTransaction(transaction)}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className="inline-flex items-center">
                              {formatDate(transaction.date)}
                              <UpdatedEntryBadge
                                createdAt={transaction.createdAt}
                                updatedAt={transaction.updatedAt}
                              />
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatTransactionTime(
                            transaction.statusTime || transaction.time,
                            transaction.date,
                            transaction.createdAt,
                          )}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              transaction.type === 'INCOME' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.type || (transaction.accountType === 'INCOME_ACCOUNT' ? 'INCOME' : 'EXPENSE')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-green-600 font-bold">
                            {(transaction.type === 'INCOME' || transaction.accountType === 'INCOME_ACCOUNT') ? formatCurrency(transaction.amount || transaction.creditAmount || 0) : ''}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-red-600 font-bold">
                            {(transaction.type === 'EXPENSE' || transaction.accountType === 'EXPENSE_ACCOUNT') ? formatCurrency(transaction.amount || transaction.debitAmount || 0) : ''}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{transaction.category?.name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{transaction.party?.name || transaction.partyId || transaction.accountId || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{transaction.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* TAB 2: CATEGORY MANAGEMENT */}
        {activeTab === 'category' && (
          <>
            <Card className="shadow-lg border-orange-200/40 bg-gradient-to-br from-white via-orange-50/95 to-orange-100/80 backdrop-blur-md relative z-10">
              <CardContent className="p-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="categoryName" className="text-sm font-medium text-gray-700">Category Name</Label>
                    <Input
                      id="categoryName"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      className={`mt-1 ${contactFieldClass} text-sm`}
                      placeholder="Enter category name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoryType" className={`text-sm font-medium ${isCategoryIncome ? 'text-emerald-800' : 'text-red-800'}`}>Type</Label>
                    <select
                      id="categoryType"
                      value={categoryForm.type}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, type: e.target.value as 'INCOME' | 'EXPENSE' }))}
                      className={`w-full mt-1 h-10 px-3 text-sm ${categoryTypeSelectClass}`}
                    >
                      <option value="INCOME">Income</option>
                      <option value="EXPENSE">Expense</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    onClick={saveCategory}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {selectedCategory ? 'Update Category' : 'Add Category'}
                  </Button>
                  <Button
                    onClick={clearCategoryForm}
                    className="bg-gray-500 hover:bg-gray-600 text-white"
                  >
                    Clear
                  </Button>
                  {selectedCategory && (
                    <Button
                      onClick={() => deleteCategory(selectedCategory.id)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete
                    </Button>
                  )}
                </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-orange-200/40 bg-gradient-to-br from-white via-orange-50/95 to-orange-100/80 backdrop-blur-md relative z-10">
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 text-white">
                        <th className="px-4 py-3 text-left text-sm font-bold">Category Name</th>
                        <th className="px-4 py-3 text-left text-sm font-bold">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category, index) => (
                        <tr
                          key={category.id}
                          className={`border-b cursor-pointer transition-colors ${
                            index % 2 === 0 ? 'bg-white/90 hover:bg-orange-50/70' : 'bg-orange-50/45 hover:bg-orange-100/55'
                          }`}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">{category.name}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              category.type === 'INCOME' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {category.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => updateCategory(category)}
                                className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1"
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={() => deleteCategory(category.id)}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1"
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
    <Toaster />
    </>
  );
}
