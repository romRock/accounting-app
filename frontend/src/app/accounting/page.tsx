'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { RefreshCw, Trash2, Save } from 'lucide-react';
import { ClientTypeahead } from '@/components/ui/client-typeahead';
import { accountingApi, AccountingEntry } from '@/lib/accounting';

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
  amount: number;
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
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryForm, setCategoryForm] = useState({ name: '', type: 'INCOME' as 'INCOME' | 'EXPENSE' });
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

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
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    amount: 0,
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
      const response = await accountingApi.getAccountEntries();
      console.log('✅ Accounting entries fetched:', response.entries);
      if (response.entries.length > 0) {
        console.log('📝 First entry sample:', response.entries[0]);
        console.log('🆔 First entry ID:', response.entries[0].entryId);
      }
      setTransactions(response.entries);
      return response.entries;
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
        const entriesResponse = await accountingApi.getAccountEntries();
        setTransactions(entriesResponse.entries);
      } catch (error) {
        console.error('Failed to fetch accounting entries:', error);
        setTransactions([]);
      }

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

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        (transaction.party?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Always filter by date to show only current day entries by default
    filtered = filtered.filter(transaction => {
      let transactionDate = transaction.date?.includes('T')
        ? transaction.date.split('T')[0]
        : transaction.date || '';

      // Normalize date format - handle DD/MM/YYYY, YYYY-MM-DD, and other formats
      if (transactionDate.includes('/')) {
        const parts = transactionDate.split('/');
        if (parts.length === 3) {
          // Assume DD/MM/YYYY format
          transactionDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }

      // Get today's date in YYYY-MM-DD format for comparison
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // If filterByDate is enabled and user has selected a specific date or range
      if (filterByDate) {
        if (!isSelectingRange) {
          // Filter to selected date if provided, otherwise today
          return !dateFilter || transactionDate === dateFilter;
        }

        return startDate && endDate
          ? transactionDate >= startDate && transactionDate <= endDate
          : true;
      }

      // Default: always filter to today's date
      return transactionDate === todayString;
    });

    return filtered;
  }, [transactions, searchTerm, filterByDate, dateFilter, isSelectingRange, startDate, endDate]);

  // Save transaction
  const saveTransaction = async () => {
    if (!transactionForm.amount || !transactionForm.category || !transactionForm.account) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const entryData = {
        date: transactionForm.date,
        time: transactionForm.time,
        categoryId: transactionForm.category,
        amount: transactionForm.amount,
        description: transactionForm.remark || '',
        partyId: transactionForm.account, // This would need to be updated to actual party ID
        totalAmount: transactionForm.amount,
        type: transactionForm.amountType,
        status: 'COMPLETED',
      };

      if (selectedTransaction) {
        // Update existing transaction
        await accountingApi.updateAccountEntry(selectedTransaction.id, entryData);
        setSelectedTransaction(null);
      } else {
        // Add new transaction - backend will generate entryId
        await accountingApi.createAccountEntry(entryData);
      }

      // Refresh data
      await fetchAccountingEntries();
      await clearForm();
    } catch (error) {
      console.error('Failed to save transaction:', error);
      alert('Failed to save transaction. Please try again.');
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
      amount: transaction.amount || transaction.creditAmount || transaction.debitAmount || 0,
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
        await fetchAccountingEntries();
        if (selectedTransaction?.id === id) {
          setSelectedTransaction(null);
          await clearForm();
        }
      } catch (error) {
        console.error('Failed to delete transaction:', error);
        alert('Failed to delete transaction. Please try again.');
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
      amount: 0,
      amountType: 'INCOME',
      category: '',
      account: '',
      remark: ''
    });
    setSelectedTransaction(null);
  };

  // Category management functions
  const saveCategory = () => {
    if (!categoryForm.name) {
      alert('Please enter category name');
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
    } else {
      // Add new category
      const newCategory: Category = {
        id: Date.now().toString(),
        name: categoryForm.name,
        type: categoryForm.type
      };
      setCategories(prev => [...prev, newCategory]);
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

  return (
    <div className="bg-white min-h-screen w-full">
      <div className="pt-16 space-y-4 sm:space-y-6">
        
        {/* TAB 1: ACCOUNTS */}
        {activeTab === 'accounts' && (
          <>

            {/* Transaction Entry Form */}
            <Card className="shadow-lg border-gray-200/50 bg-gradient-to-br from-gray-100/90 via-blue-100/80 to-purple-100/75 backdrop-blur-md relative z-10">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Row 1 */}
                  <div>
                    <Label htmlFor="transactionNo" className="text-sm font-medium text-gray-700">Transaction ID</Label>
                    <Input
                      id="transactionNo"
                      value={transactionForm.transactionNo}
                      readOnly
                      className="bg-gray-50 border-gray-300 text-gray-500 mt-1 placeholder:text-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date" className="text-sm font-medium text-gray-700">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={transactionForm.date}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, date: e.target.value }))}
                      className="bg-white border-gray-300 mt-1 text-black placeholder:text-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time" className="text-sm font-medium text-gray-700">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={transactionForm.time}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, time: e.target.value }))}
                      className="bg-white border-gray-300 mt-1 text-black placeholder:text-gray-600"
                    />
                  </div>

                  {/* Row 2 */}
                  <div>
                    <Label htmlFor="amount" className="text-sm font-medium text-gray-700">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={transactionForm.amount}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow integers
                        if (value === '' || /^\d+$/.test(value)) {
                          setTransactionForm(prev => ({ ...prev, amount: parseInt(value) || 0 }));
                        }
                      }}
                      className="bg-white border-gray-300 mt-1 font-bold text-black text-lg placeholder:text-gray-600"
                      placeholder="0"
                      min="0"
                      step="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="amountType" className="text-sm font-medium text-gray-700">Amount Type</Label>
                    <select
                      id="amountType"
                      value={transactionForm.amountType}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, amountType: e.target.value as 'INCOME' | 'EXPENSE' }))}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="INCOME">INCOME</option>
                      <option value="EXPENSE">EXPENSE</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category</Label>
                    <select
                      id="category"
                      value={transactionForm.category}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Category</option>
                      {categories.filter(c => c.type === transactionForm.amountType).map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Row 3 */}
                  <div className="">
                    <Label htmlFor="account" className="text-sm font-medium text-gray-700">Account</Label>
                    <ClientTypeahead
                      id="account"
                      label=""
                      value={transactionForm.account}
                      onChange={(value, client) => setTransactionForm(prev => ({ ...prev, account: client?.name || value }))}
                      placeholder="Search client or enter account..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="remark" className="text-sm font-medium text-gray-700">Remark</Label>
                    <Input
                      id="remark"
                      value={transactionForm.remark}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, remark: e.target.value }))}
                      className="bg-white border-gray-300 mt-1 text-black placeholder:text-gray-600"
                      placeholder="Enter remark"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
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
                      <Button
                        onClick={saveTransaction}
                        className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {selectedTransaction ? 'Update' : 'Save'}
                      </Button>
                    </div>
              </CardContent>
            </Card>


            {/* Data Table */}
            <Card className="shadow-lg border-gray-200/50 bg-gradient-to-br from-gray-100/90 via-blue-100/80 to-purple-100/75 backdrop-blur-md relative z-10">
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
                            className={`px-3 py-1 text-xs rounded ${isSelectingRange
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
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="h-8 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white text-sm"
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              placeholder="Start date"
                              className="h-8 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white text-sm"
                            />
                            <span className="text-gray-500 text-sm">to</span>
                            <Input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              placeholder="End date"
                              className="h-8 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white text-sm"
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
                      className="bg-white w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm placeholder:text-gray-600"
                    />
                  </div>
                  </div>

                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-blue-900 text-white">
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
                            index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => updateTransaction(transaction)}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">{formatDate(transaction.date)}</td>
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
            <Card className="shadow-lg border-gray-200/50 bg-gradient-to-br from-gray-100/90 via-blue-100/80 to-purple-100/75 backdrop-blur-md relative z-10">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="categoryName" className="text-sm font-medium text-gray-700">Category Name</Label>
                    <Input
                      id="categoryName"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-white border-gray-300 mt-1 text-black placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter category name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoryType" className="text-sm font-medium text-gray-700">Type</Label>
                    <select
                      id="categoryType"
                      value={categoryForm.type}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, type: e.target.value as 'INCOME' | 'EXPENSE' }))}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              </CardContent>
            </Card>

            <Card className="shadow-lg border-gray-200/50 bg-gradient-to-br from-gray-100/90 via-blue-100/80 to-purple-100/75 backdrop-blur-md relative z-10">
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-blue-900 text-white">
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
                            index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
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
  );
}
