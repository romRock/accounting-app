'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  type: string;
  cityId: string;
  partyId: string;
}

interface Transaction {
  id: string;
  transactionId: string;
  date: string;
  type: string;
  fromCity: { name: string };
  toCity: { name: string };
  party: { name: string };
  amount: number;
  commission: number;
  status: string;
}

interface ReportSummary {
  totalTransactions: number;
  totalAmount: number;
  totalCommission: number;
}

export default function ReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [reportType, setReportType] = useState<'inward' | 'outward' | 'user-ledger' | 'branch-performance' | 'balance-summary'>('inward');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: '',
    dateTo: '',
    type: '',
    cityId: '',
    partyId: '',
  });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  const generateReport = async () => {
    try {
      setGenerating(true);
      
      const queryParams = new URLSearchParams();
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters.cityId) queryParams.append('cityId', filters.cityId);
      if (filters.partyId) queryParams.append('partyId', filters.partyId);

      const endpoint = reportType === 'inward' ? '/api/reports/inward' :
                   reportType === 'outward' ? '/api/reports/outward' :
                   reportType === 'user-ledger' ? '/api/reports/user-ledger' :
                   reportType === 'branch-performance' ? '/api/reports/branch-performance' :
                   '/api/reports/balance-summary';

      const response = await fetch(`${endpoint}?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters.cityId) queryParams.append('cityId', filters.cityId);
      if (filters.partyId) queryParams.append('partyId', filters.partyId);

      const response = await fetch(`/api/reports/export/${format}?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and export various reports
          </p>
        </div>
      </div>

      {/* Report Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Report Type</CardTitle>
          <CardDescription>
            Select the type of report you want to generate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {[
              { type: 'inward', name: 'Inward Report', description: 'All inward transactions' },
              { type: 'outward', name: 'Outward Report', description: 'All outward transactions' },
              { type: 'user-ledger', name: 'User Ledger', description: 'Ledger entries by user' },
              { type: 'branch-performance', name: 'Branch Performance', description: 'Performance metrics by branch' },
              { type: 'balance-summary', name: 'Balance Summary', description: 'Account balance summary' },
            ].map((report) => (
              <Button
                key={report.type}
                variant={reportType === report.type ? 'default' : 'outline'}
                onClick={() => setReportType(report.type as any)}
                className="h-24 flex-col"
              >
                <span className="font-medium">{report.name}</span>
                <span className="text-xs text-muted-foreground mt-1">{report.description}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Apply filters to narrow down the report data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cityId">City</Label>
              <Input
                id="cityId"
                placeholder="Filter by city..."
                value={filters.cityId}
                onChange={(e) => setFilters({ ...filters, cityId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partyId">Party</Label>
              <Input
                id="partyId"
                placeholder="Filter by party..."
                value={filters.partyId}
                onChange={(e) => setFilters({ ...filters, partyId: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button onClick={generateReport} disabled={generating}>
              {generating ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Report Summary</CardTitle>
            <CardDescription>
              Summary of the generated report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Total Transactions</div>
                <div className="text-2xl font-bold">{summary.totalTransactions}</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Total Amount</div>
                <div className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Total Commission</div>
                <div className="text-2xl font-bold">{formatCurrency(summary.totalCommission)}</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Average Transaction</div>
                <div className="text-2xl font-bold">
                  {summary.totalTransactions > 0 
                    ? formatCurrency(summary.totalAmount / summary.totalTransactions)
                    : '₹0.00'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Options */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
            <CardDescription>
              Export the current report to different formats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button
                onClick={() => exportReport('pdf')}
                variant="outline"
              >
                📄 Export PDF
              </Button>
              <Button
                onClick={() => exportReport('excel')}
                variant="outline"
              >
                📊 Export Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Data */}
      <Card>
        <CardHeader>
          <CardTitle>Report Data</CardTitle>
          <CardDescription>
            {transactions.length} transactions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No data found. Generate a report to see results.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Party
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={transaction.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-200 px-4 py-3 text-sm font-medium">
                        {transaction.transactionId}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          transaction.type === 'INWARD' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {transaction.fromCity.name} → {transaction.toCity.name}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {transaction.party.name}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-right">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-right">
                        {formatCurrency(transaction.commission)}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
