'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store';
import { formatCurrency, formatDate } from '@/lib/utils';

// Transaction Data Structure
interface Transaction {
  id: string;
  transactionNo: string;
  date: string;
  time: string;
  amountType: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  account: string;
  remark: string;
}

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
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'accounts' | 'category' | 'reports'>('accounts');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [byDate, setByDate] = useState(false);
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionCounter, setTransactionCounter] = useState(1);
  const [reportType, setReportType] = useState<'transaction' | 'refund' | 'customer'>('transaction');
  const [categoryForm, setCategoryForm] = useState({ name: '', type: 'INCOME' as 'INCOME' | 'EXPENSE' });
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Transaction Form State
  const [transactionForm, setTransactionForm] = useState<TransactionForm>({
    transactionNo: 'TRX001',
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

  // Generate mock data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Generate mock categories
    const mockCategories: Category[] = [
      { id: '1', name: 'Sales Revenue', type: 'INCOME' },
      { id: '2', name: 'Service Income', type: 'INCOME' },
      { id: '3', name: 'Rent Income', type: 'INCOME' },
      { id: '4', name: 'Office Supplies', type: 'EXPENSE' },
      { id: '5', name: 'Utilities', type: 'EXPENSE' },
      { id: '6', name: 'Salaries', type: 'EXPENSE' },
      { id: '7', name: 'Marketing', type: 'EXPENSE' },
      { id: '8', name: 'Transportation', type: 'EXPENSE' }
    ];
    setCategories(mockCategories);

    // Generate mock transactions
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        transactionNo: 'TRX001',
        date: '2024-04-01',
        time: '09:30',
        amountType: 'INCOME',
        amount: 50000,
        category: 'Sales Revenue',
        account: 'ABC Company',
        remark: 'Monthly sales payment'
      },
      {
        id: '2',
        transactionNo: 'TRX002',
        date: '2024-04-01',
        time: '10:15',
        amountType: 'EXPENSE',
        amount: 12000,
        category: 'Office Supplies',
        account: 'Stationery Shop',
        remark: 'Office equipment purchase'
      },
      {
        id: '3',
        transactionNo: 'TRX003',
        date: '2024-04-02',
        time: '14:20',
        amountType: 'INCOME',
        amount: 35000,
        category: 'Service Income',
        account: 'XYZ Services',
        remark: 'Consulting fees'
      },
      {
        id: '4',
        transactionNo: 'TRX004',
        date: '2024-04-02',
        time: '16:45',
        amountType: 'EXPENSE',
        amount: 8000,
        category: 'Utilities',
        account: 'Electricity Board',
        remark: 'Monthly electricity bill'
      }
    ];
    setTransactions(mockTransactions);
    setFilteredTransactions(mockTransactions);
    setTransactionCounter(mockTransactions.length + 1);
  }, [isAuthenticated, router]);

  // Filter transactions based on search and date
  useEffect(() => {
    let filtered = transactions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.remark.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (byDate && fromDate && toDate) {
      filtered = filtered.filter(transaction =>
        transaction.date >= fromDate && transaction.date <= toDate
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, byDate, fromDate, toDate]);

  // Save transaction
  const saveTransaction = () => {
    if (!transactionForm.amount || !transactionForm.category || !transactionForm.account) {
      alert('Please fill in all required fields');
      return;
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      transactionNo: `TRX${String(transactionCounter).padStart(3, '0')}`,
      date: transactionForm.date,
      time: transactionForm.time,
      amountType: transactionForm.amountType,
      amount: transactionForm.amount,
      category: transactionForm.category,
      account: transactionForm.account,
      remark: transactionForm.remark
    };

    if (selectedTransaction) {
      // Update existing transaction
      setTransactions(prev => prev.map(t => t.id === selectedTransaction.id ? newTransaction : t));
      setSelectedTransaction(null);
    } else {
      // Add new transaction
      setTransactions(prev => [...prev, newTransaction]);
      setTransactionCounter(prev => prev + 1);
    }

    clearForm();
  };

  // Update transaction
  const updateTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTransactionForm({
      transactionNo: transaction.transactionNo,
      date: transaction.date,
      time: transaction.time,
      amount: transaction.amount,
      amountType: transaction.amountType,
      category: transaction.category,
      account: transaction.account,
      remark: transaction.remark
    });
  };

  // Delete transaction
  const deleteTransaction = (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      if (selectedTransaction?.id === id) {
        setSelectedTransaction(null);
        clearForm();
      }
    }
  };

  // Clear form
  const clearForm = () => {
    setTransactionForm({
      transactionNo: `TRX${String(transactionCounter).padStart(3, '0')}`,
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

  // Load data
  const loadData = () => {
    // This would typically fetch from API
    alert('Data loaded based on current filters');
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
  const exportToExcel = () => {
    const csvContent = [
      'Transaction No,Date,Time,Type,Income,Expense,Category,Account,Remark',
      ...filteredTransactions.map(t => 
        `${t.transactionNo},${t.date},${t.time},${t.amountType},${t.amountType === 'INCOME' ? t.amount : ''},${t.amountType === 'EXPENSE' ? t.amount : ''},${t.category},${t.account},${t.remark}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accounting-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    window.print();
  };

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
            <Card className="shadow-sm border-gray-200 bg-gray-100">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Row 1 */}
                  <div>
                    <Label htmlFor="transactionNo" className="text-sm font-medium text-gray-700">Transaction Number</Label>
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
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      className="bg-white border-gray-300 mt-1 font-bold text-black text-lg placeholder:text-gray-600"
                      placeholder="0.00"
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
                        <option key={category.id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Row 3 */}
                  <div className="md:col-span-2">
                    <Label htmlFor="account" className="text-sm font-medium text-gray-700">Account</Label>
                    <Input
                      id="account"
                      value={transactionForm.account}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, account: e.target.value }))}
                      className="bg-white border-gray-300 mt-1 text-black placeholder:text-gray-600"
                      placeholder="Enter account"
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
              </CardContent>
            </Card>

            {/* Action Bar */}
            <Card className="shadow-sm border-gray-200 bg-gray-100">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex-1 max-w-md">
                    <Input
                      placeholder="Search by account, category, remark..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-white border-gray-300 text-black placeholder:text-gray-600"
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={loadData}
                        className="bg-gray-600 hover:bg-gray-700 text-white"
                      >
                        Load
                      </Button>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={byDate}
                          onChange={(e) => setByDate(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        By Date
                      </label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={clearForm}
                        className="bg-gray-500 hover:bg-gray-600 text-white"
                      >
                        Clear
                      </Button>
                      <Button
                        onClick={() => selectedTransaction ? deleteTransaction(selectedTransaction.id) : null}
                        disabled={!selectedTransaction}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete
                      </Button>
                      <Button
                        onClick={saveTransaction}
                        className={selectedTransaction ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
                      >
                        {selectedTransaction ? 'Update' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Date Range Filter */}
                {byDate && (
                  <div className="mt-4 flex flex-col sm:flex-row gap-4">
                    <div>
                      <Label htmlFor="fromDate" className="text-sm font-medium text-gray-700">From Date</Label>
                      <Input
                        id="fromDate"
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="bg-white border-gray-300 text-black placeholder:text-gray-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="toDate" className="text-sm font-medium text-gray-700">To Date</Label>
                      <Input
                        id="toDate"
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="bg-white border-gray-300 text-black placeholder:text-gray-600"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Data Table */}
            <Card className="shadow-sm border-gray-200 bg-gray-100">
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-blue-900 text-white">
                        <th className="px-4 py-3 text-left text-sm font-bold">Transaction No</th>
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
                          onClick={() => updateTransaction(transaction)}
                          className={`border-b cursor-pointer transition-colors ${
                            selectedTransaction?.id === transaction.id
                              ? 'bg-blue-100'
                              : index % 2 === 0
                                ? 'bg-white hover:bg-gray-50'
                                : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">{transaction.transactionNo}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{transaction.date}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{transaction.time}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              transaction.amountType === 'INCOME' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.amountType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-green-600 font-bold">
                            {transaction.amountType === 'INCOME' ? formatCurrency(transaction.amount) : ''}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-red-600 font-bold">
                            {transaction.amountType === 'EXPENSE' ? formatCurrency(transaction.amount) : ''}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{transaction.category}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{transaction.account}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{transaction.remark}</td>
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
            <Card className="shadow-sm border-gray-200 bg-gray-100">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Category Management</CardTitle>
                <CardDescription>Manage income and expense categories</CardDescription>
              </CardHeader>
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

            <Card className="shadow-sm border-gray-200 bg-gray-100">
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

        {/* TAB 3: REPORTS */}
        {activeTab === 'reports' && (
          <>
            <Card className="shadow-sm border-gray-200 bg-gray-100">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Reports</CardTitle>
                <CardDescription>Generate accounting reports</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reportType" className="text-sm font-medium text-gray-700">Report Type</Label>
                    <select
                      id="reportType"
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value as 'transaction' | 'refund' | 'customer')}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="transaction">Transaction Report</option>
                      <option value="refund">Transaction Refund Report</option>
                      <option value="customer">Customer Report</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="reportFromDate" className="text-sm font-medium text-gray-700">From Date</Label>
                    <Input
                      id="reportFromDate"
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="bg-white border-gray-300 text-black placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reportToDate" className="text-sm font-medium text-gray-700">To Date</Label>
                    <Input
                      id="reportToDate"
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="bg-white border-gray-300 text-black placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reportCategory" className="text-sm font-medium text-gray-700">Category</Label>
                    <select
                      id="reportCategory"
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Button
                    onClick={() => alert('Generating report...')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Generate Report
                  </Button>
                  <Button
                    onClick={exportToExcel}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Export Excel
                  </Button>
                  <Button
                    onClick={exportToPDF}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Export PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200 bg-gray-100">
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-blue-900 text-white">
                        <th className="px-4 py-3 text-left text-sm font-bold">Transaction No</th>
                        <th className="px-4 py-3 text-left text-sm font-bold">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-bold">Account</th>
                        <th className="px-4 py-3 text-right text-sm font-bold">Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-bold">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.slice(0, 10).map((transaction, index) => (
                        <tr
                          key={transaction.id}
                          className={`border-b transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">{transaction.transactionNo}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{transaction.date}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{transaction.account}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              transaction.amountType === 'INCOME' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.amountType}
                            </span>
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
