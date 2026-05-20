'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { transactionApi } from '@/lib/transactions';
import { accountingApi } from '@/lib/accounting';
import { getHawalaEntries } from '@/lib/hawala';
import { getSpecialEntries } from '@/lib/specialEntry';

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

  // Calculate client balance from all modules (same logic as customer report)
  const calculateClientBalance = async (client: any) => {
    let totalCredit = 0;
    let totalDebit = 0;
    const clientName = client.name.toLowerCase();

    try {
      // 1. Transactions Module - reduced limit for production compatibility
      try {
        const [outwardTxns, inwardTxns] = await Promise.all([
          transactionApi.getTransactions({ type: 'OUTWARD', page: 1, limit: 100 }),
          transactionApi.getTransactions({ type: 'INWARD', page: 1, limit: 100 })
        ]);

        const allTxns = [...(outwardTxns.transactions || []), ...(inwardTxns.transactions || [])];

        allTxns.forEach((txn: any) => {
          const receiverName = txn.receiverName?.toLowerCase() || '';
          const senderName = txn.senderName?.toLowerCase() || '';

          if (receiverName === clientName || senderName === clientName) {
            if (txn.type === 'OUTWARD') {
              // OUTWARD: Check amountType to determine debit/credit
              if (txn.amountType === 'CREDIT' && senderName === clientName) {
                // CREDIT + Sender is client: Client owes us money (DEBIT)
                totalDebit += (txn.amount || 0) + (txn.commission || 0);
              } else {
                // CASH or Receiver is client: Normal outward (credit to receiver)
                totalCredit += (txn.amount || 0) + (txn.centerCommission || 0);
              }
            } else if (txn.type === 'INWARD') {
              // INWARD: Check amountType to determine debit/credit
              if (txn.amountType === 'CREDIT' && receiverName === clientName) {
                // CREDIT + Receiver is client: We receive money for client (CREDIT)
                totalCredit += (txn.amount || 0);
              } else {
                // CASH or Sender is client: Normal inward (debit to sender)
                totalDebit += (txn.amount || 0);
              }
            }
          }
        });
      } catch (error) {
        console.error(`Error fetching transactions for ${client.name}:`, error);
      }

      // 2. Accounting Module - reduced limit for production compatibility
      try {
        const accEntries = await accountingApi.getAccountEntries({ page: 1, limit: 100 });
        (accEntries.entries || []).forEach((entry: any) => {
          const partyName = entry.party?.name?.toLowerCase() || '';
          if (partyName === clientName) {
            if (entry.type === 'INCOME') {
              totalCredit += entry.creditAmount || entry.amount || 0;
            } else if (entry.type === 'EXPENSE') {
              totalDebit += entry.debitAmount || entry.amount || 0;
            }
          }
        });
      } catch (error) {
        console.error(`Error fetching accounting entries for ${client.name}:`, error);
      }

      // 3. Hawala Module - reduced limit for production compatibility
      try {
        const hawalaEntries = await getHawalaEntries({ page: 1, limit: 100 });
        (hawalaEntries.data || []).forEach((entry: any) => {
          const partyA = entry.partyA?.toLowerCase() || '';
          const partyB = entry.partyB?.toLowerCase() || '';

          if (partyA === clientName) {
            // Party A (receiver) gets credit (income)
            totalCredit += entry.amount || 0;
          }
          if (partyB === clientName) {
            // Party B (sender) gets debit (expense)
            totalDebit += entry.amount || 0;
          }
        });
      } catch (error) {
        console.error(`Error fetching hawala entries for ${client.name}:`, error);
      }

      // 4. Special Entry Module - reduced limit for production compatibility
      try {
        const splEntries = await getSpecialEntries({ page: 1, limit: 100 });
        (splEntries.data || []).forEach((entry: any) => {
          const partyA = entry.partyA?.toLowerCase() || '';
          const partyB = entry.partyB?.toLowerCase() || '';
          const partyC = entry.partyC?.toLowerCase() || '';

          if (partyA === clientName) {
            // Party A: Expense/Debit (-)
            totalDebit += entry.amountA || 0;
          }
          if (partyB === clientName) {
            // Party B: Income/Credit (+)
            totalCredit += entry.amountB || 0;
          }
          if (partyC === clientName) {
            // Party C: Dynamic based on amountC sign
            const amountC = entry.amountC || 0;
            if (amountC > 0) {
              totalCredit += amountC;
            } else {
              totalDebit += Math.abs(amountC);
            }
          }
        });
      } catch (error) {
        console.error(`Error fetching special entries for ${client.name}:`, error);
      }

    } catch (error) {
      console.error(`Error calculating balance for ${client.name}:`, error);
    }

    const balance = totalCredit - totalDebit;
    return { balance, credit: totalCredit, debit: totalDebit };
  };

  // Fetch balance sheet data from clients
  const fetchBalanceSheet = async () => {
    setLoading(true);
    try {
      const allClients = await transactionApi.getClients();
      const incomeEntries: BalanceSheetEntry[] = [];
      const expenseEntries: BalanceSheetEntry[] = [];

      for (const client of allClients) {
        const balanceData = await calculateClientBalance(client);
        const balance = balanceData.balance;

        if (balance < 0) {
          // Negative balance = money to collect = income side
          incomeEntries.push({
            accountName: client.name,
            amount: Math.abs(balance)
          });
        } else {
          // Positive or zero balance = money to pay = expense side
          expenseEntries.push({
            accountName: client.name,
            amount: balance
          });
        }
      }

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

  // Export functionality
  const exportBalanceSheet = (format: 'excel' | 'pdf') => {
    setExporting(true);
    const totals = calculateTotals();
    const sortedIncome = sortEntries(balanceSheetData.incomeEntries);
    const sortedExpense = sortEntries(balanceSheetData.expenseEntries);

    setTimeout(() => {
      if (format === 'excel') {
        // Create CSV for Excel export
        const csvContent = [
          'Final Balance Sheet',
          '',
          'Income Side (To Collect),,Expense Side (To Pay)',
          'Accounts,Amount,Accounts,Amount',
          ...Array.from({ length: Math.max(sortedIncome.length, sortedExpense.length) }).map((_, i) => {
            const income = sortedIncome[i] || { accountName: '', amount: 0 };
            const expense = sortedExpense[i] || { accountName: '', amount: 0 };
            return `${income.accountName},${income.amount},${expense.accountName},${expense.amount}`;
          }),
          '',
          `TOTALS,${totals.totalIncome},,${totals.totalExpense}`,
          `,,NET PAYABLE,,${totals.netPayable}`
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `final-balance-sheet.csv`;
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
    const totals = calculateTotals();
    const sortedIncome = sortEntries(balanceSheetData.incomeEntries);
    const sortedExpense = sortEntries(balanceSheetData.expenseEntries);

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
          .summary { display: flex; justify-content: space-around; margin-bottom: 30px; padding: 20px; background-color: #f9fafb; border-radius: 8px; }
          .summary-item { text-align: center; }
          .summary-label { font-size: 14px; color: #666; margin-bottom: 5px; }
          .summary-value { font-size: 24px; font-weight: bold; }
          .income { color: #059669; }
          .expense { color: #dc2626; }
          .net { color: #059669; }
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
          <p>Generated from Accounting System</p>
        </div>

        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Total Income</div>
            <div class="summary-value income">${formatCurrency(totals.totalIncome)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Expense</div>
            <div class="summary-value expense">${formatCurrency(totals.totalExpense)}</div>
          </div>
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
            ${Array.from({ length: Math.max(sortedIncome.length, sortedExpense.length) }).map((_, i) => {
              const income = sortedIncome[i] || { accountName: '', amount: 0 };
              const expense = sortedExpense[i] || { accountName: '', amount: 0 };
              return `
                <tr>
                  <td class="text-left">${income.accountName}</td>
                  <td class="text-right">${income.amount > 0 ? formatCurrency(income.amount) : ''}</td>
                  <td class="text-left">${expense.accountName}</td>
                  <td class="text-right">${expense.amount > 0 ? formatCurrency(expense.amount) : ''}</td>
                </tr>
              `;
            }).join('')}
            <tr class="totals">
              <td class="text-left">TOTALS</td>
              <td class="text-right">${formatCurrency(totals.totalIncome)}</td>
              <td class="text-left">TOTALS</td>
              <td class="text-right">${formatCurrency(totals.totalExpense)}</td>
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
  }, []);

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
        <div className="flex justify-center">
          <div className={`px-8 py-4 rounded-2xl font-bold text-3xl shadow-2xl border-2 backdrop-blur-md ${
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
                      Income Side (To Collect)
                      {sortConfig?.key === 'accountName' && (
                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th
                      className="px-4 py-3 text-right font-semibold text-sm cursor-pointer hover:bg-blue-800"
                      onClick={() => handleSort('amount')}
                    >
                      Amount
                      {sortConfig?.key === 'amount' && (
                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th
                      className="px-4 py-3 text-left font-semibold text-sm cursor-pointer hover:bg-blue-800"
                      onClick={() => handleSort('accountName')}
                    >
                      Expense Side (To Pay)
                      {sortConfig?.key === 'accountName' && (
                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th
                      className="px-4 py-3 text-right font-semibold text-sm cursor-pointer hover:bg-blue-800"
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
                        className={`border-b hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
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
                  <tr className="bg-gray-100 border-t-2 border-gray-300">
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
