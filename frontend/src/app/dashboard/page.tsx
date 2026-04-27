'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Clock, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';

// Mock Data Interfaces
interface Transaction {
  id: string;
  date: string;
  time: string;
  type: 'INWARD' | 'OUTWARD';
  amount: number;
  commission: number;
  center: string;
  status: 'pending' | 'completed' | 'failed';
  partyName: string;
  cityName: string;
}

interface AccountingEntry {
  id: string;
  date: string;
  amountType: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  account: string;
  remark: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
}

// Mock Data Store
const mockTransactions: Transaction[] = [
  { id: '1', date: '2025-01-27', time: '09:15', type: 'INWARD', amount: 5000, commission: 50, center: 'MUMBAI', status: 'completed', partyName: 'Raj Kumar', cityName: 'Mumbai' },
  { id: '2', date: '2025-01-27', time: '10:30', type: 'OUTWARD', amount: 3000, commission: 30, center: 'DELHI', status: 'completed', partyName: 'Amit Singh', cityName: 'Delhi' },
  { id: '3', date: '2025-01-27', time: '11:45', type: 'INWARD', amount: 7500, commission: 75, center: 'PUNE', status: 'pending', partyName: 'Priya Sharma', cityName: 'Pune' },
  { id: '4', date: '2025-01-27', time: '13:00', type: 'OUTWARD', amount: 2000, commission: 20, center: 'BANGALORE', status: 'completed', partyName: 'Vijay Kumar', cityName: 'Bangalore' },
  { id: '5', date: '2025-01-27', time: '14:15', type: 'INWARD', amount: 4500, commission: 45, center: 'CHENNAI', status: 'pending', partyName: 'Neha Gupta', cityName: 'Chennai' },
  { id: '6', date: '2025-01-27', time: '15:30', type: 'OUTWARD', amount: 6000, commission: 60, center: 'KOLKATA', status: 'completed', partyName: 'Sanjay Patel', cityName: 'Kolkata' },
  { id: '7', date: '2025-01-27', time: '16:45', type: 'INWARD', amount: 8000, commission: 80, center: 'HYDERABAD', status: 'completed', partyName: 'Anita Reddy', cityName: 'Hyderabad' },
  { id: '8', date: '2025-01-27', time: '17:00', type: 'OUTWARD', amount: 3500, commission: 35, center: 'AHMEDABAD', status: 'pending', partyName: 'Rahul Shah', cityName: 'Ahmedabad' },
];

const mockAccountingEntries: AccountingEntry[] = [
  { id: '1', date: '2025-01-27', amountType: 'INCOME', amount: 12000, category: 'Sales Revenue', account: 'Cash Account', remark: 'Daily sales' },
  { id: '2', date: '2025-01-27', amountType: 'EXPENSE', amount: 3000, category: 'Office Supplies', account: 'Bank Account', remark: 'Stationery purchase' },
  { id: '3', date: '2025-01-27', amountType: 'INCOME', amount: 8000, category: 'Service Income', account: 'Cash Account', remark: 'Consulting fees' },
  { id: '4', date: '2025-01-27', amountType: 'EXPENSE', amount: 2500, category: 'Utilities', account: 'Bank Account', remark: 'Electricity bill' },
  { id: '5', date: '2025-01-27', amountType: 'EXPENSE', amount: 1500, category: 'Transportation', account: 'Cash Account', remark: 'Fuel expenses' },
];

const mockUsers: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@company.com', role: 'admin', status: 'active' },
  { id: '2', name: 'John Doe', email: 'john@company.com', role: 'operator', status: 'active' },
  { id: '3', name: 'Jane Smith', email: 'jane@company.com', role: 'operator', status: 'active' },
  { id: '4', name: 'Bob Wilson', email: 'bob@company.com', role: 'manager', status: 'inactive' },
  { id: '5', name: 'Alice Brown', email: 'alice@company.com', role: 'operator', status: 'active' },
];

