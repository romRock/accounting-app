'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store';
import { formatCurrency, formatDate } from '@/lib/utils';

// Final Balance Sheet Data Structure (Ledger Style)
interface AccountData {
  id: string;
  accountName: string;
  totalIncome: number;
  totalExpense: number;
  totalPayable: number; // Calculated: income - expense
}

interface SortConfig {
  key: keyof AccountData;
  direction: 'asc' | 'desc';
}

export default function BalanceSheetPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Generate mock account data for ledger-style balance sheet
  const generateAccountData = (): AccountData[] => {
    return [
      { id: '1', accountName: 'ABC', totalIncome: 150000, totalExpense: 120000, totalPayable: 30000 },
      { id: '2', accountName: 'ADVANCE LBL', totalIncome: 85000, totalExpense: 92000, totalPayable: -7000 },
      { id: '3', accountName: 'ALPHA', totalIncome: 200000, totalExpense: 180000, totalPayable: 20000 },
      { id: '4', accountName: 'BETA', totalIncome: 120000, totalExpense: 145000, totalPayable: -25000 },
      { id: '5', accountName: 'GAMMA', totalIncome: 300000, totalExpense: 280000, totalPayable: 20000 },
      { id: '6', accountName: 'DELTA', totalIncome: 95000, totalExpense: 95000, totalPayable: 0 },
      { id: '7', accountName: 'EPSILON', totalIncome: 180000, totalExpense: 160000, totalPayable: 20000 },
      { id: '8', accountName: 'ZETA', totalIncome: 75000, totalExpense: 82000, totalPayable: -7000 },
      { id: '9', accountName: 'ETA', totalIncome: 220000, totalExpense: 195000, totalPayable: 25000 },
      { id: '10', accountName: 'THETA', totalIncome: 130000, totalExpense: 135000, totalPayable: -5000 },
      { id: '11', accountName: 'IOTA', totalIncome: 165000, totalExpense: 155000, totalPayable: 10000 },
      { id: '12', accountName: 'KAPPA', totalIncome: 110000, totalExpense: 118000, totalPayable: -8000 },
      { id: '13', accountName: 'LAMBDA', totalIncome: 280000, totalExpense: 260000, totalPayable: 20000 },
      { id: '14', accountName: 'MU', totalIncome: 92000, totalExpense: 98000, totalPayable: -6000 },
      { id: '15', accountName: 'NU', totalIncome: 175000, totalExpense: 170000, totalPayable: 5000 },
    ];
  };

  // Calculate totals for ledger-style balance sheet
  const calculateTotals = (data: AccountData[]) => {
    const totalIncome = data.reduce((sum, account) => sum + account.totalIncome, 0);
    const totalExpense = data.reduce((sum, account) => sum + account.totalExpense, 0);
    const totalPayable = totalIncome - totalExpense;
    
    return {
      totalIncome,
      totalExpense,
      totalPayable
    };
  };

  // Sorting functionality
  const handleSort = (key: keyof AccountData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filteredAccounts = accounts.filter(account =>
      account.accountName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig !== null) {
      filteredAccounts.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredAccounts;
  }, [accounts, searchTerm, sortConfig]);

  // Fetch balance sheet data
  const fetchBalanceSheet = () => {
    setLoading(true);
    setTimeout(() => {
      const data = generateAccountData();
      setAccounts(data);
      setLoading(false);
    }, 500);
  };

  // Export functionality
  const exportBalanceSheet = (format: 'excel' | 'pdf') => {
    setExporting(true);
    const totals = calculateTotals(accounts);
    
    setTimeout(() => {
      if (format === 'excel') {
        // Create CSV for Excel export
        const csvContent = [
          `Final Balance Sheet From ${fromDate} To ${toDate}`,
          '',
          'Accounts,Income,Expense,Total Payable',
          ...filteredAndSortedData.map(account => 
            `${account.accountName},${account.totalIncome},${account.totalExpense},${account.totalPayable}`
          ),
          '',
          `TOTALS,${totals.totalIncome},${totals.totalExpense},${totals.totalPayable}`
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `final-balance-sheet-${fromDate}-to-${toDate}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Generate PDF using print window
        generatePDF();
      }
      setExporting(false);
    }, 500);
  };

  // Generate PDF using print window
  const generatePDF = () => {
    const totals = calculateTotals(accounts);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Final Balance Sheet From ${fromDate} To ${toDate}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
          .header p { margin: 5px 0 0 0; color: #666; font-size: 14px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .table th { background-color: #1e40af; color: white; padding: 12px; text-align: left; font-weight: bold; }
          .table td { padding: 10px; border-bottom: 1px solid #ddd; }
          .table tr:nth-child(even) { background-color: #f9fafb; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .positive { color: #059669; font-weight: bold; }
          .negative { color: #dc2626; font-weight: bold; }
          .neutral { color: #333; font-weight: bold; }
          .totals { background-color: #f3f4f6; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FINAL BALANCE SHEET</h1>
          <p>From ${fromDate} To ${toDate}</p>
          <p>Generated from Accounting System</p>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th class="text-left">Accounts</th>
              <th class="text-right">Income</th>
              <th class="text-right">Expense</th>
              <th class="text-right">Total Payable</th>
            </tr>
          </thead>
          <tbody>
            ${filteredAndSortedData.map(account => `
              <tr>
                <td class="text-left">${account.accountName}</td>
                <td class="text-right">${formatCurrency(account.totalIncome)}</td>
                <td class="text-right">${formatCurrency(account.totalExpense)}</td>
                <td class="text-right ${account.totalPayable > 0 ? 'positive' : account.totalPayable < 0 ? 'negative' : 'neutral'}">
                  ${formatCurrency(account.totalPayable)}
                </td>
              </tr>
            `).join('')}
            <tr class="totals">
              <td class="text-left">TOTALS</td>
              <td class="text-right">${formatCurrency(totals.totalIncome)}</td>
              <td class="text-right">${formatCurrency(totals.totalExpense)}</td>
              <td class="text-right ${totals.totalPayable > 0 ? 'positive' : totals.totalPayable < 0 ? 'negative' : 'neutral'}">
                ${formatCurrency(totals.totalPayable)}
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
    }
  };

  // Listen for tab changes from header
  useEffect(() => {
    const handleTabChange = (e: CustomEvent) => {
      // Handle balance sheet tab changes if needed
    };

    window.addEventListener('setBalanceSheetTab', handleTabChange as EventListener);
    return () => window.removeEventListener('setBalanceSheetTab', handleTabChange as EventListener);
  }, []);

  // Auto-load data on component mount and date change
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchBalanceSheet();
  }, [isAuthenticated, router, fromDate, toDate]);

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading balance sheet...</p>
        </div>
      </div>
    );
  }

  const totals = calculateTotals(accounts);

  return (
    <div className="bg-white min-h-screen w-full">
      <div className="pt-16 space-y-4 sm:space-y-6">
        
        {/* Date Range and Export Section */}
        <Card className="shadow-sm border-gray-200 bg-gray-100">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div>
                  <Label htmlFor="fromDate" className="text-sm font-medium text-gray-700">From Date</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1 w-40 sm:w-auto"
                  />
                </div>
                <div>
                  <Label htmlFor="toDate" className="text-sm font-medium text-gray-700">To Date</Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1 w-40 sm:w-auto"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => exportBalanceSheet('excel')}
                  disabled={exporting || accounts.length === 0}
                  className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400 shadow-sm text-sm"
                >
                  {exporting ? 'Exporting...' : 'Export Excel'}
                </Button>
                <Button
                  onClick={() => exportBalanceSheet('pdf')}
                  disabled={exporting || accounts.length === 0}
                  className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400 shadow-sm text-sm"
                >
                  {exporting ? 'Exporting...' : 'Export PDF'}
                </Button>
                <Button
                  onClick={() => window.print()}
                  disabled={accounts.length === 0}
                  className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400 shadow-sm text-sm"
                >
                  Print
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter Section */}
        <Card className="shadow-sm border-gray-200 bg-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 max-w-md">
                <Label htmlFor="search" className="text-sm font-medium text-gray-700">Search Accounts</Label>
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by account name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Sheet Table */}
        <Card className="shadow-sm border-gray-200 bg-gray-100">
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                {/* Table Header */}
                <thead>
                  <tr className="bg-blue-900 text-white">
                    <th 
                      className="px-4 py-3 text-left font-semibold text-sm cursor-pointer hover:bg-blue-800"
                      onClick={() => handleSort('accountName')}
                    >
                      Accounts
                      {sortConfig?.key === 'accountName' && (
                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="px-4 py-3 text-right font-semibold text-sm cursor-pointer hover:bg-blue-800"
                      onClick={() => handleSort('totalIncome')}
                    >
                      Income
                      {sortConfig?.key === 'totalIncome' && (
                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="px-4 py-3 text-right font-semibold text-sm cursor-pointer hover:bg-blue-800"
                      onClick={() => handleSort('totalExpense')}
                    >
                      Expense
                      {sortConfig?.key === 'totalExpense' && (
                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="px-4 py-3 text-right font-semibold text-sm cursor-pointer hover:bg-blue-800"
                      onClick={() => handleSort('totalPayable')}
                    >
                      Total Payable
                      {sortConfig?.key === 'totalPayable' && (
                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                  </tr>
                </thead>
                
                {/* Table Body */}
                <tbody>
                  {filteredAndSortedData.map((account, index) => (
                    <tr 
                      key={account.id}
                      className={`border-b hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        {account.accountName}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">
                        {formatCurrency(account.totalIncome)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">
                        {formatCurrency(account.totalExpense)}
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-bold ${
                        account.totalPayable > 0 
                          ? 'text-green-600' 
                          : account.totalPayable < 0 
                            ? 'text-red-600' 
                            : 'text-gray-900'
                      }`}>
                        {formatCurrency(account.totalPayable)}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Totals Row */}
                  <tr className="bg-gray-100 border-t-2 border-gray-300">
                    <td className="px-4 py-3 text-left text-sm font-bold text-gray-900">
                      TOTALS
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                      {formatCurrency(totals.totalIncome)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                      {formatCurrency(totals.totalExpense)}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-bold ${
                      totals.totalPayable > 0 
                        ? 'text-green-600' 
                        : totals.totalPayable < 0 
                          ? 'text-red-600' 
                          : 'text-gray-900'
                    }`}>
                      {formatCurrency(totals.totalPayable)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Summary Card */}
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600">Total Income</div>
                  <div className="text-xl font-bold text-blue-600">
                    {formatCurrency(totals.totalIncome)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Expense</div>
                  <div className="text-xl font-bold text-red-600">
                    {formatCurrency(totals.totalExpense)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Net Total Payable</div>
                  <div className={`text-xl font-bold ${
                    totals.totalPayable > 0 
                      ? 'text-green-600' 
                      : totals.totalPayable < 0 
                        ? 'text-red-600' 
                        : 'text-gray-900'
                  }`}>
                    {formatCurrency(totals.totalPayable)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
