'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { fetchAllModuleHistoryData } from '@/lib/fetch-all-history';
import { transactionApi } from '@/lib/transactions';
import { calculateClientBalance } from '@/lib/client-balance';

// Balance Sheet Entry Structure
interface BalanceSheetEntry {
  accountName: string;
  amount: number;
}

interface BalanceSheetData {
  incomeEntries: BalanceSheetEntry[];
  expenseEntries: BalanceSheetEntry[];
}

interface SortConfig {
  key: 'accountName' | 'amount';
  direction: 'asc' | 'desc';
}

export default function BalanceSheetPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetData>({
    incomeEntries: [],
    expenseEntries: []
  });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Cache for all module data to avoid repeated API calls
  const [cachedData, setCachedData] = useState<{
    transactions: any[];
    accounting: any[];
    hawala: any[];
    specialEntry: any[];
  }>({
    transactions: [],
    accounting: [],
    hawala: [],
    specialEntry: []
  });

  // Fetch all module data (paginated under the hood — no record cap)
  const fetchAllModuleData = async () => {
    try {
      const moduleData = await fetchAllModuleHistoryData();

      setCachedData(moduleData);
      return moduleData;
    } catch (error) {
      console.error('Error fetching module data:', error);
      return {
        transactions: [],
        accounting: [],
        hawala: [],
        specialEntry: []
      };
    }
  };

  // Fetch balance sheet data from clients
  const fetchBalanceSheet = async () => {
    setLoading(true);
    try {
      // First, fetch all module data once (5 API calls total)
      const moduleData = await fetchAllModuleData();

      // Then get clients and calculate balances using fetched data
      const allClients = await transactionApi.getClients();
      const incomeEntries: BalanceSheetEntry[] = [];
      const expenseEntries: BalanceSheetEntry[] = [];

      for (const client of allClients) {
        const balanceData = calculateClientBalance(client, moduleData);
        const balance = balanceData.balance;

        if (balance < 0) {
          // Negative balance = money to collect = income side
          incomeEntries.push({
            accountName: client.name,
            amount: Math.abs(balance)
          });
        } else if (balance > 0) {
          // Positive balance = money to pay = expense side
          expenseEntries.push({
            accountName: client.name,
            amount: balance
          });
        }
        // Zero balance clients are not shown (as per customer report behavior)
      }

      console.log('Balance sheet calculated:', {
        incomeCount: incomeEntries.length,
        expenseCount: expenseEntries.length,
        totalClients: allClients.length
      });

      setBalanceSheetData({
        incomeEntries,
        expenseEntries
      });
    } catch (error) {
      console.error('Failed to fetch balance sheet data:', error);
      setBalanceSheetData({
        incomeEntries: [],
        expenseEntries: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const totalIncome = balanceSheetData.incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const totalExpense = balanceSheetData.expenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const netPayable = totalExpense - totalIncome;

    return {
      totalIncome,
      totalExpense,
      netPayable
    };
  };

  // Sorting functionality
  const handleSort = (key: 'accountName' | 'amount') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort entries
  const sortEntries = (entries: BalanceSheetEntry[]) => {
    if (!sortConfig) return entries;

    return [...entries].sort((a, b) => {
      const aValue = sortConfig.key === 'accountName' ? a.accountName : a.amount;
      const bValue = sortConfig.key === 'accountName' ? b.accountName : b.amount;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const escapeCSV = (value: string | number) => {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const buildExportRows = useCallback(() => {
    const sortedIncome = sortEntries(balanceSheetData.incomeEntries);
    const sortedExpense = sortEntries(balanceSheetData.expenseEntries);
    const totals = {
      totalIncome: balanceSheetData.incomeEntries.reduce((sum, entry) => sum + entry.amount, 0),
      totalExpense: balanceSheetData.expenseEntries.reduce((sum, entry) => sum + entry.amount, 0),
      netPayable: 0 as number,
    };
    totals.netPayable = totals.totalExpense - totals.totalIncome;

    return {
      sortedIncome,
      sortedExpense,
      totals,
      maxRows: Math.max(sortedIncome.length, sortedExpense.length),
    };
  }, [balanceSheetData, sortConfig]); // sortEntries uses sortConfig

  const generatePDF = useCallback((exportRows: ReturnType<typeof buildExportRows>) => {
    const { sortedIncome, sortedExpense, totals, maxRows } = exportRows;
    const generatedOn = formatDate(new Date());

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Final Balance Sheet</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
          .header p { margin: 5px 0 0 0; color: #666; font-size: 14px; }
          .summary { display: flex; justify-content: center; margin-bottom: 30px; padding: 20px; background-color: #fff7ed; border-radius: 8px; border: 1px solid #fdba74; }
          .summary-item { text-align: center; }
          .summary-label { font-size: 14px; color: #666; margin-bottom: 5px; }
          .summary-value { font-size: 28px; font-weight: bold; }
          .net { color: #ea580c; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .table th { background-color: #1e40af; color: white; padding: 12px; text-align: left; font-weight: bold; }
          .table td { padding: 10px; border-bottom: 1px solid #ddd; }
          .table tr:nth-child(even) { background-color: #f9fafb; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .totals { background-color: #f3f4f6; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FINAL BALANCE SHEET</h1>
          <p>Generated from Accounting System on ${generatedOn}</p>
        </div>

        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Net Payable</div>
            <div class="summary-value net">${formatCurrency(totals.netPayable)}</div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th class="text-left" style="width: 40%">Income Side (To Collect)</th>
              <th class="text-right" style="width: 10%">Amount</th>
              <th class="text-left" style="width: 40%">Expense Side (To Pay)</th>
              <th class="text-right" style="width: 10%">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: maxRows }).map((_, i) => {
              const income = sortedIncome[i] || { accountName: '', amount: 0 };
              const expense = sortedExpense[i] || { accountName: '', amount: 0 };
              return `
                <tr>
                  <td class="text-left">${escapeHtml(income.accountName)}</td>
                  <td class="text-right">${income.amount > 0 ? formatCurrency(income.amount) : ''}</td>
                  <td class="text-left">${escapeHtml(expense.accountName)}</td>
                  <td class="text-right">${expense.amount > 0 ? formatCurrency(expense.amount) : ''}</td>
                </tr>
              `;
            }).join('')}
            <tr class="totals">
              <td class="text-left" colspan="3">Net Payable</td>
              <td class="text-right">${formatCurrency(totals.netPayable)}</td>
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
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      alert('Please allow popups to generate PDF');
    }
  }, []);

  // Export functionality
  const exportBalanceSheet = useCallback((format: 'excel' | 'pdf') => {
    setExporting(true);

    try {
      const exportRows = buildExportRows();
      const { sortedIncome, sortedExpense, totals, maxRows } = exportRows;

      if (format === 'excel') {
        const headerRow = [
          'Income Side (To Collect)',
          'Amount',
          'Expense Side (To Pay)',
          'Amount',
        ].map(escapeCSV).join(',');

        const dataRows = Array.from({ length: maxRows }).map((_, i) => {
          const income = sortedIncome[i] || { accountName: '', amount: 0 };
          const expense = sortedExpense[i] || { accountName: '', amount: 0 };
          return [
            income.accountName,
            income.amount > 0 ? formatCurrency(income.amount) : '',
            expense.accountName,
            expense.amount > 0 ? formatCurrency(expense.amount) : '',
          ].map(escapeCSV).join(',');
        });

        const csvContent = [
          'Final Balance Sheet',
          `Generated on,${escapeCSV(formatDate(new Date()))}`,
          `Net Payable,,,${escapeCSV(formatCurrency(totals.netPayable))}`,
          '',
          headerRow,
          ...dataRows,
          '',
          ['Net Payable', '', '', formatCurrency(totals.netPayable)].map(escapeCSV).join(','),
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `final-balance-sheet-${formatDate(new Date()).replace(/\//g, '-')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        generatePDF(exportRows);
      }
    } catch (error) {
      console.error('Balance sheet export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [buildExportRows, generatePDF]);

  // Listen for tab changes from header
  useEffect(() => {
    const handleTabChange = (e: CustomEvent) => {
      // Handle balance sheet tab changes if needed
    };

    const handleExport = (e: CustomEvent) => {
      const format = e.detail as 'excel' | 'pdf';
      exportBalanceSheet(format);
    };

    window.addEventListener('setBalanceSheetTab', handleTabChange as EventListener);
    window.addEventListener('exportBalanceSheet', handleExport as EventListener);
    return () => {
      window.removeEventListener('setBalanceSheetTab', handleTabChange as EventListener);
      window.removeEventListener('exportBalanceSheet', handleExport as EventListener);
    };
  }, [exportBalanceSheet]);

  // Auto-load data on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchBalanceSheet();
  }, [isAuthenticated, router]);

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

  const totals = calculateTotals();
  const sortedIncome = sortEntries(balanceSheetData.incomeEntries);
  const sortedExpense = sortEntries(balanceSheetData.expenseEntries);
  const maxRows = Math.max(sortedIncome.length, sortedExpense.length);

  return (
    <div className="bg-white min-h-screen w-full">
      <div className="pt-16 space-y-4 sm:space-y-6">

        {/* Summary Card - Net Payable Only */}
        <div className="flex justify-center mt-4">
          <div className={`px-8 py-4 rounded-2xl font-bold text-3xl shadow-md border-2 backdrop-blur-md ${
            totals.netPayable > 0
              ? 'bg-gradient-to-r from-green-400/80 to-green-600/80 border-green-700 text-white'
              : totals.netPayable < 0
                ? 'bg-gradient-to-r from-red-400/80 to-red-600/80 border-red-700 text-white'
                : 'bg-gradient-to-r from-gray-400/80 to-gray-600/80 border-gray-700 text-white'
          }`}>
            Net Payable: {formatCurrency(totals.netPayable)}
          </div>
        </div>

        {/* Balance Sheet Table */}
        <Card className="shadow-lg border-orange-200/40 bg-gradient-to-br from-white via-orange-50/95 to-orange-100/80 backdrop-blur-md relative z-10">
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                {/* Table Header */}
                <thead>
                  <tr className="bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 text-white">
                    <th
                      className="px-4 py-3 text-left font-semibold text-sm cursor-pointer hover:bg-orange-900/50"
                      onClick={() => handleSort('accountName')}
                    >
                      Income Side (To Collect)
                      {sortConfig?.key === 'accountName' && (
                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th
                      className="px-4 py-3 text-right font-semibold text-sm cursor-pointer hover:bg-orange-900/50"
                      onClick={() => handleSort('amount')}
                    >
                      Amount
                      {sortConfig?.key === 'amount' && (
                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th
                      className="px-4 py-3 text-left font-semibold text-sm cursor-pointer hover:bg-orange-900/50"
                      onClick={() => handleSort('accountName')}
                    >
                      Expense Side (To Pay)
                      {sortConfig?.key === 'accountName' && (
                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th
                      className="px-4 py-3 text-right font-semibold text-sm cursor-pointer hover:bg-orange-900/50"
                      onClick={() => handleSort('amount')}
                    >
                      Amount
                      {sortConfig?.key === 'amount' && (
                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody>
                  {Array.from({ length: maxRows }).map((_, index) => {
                    const income = sortedIncome[index] || { accountName: '', amount: 0 };
                    const expense = sortedExpense[index] || { accountName: '', amount: 0 };
                    return (
                      <tr
                        key={index}
                        className={`border-b transition-colors ${
                          index % 2 === 0 ? 'bg-white/90 hover:bg-orange-50/70' : 'bg-orange-50/45 hover:bg-orange-100/55'
                        }`}
                      >
                        <td className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          {income.accountName}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          {income.amount > 0 ? formatCurrency(income.amount) : ''}
                        </td>
                        <td className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          {expense.accountName}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          {expense.amount > 0 ? formatCurrency(expense.amount) : ''}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Totals Row */}
                  <tr className="bg-orange-100/70 border-t-2 border-orange-300">
                    <td className="px-4 py-3 text-left text-sm font-bold text-gray-900">
                      TOTALS
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                      {formatCurrency(totals.totalIncome)}
                    </td>
                    <td className="px-4 py-3 text-left text-sm font-bold text-gray-900">
                      TOTALS
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                      {formatCurrency(totals.totalExpense)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