const mockCategories: Category[] = [
  { id: '1', name: 'Sales Revenue', type: 'INCOME' },
  { id: '2', name: 'Service Income', type: 'INCOME' },
  { id: '3', name: 'Office Supplies', type: 'EXPENSE' },
  { id: '4', name: 'Utilities', type: 'EXPENSE' },
  { id: '5', name: 'Transportation', type: 'EXPENSE' },
];

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickForm, setQuickForm] = useState({
    amount: '',
    type: 'INWARD' as 'INWARD' | 'OUTWARD',
    center: ''
  });
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [accountingEntries] = useState<AccountingEntry[]>(mockAccountingEntries);
  const [users] = useState<User[]>(mockUsers);
  const [categories] = useState<Category[]>(mockCategories);

  // Handle events from layout-wrapper
  useEffect(() => {
    const handleDateChange = (e: CustomEvent) => {
      setSelectedDate(e.detail);
    };

    const handleRefresh = () => {
      // Refresh logic here - for now just re-render
      setTransactions([...mockTransactions]);
    };

    window.addEventListener('setDashboardDate', handleDateChange as EventListener);
    window.addEventListener('refreshDashboard', handleRefresh as EventListener);
    
    return () => {
      window.removeEventListener('setDashboardDate', handleDateChange as EventListener);
      window.removeEventListener('refreshDashboard', handleRefresh as EventListener);
    };
  }, []);

  // Calculate KPIs
  const todayTransactions = transactions.filter(t => t.date === selectedDate);
  const outwardBooking = todayTransactions.filter(t => t.type === 'OUTWARD').reduce((sum, t) => sum + t.amount, 0);
  const inwardBooking = todayTransactions.filter(t => t.type === 'INWARD').reduce((sum, t) => sum + t.amount, 0);
  const centerCommission = todayTransactions.reduce((sum, t) => sum + t.commission, 0);
  const totalUsers = users.filter(u => u.status === 'active').length;
  const pendingBooking = todayTransactions.filter(t => t.status === 'pending').length;
  const totalTransactionsToday = todayTransactions.length;

  // Today's accounting data
  const todayIncome = accountingEntries
    .filter(e => e.date === selectedDate && e.amountType === 'INCOME')
    .reduce((sum, e) => sum + e.amount, 0);
  const todayExpense = accountingEntries
    .filter(e => e.date === selectedDate && e.amountType === 'EXPENSE')
    .reduce((sum, e) => sum + e.amount, 0);
  const netBalance = todayIncome - todayExpense;

  // Chart data preparation
  const hourlyData = Array.from({ length: 8 }, (_, i) => {
    const hour = 9 + i;
    const hourTransactions = todayTransactions.filter(t => {
      const transactionHour = parseInt(t.time.split(':')[0]);
      return transactionHour === hour;
    });
    
    return {
      hour: `${hour}:00`,
      outward: hourTransactions.filter(t => t.type === 'OUTWARD').reduce((sum, t) => sum + t.amount, 0),
      inward: hourTransactions.filter(t => t.type === 'INWARD').reduce((sum, t) => sum + t.amount, 0),
    };
  });

  const incomeExpenseData = [
    { name: 'Income', value: todayIncome, color: '#10b981' },
    { name: 'Expense', value: todayExpense, color: '#ef4444' },
  ];

  const categoryData = categories.map(cat => {
    const categoryTotal = accountingEntries
      .filter(e => e.category === cat.name && e.date === selectedDate)
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      name: cat.name,
      value: categoryTotal,
      color: cat.type === 'INCOME' ? '#10b981' : '#ef4444'
    };
  }).filter(cat => cat.value > 0);

  const recentTransactions = transactions.slice(0, 10);

  // Format utilities
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Quick transaction handler
  const handleQuickTransaction = () => {
    if (quickForm.amount && quickForm.center) {
      const newTransaction: Transaction = {
        id: String(transactions.length + 1),
        date: selectedDate,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        type: quickForm.type,
        amount: parseFloat(quickForm.amount),
        commission: parseFloat(quickForm.amount) * 0.01, // 1% commission
        center: quickForm.center.toUpperCase(),
        status: 'pending',
        partyName: 'Quick Entry',
        cityName: quickForm.center
      };
      
      setTransactions([newTransaction, ...transactions]);
      setQuickForm({ amount: '', type: 'INWARD', center: '' });
    }
  };

  // Navigation handlers
  const navigateToPage = (page: string) => {
    window.location.href = `/${page}`;
  };

  return (
    <div className="bg-white min-h-screen w-full">
      <div className="pt-16 space-y-4 sm:space-y-6 p-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="shadow-sm border-gray-200 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Outward Booking</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(outwardBooking)}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Inward Booking</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(inwardBooking)}</p>
                </div>
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Center Commission</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(centerCommission)}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{totalUsers}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Booking</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{pendingBooking}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-600 mt-1">{totalTransactionsToday}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <Activity className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-sm border-gray-200 bg-white lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Transactions Overview</CardTitle>
              <CardDescription>Hourly transaction amounts</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 12 }} stroke="#666" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#666" />
                  <Tooltip />
                  <Line type="monotone" dataKey="outward" stroke="#3b82f6" strokeWidth={2} name="Outward" />
                  <Line type="monotone" dataKey="inward" stroke="#6366f1" strokeWidth={2} name="Inward" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200 bg-white lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Income vs Expense</CardTitle>
              <CardDescription>Today's financial overview</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={incomeExpenseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#666" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#666" />
                  <Tooltip />
                  {incomeExpenseData.map((entry, index) => (
                    <Bar key={`bar-${index}`} dataKey="value" fill={entry.color} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200 bg-white lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Category Distribution</CardTitle>
              <CardDescription>Spending by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-sm border-gray-200 bg-white lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Transactions</CardTitle>
              <CardDescription>Last 10 transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">ID</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Date</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Time</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Type</th>
                      <th className="text-right py-2 px-2 text-sm font-medium text-gray-700">Amount</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Center</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((transaction) => (
                      <tr 
                        key={transaction.id} 
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigateToPage('transactions')}
                      >
                        <td className="py-2 px-2 text-sm text-gray-900">{transaction.id}</td>
                        <td className="py-2 px-2 text-sm text-gray-900">{formatDate(transaction.date)}</td>
                        <td className="py-2 px-2 text-sm text-gray-900">{transaction.time}</td>
                        <td className="py-2 px-2 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            transaction.type === 'INWARD' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-sm text-right font-medium text-gray-900">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="py-2 px-2 text-sm text-gray-900">{transaction.center}</td>
                        <td className="py-2 px-2 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            transaction.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Quick Action Form */}
            <Card className="shadow-sm border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Quick Transaction</CardTitle>
                <CardDescription>Add transaction instantly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="quickAmount" className="text-sm font-medium text-gray-700">Amount</Label>
                  <Input
                    id="quickAmount"
                    type="number"
                    value={quickForm.amount}
                    onChange={(e) => setQuickForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="mt-1 bg-white border-gray-300 text-black font-bold text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-600"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <Label htmlFor="quickType" className="text-sm font-medium text-gray-700">Type</Label>
                  <select
                    id="quickType"
                    value={quickForm.type}
                    onChange={(e) => setQuickForm(prev => ({ ...prev, type: e.target.value as 'INWARD' | 'OUTWARD' }))}
                    className="w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="INWARD">Inward</option>
                    <option value="OUTWARD">Outward</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="quickCenter" className="text-sm font-medium text-gray-700">Center</Label>
                  <Input
                    id="quickCenter"
                    value={quickForm.center}
                    onChange={(e) => setQuickForm(prev => ({ ...prev, center: e.target.value }))}
                    className="mt-1 bg-white border-gray-300 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-600"
                    placeholder="Enter center"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Accounting Snapshot */}
            <Card className="shadow-sm border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Accounting Snapshot</CardTitle>
                <CardDescription>Today's financial summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Today Income</span>
                  <span className="text-sm font-semibold text-green-600">{formatCurrency(todayIncome)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Today Expense</span>
                  <span className="text-sm font-semibold text-red-600">{formatCurrency(todayExpense)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Net Balance</span>
                    <span className={`text-sm font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(netBalance)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Navigation */}
            <Card className="shadow-sm border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Quick Navigation</CardTitle>
                <CardDescription>Jump to any module</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full border-gray-300 text-gray-50 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400"
                  onClick={() => navigateToPage('transactions')}
                >
                  Go to Transactions
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-300 text-gray-50 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400"
                  onClick={() => navigateToPage('accounting')}
                >
                  Go to Accounting
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-300 text-gray-50 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400"
                  onClick={() => navigateToPage('reports')}
                >
                  Go to Reports
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-300 text-gray-50 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400"
                  onClick={() => navigateToPage('balance-sheet')}
                >
                  Go to Balance Sheet
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
