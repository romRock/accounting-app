'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store';
import { formatCurrency, formatDate } from '@/lib/utils';

interface BalanceSheet {
  id: string;
  date: string;
  openingBalance: number;
  closingBalance: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

interface BalanceSheetEntry {
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  balance: number;
}

export default function BalanceSheetPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [balanceSheets, setBalanceSheets] = useState<BalanceSheet[]>([]);
  const [currentSheet, setCurrentSheet] = useState<BalanceSheet | null>(null);
  const [entries, setEntries] = useState<BalanceSheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchBalanceSheets();
  }, [isAuthenticated, router]);

  const fetchBalanceSheets = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/balance-sheet', {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBalanceSheets(data.balanceSheets || []);
      }
    } catch (error) {
      console.error('Failed to fetch balance sheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalanceSheetEntries = async (sheetId: string) => {
    try {
      const response = await fetch(`/api/balance-sheet/${sheetId}/entries`, {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Failed to fetch balance sheet entries:', error);
    }
  };

  const generateBalanceSheet = async () => {
    try {
      const response = await fetch('/api/balance-sheet/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: JSON.stringify({
          dateFrom,
          dateTo,
        }),
      });

      if (response.ok) {
        const newSheet = await response.json();
        setBalanceSheets([newSheet, ...balanceSheets]);
        setCurrentSheet(newSheet);
        await fetchBalanceSheetEntries(newSheet.id);
      }
    } catch (error) {
      console.error('Failed to generate balance sheet:', error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading balance sheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Balance Sheet</h1>
          <p className="text-muted-foreground">
            Double entry accounting system with assets, liabilities, and equity
          </p>
        </div>
        <div className="flex space-x-2">
          <div className="space-y-2">
            <input
              type="date"
              placeholder="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="date"
              placeholder="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <Button onClick={generateBalanceSheet}>
            Generate Balance Sheet
          </Button>
        </div>
      </div>

      {/* Balance Sheets List */}
      <Card>
        <CardHeader>
          <CardTitle>Balance Sheets</CardTitle>
          <CardDescription>
            Historical balance sheets for double entry accounting
          </CardDescription>
        </CardHeader>
        <CardContent>
          {balanceSheets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No balance sheets found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {balanceSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className={`p-4 border rounded-lg cursor-pointer ${
                    currentSheet?.id === sheet.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    setCurrentSheet(sheet);
                    fetchBalanceSheetEntries(sheet.id);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{formatDate(sheet.date)}</h3>
                      <p className="text-sm text-muted-foreground">
                        Opening: {formatCurrency(sheet.openingBalance)} | 
                        Closing: {formatCurrency(sheet.closingBalance)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentSheet(sheet);
                          fetchBalanceSheetEntries(sheet.id);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Balance Sheet Details */}
      {currentSheet && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet Summary</CardTitle>
              <CardDescription>
                {formatDate(currentSheet.date)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">Opening Balance:</span>
                  <span className="font-bold">{formatCurrency(currentSheet.openingBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Closing Balance:</span>
                  <span className="font-bold">{formatCurrency(currentSheet.closingBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total Assets:</span>
                  <span className="font-bold text-green-600">{formatCurrency(currentSheet.totalAssets)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total Liabilities:</span>
                  <span className="font-bold text-red-600">{formatCurrency(currentSheet.totalLiabilities)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total Equity:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(currentSheet.totalEquity)}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium mb-2">Accounting Equation</h4>
                <div className="text-center space-y-2">
                  <div className="text-lg">
                    Assets ({formatCurrency(currentSheet.totalAssets)}) = 
                  </div>
                  <div className="text-lg">
                    Liabilities ({formatCurrency(currentSheet.totalLiabilities)}) + 
                    Equity ({formatCurrency(currentSheet.totalEquity)})
                  </div>
                  <div className={`text-lg font-bold ${
                    Math.abs(currentSheet.totalAssets - (currentSheet.totalLiabilities + currentSheet.totalEquity)) < 0.01
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {Math.abs(currentSheet.totalAssets - (currentSheet.totalLiabilities + currentSheet.totalEquity)) < 0.01 ? '✓ Balanced' : '✗ Not Balanced'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Entries</CardTitle>
              <CardDescription>
                All ledger entries for this balance sheet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No entries found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry, index) => (
                    <div
                      key={entry.accountName}
                      className={`p-3 border rounded ${
                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{entry.accountName}</span>
                        <div className="text-right space-x-4">
                          <span className="text-red-600">
                            Debit: {formatCurrency(entry.debitAmount)}
                          </span>
                          <span className="text-green-600">
                            Credit: {formatCurrency(entry.creditAmount)}
                          </span>
                          <span className="font-bold">
                            Balance: {formatCurrency(entry.balance)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
