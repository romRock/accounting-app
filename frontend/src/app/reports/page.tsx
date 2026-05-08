'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CityTypeahead } from '@/components/ui/typeahead';
import { transactionApi, Transaction } from '@/lib/transactions';

// Report Types
type ReportType = 'outward' | 'inward' | 'combo' | 'amount-type';

interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  center: string;
  amountType: string;
  customerName: string;
  mobileNumber: string;
  status: string;
}

interface ReportData {
  id?: string;
  date?: string;
  time?: string;
  center?: string;
  amount?: number;
  amountType?: string;
  commission?: number;
  status?: string;
  customerName?: string;
  mobileNumber?: string;
  transactionCount?: number;
  totalAmount?: number;
  totalCommission?: number;
  [key: string]: any;
}

interface ReportSummary {
  totalRecords: number;
  totalAmount: number;
  totalCommission: number;
  [key: string]: any;
}

export default function ReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [activeReport, setActiveReport] = useState<ReportType>('outward');
  const [reportData, setReportData] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  
  // Date filter states from transaction page
  const [filterByDate, setFilterByDate] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSelectingRange, setIsSelectingRange] = useState(false);

  // Initialize filters with today's date (Indian time with 12:00 AM reset daily)
  const [filters, setFilters] = useState<ReportFilters>(() => {
    const today = new Date();
    const currentDate = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0');
    
    return {
      dateFrom: currentDate,
      dateTo: currentDate,
      center: '',
      amountType: '',
      customerName: '',
      mobileNumber: '',
      status: '',
    };
  });

  
  // Fetch real transaction data
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await transactionApi.getTransactions({
        type: activeReport === 'inward' ? 'INWARD' : 'OUTWARD',
        search: searchTerm,
        page: currentPage,
        limit: 100,
        ...(activeReport === 'amount-type' && filters.amountType && filters.amountType.trim() && { amountType: filters.amountType })
      });
      
      setReportData(response.transactions);
      
      setReportData(response.transactions);
      
      // Calculate summary will be done in filteredData useEffect
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setReportData([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  // Generate report data
  const generateReport = () => {
    fetchTransactions();
  };

  // Export functionality
  const exportReport = (format: 'excel' | 'pdf') => {
    setExporting(true);
    setTimeout(() => {
      // Create CSV content for Excel export
      if (format === 'excel') {
        const headers = getColumns().join(',');
        const rows = filteredData.map((transaction, index) => {
          return getColumns().map(column => {
            switch (column) {
              case 'TOKEN':
                return transaction.tokenNo?.toString() || (index + 1).toString();
              case 'DATE':
                return formatDate(transaction.date);
              case 'TIME':
                // Format time to show only HH:MM
                if (transaction.time) {
                  const timeStr = transaction.time.includes('T') ? new Date(transaction.time).toTimeString().slice(0, 5) : transaction.time.slice(0, 5);
                  return timeStr;
                }
                return '-';
              case 'CENTER':
                return transaction.center?.name || transaction.centerId || '-';
              case 'AMOUNT':
                // Combine amount + center commission (without currency symbol)
                const totalAmount = transaction.amount + (transaction.centerCommission || 0);
                return totalAmount.toString();
              case 'AMOUNT TYPE':
                return transaction.amountType || '-';
              case 'OUR COMM':
                return (transaction.bookingCommission || 0).toString();
              case 'RECEIVER NAME':
                return transaction.receiverName || '-';
              case 'SENDER NAME':
                return transaction.senderName || '-';
              case 'REMARKS':
                return transaction.remark || '-';
              default:
                return '-';
            }
          }).join(',');
        }).join('\n');
        const csvContent = `${headers}\n${rows}`;
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeReport}-report.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Generate proper PDF using HTML-to-PDF approach
        generatePDF();
      }
      setExporting(false);
    }, 1000);
  };

  // Generate PDF using print window approach
  const generatePDF = () => {
    const columns = getColumns();
    const reportTitle = activeReport.replace('-', ' ').toUpperCase() + ' REPORT';
    
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportTitle}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
          }
          .header p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 14px;
          }
          .summary {
            margin-bottom: 30px;
            display: flex;
            justify-content: space-around;
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
          }
          .summary-item {
            text-align: center;
          }
          .summary-item .label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          .summary-item .value {
            font-size: 18px;
            font-weight: bold;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
          }
          td {
            font-size: 12px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          .status-completed {
            background-color: #d4edda;
            color: #155724;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
          }
          .status-pending {
            background-color: #fff3cd;
            color: #856404;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportTitle}</h1>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p>Filter Period: ${filters.dateFrom} to ${filters.dateTo}</p>
        </div>
        
        ${summary ? `
        <div class="summary">
          <div class="summary-item">
            <div class="label">Total Records</div>
            <div class="value">${summary.totalRecords}</div>
          </div>
          <div class="summary-item">
            <div class="label">Total Amount</div>
            <div class="value">${formatCurrency(summary.totalAmount)}</div>
          </div>
          <div class="summary-item">
            <div class="label">Total Commission</div>
            <div class="value">${formatCurrency(summary.totalCommission)}</div>
          </div>
          <div class="summary-item">
            <div class="label">Average Amount</div>
            <div class="value">${summary.totalRecords > 0 ? formatCurrency(summary.totalAmount / summary.totalRecords) : '₹0.00'}</div>
          </div>
        </div>
        ` : ''}
        
        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${col}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredData.map((transaction, index) => `
              <tr>
                ${columns.map(column => {
                  let displayValue = renderCell(transaction, column, index);
                  
                  if (column.includes('Amount') || column.includes('COMM')) {
                    displayValue = typeof displayValue === 'string' ? displayValue : formatCurrency(displayValue as number);
                  }
                  
                  return `<td>${displayValue}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>This report was generated from the Accounting System</p>
          <p>Page 1 of 1</p>
        </div>
      </body>
      </html>
    `;

    // Create a new window and print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      dateFrom: new Date().toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      center: '',
      amountType: '',
      customerName: '',
      mobileNumber: '',
      status: '',
    });
    setSearchTerm('');
  };

  // Filter data based on search and filters (matching transaction page logic)
  const filteredData = reportData.filter(transaction => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      transaction.receiverName?.toLowerCase().includes(searchLower) ||
      transaction.senderName?.toLowerCase().includes(searchLower) ||
      transaction.transactionId?.toLowerCase().includes(searchLower) ||
      transaction.centerId?.toLowerCase().includes(searchLower) ||
      transaction.receiverNumber?.toLowerCase().includes(searchLower) ||
      transaction.senderNumber?.toLowerCase().includes(searchLower);
    
    // Apply date filters (matching transaction page logic)
    const transactionDateString = new Date(transaction.date).toISOString().split('T')[0];
    const today = new Date();
    const todayString = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0');
    
    const matchesDate = !filterByDate ? 
      transactionDateString === todayString : 
      (isSelectingRange && startDate && endDate ? 
        transactionDateString >= startDate && transactionDateString <= endDate :
        dateFilter && transactionDateString === dateFilter);
    
    // Apply center filter
    const matchesCenter = !filters.center || 
      transaction.center?.name?.toLowerCase().includes(filters.center.toLowerCase()) ||
      transaction.centerId?.toLowerCase().includes(filters.center.toLowerCase());
    
    // Apply amount type filter
    const matchesAmountType = !filters.amountType || filters.amountType.trim() === '' || 
      transaction.amountType === filters.amountType ||
      (filters.amountType === 'CREDIT' && (transaction.amountType === 'CREDIT' || transaction.amountType === 'ACCOUNT / CREDIT'));
    
    return matchesSearch && matchesDate && matchesCenter && matchesAmountType;
  });

  // Get columns based on report type (for outward and inward transactions)
  const getColumns = () => {
    if (activeReport === 'outward') {
      return ['TOKEN', 'DATE', 'TIME', 'CENTER', 'AMOUNT', 'AMOUNT TYPE', 'OUR COMM', 'RECEIVER NAME', 'SENDER NAME', 'REMARKS'];
    }
    if (activeReport === 'inward') {
      return ['TOKEN', 'DATE', 'TIME', 'CENTER', 'AMOUNT', 'AMOUNT TYPE', 'CUTTING COMM', 'SENDER NAME', 'RECEIVER NAME', 'REMARKS'];
    }
    if (activeReport === 'amount-type') {
      return ['TOKEN', 'DATE', 'TIME', 'CENTER', 'AMOUNT', 'AMOUNT TYPE', 'OUR COMM', 'RECEIVER NAME', 'SENDER NAME', 'REMARKS'];
    }
    return ['ID', 'Date', 'Time', 'Center', 'Amount', 'Type', 'Commission', 'Status'];
  };

  // Get render cell function (for outward, inward and amount-type transactions)
  const renderCell = (transaction: Transaction, column: string, index: number) => {
    switch (column) {
      case 'TOKEN':
        return transaction.tokenNo?.toString() || (index + 1).toString();
      case 'DATE':
        return formatDate(transaction.date);
      case 'TIME':
        // Format time to show only HH:MM format
        if (transaction.time) {
          const timeStr = transaction.time.includes('T') ? new Date(transaction.time).toTimeString().slice(0, 5) : transaction.time.slice(0, 5);
          return timeStr;
        }
        return '-';
      case 'CENTER':
        return transaction.center?.name || transaction.centerId || '-';
      case 'AMOUNT':
        // Combine amount + center commission
        const totalAmount = transaction.amount + (transaction.centerCommission || 0);
        return formatCurrency(totalAmount);
      case 'AMOUNT TYPE':
        return transaction.amountType || '-';
      case 'OUR COMM':
        return formatCurrency(transaction.bookingCommission || 0);
      case 'CUTTING COMM':
        return formatCurrency(transaction.bookingCommission || 0);
      case 'RECEIVER NAME':
        return transaction.receiverName || '-';
      case 'SENDER NAME':
        return transaction.senderName || '-';
      case 'REMARKS':
        return transaction.remark || '-';
      default:
        const value = transaction[column as keyof Transaction];
        if (typeof value === 'string' || typeof value === 'number') {
          return value.toString();
        }
        return '-';
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  // Listen for report changes from header
  useEffect(() => {
    const handleReportChange = (e: CustomEvent) => {
      setActiveReport(e.detail);
    };

    window.addEventListener('setActiveReport', handleReportChange as EventListener);
    
    return () => {
      window.removeEventListener('setActiveReport', handleReportChange as EventListener);
    };
  }, []);

  // Auto-generate report on component mount and when active report changes
  useEffect(() => {
    generateReport();
  }, [activeReport]);

  // Calculate summary based on filtered data
  useEffect(() => {
    if (reportData.length > 0) {
      const summary: ReportSummary = {
        totalRecords: filteredData.length,
        totalAmount: filteredData.reduce((sum, item) => sum + (item.amount || 0) + (item.centerCommission || 0), 0),
        totalCommission: filteredData.reduce((sum, item) => sum + (item.bookingCommission || 0), 0),
      };
      setSummary(summary);
    }
  }, [reportData, searchTerm, filterByDate, dateFilter, startDate, endDate, isSelectingRange, filters.center, filters.amountType]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-white min-h-screen w-full">
      <div className="pt-16 space-y-4 sm:space-y-6">

        {/* Filter Section */}
        <Card className="shadow-sm border-gray-200 bg-gray-100">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Filters
            </CardTitle>
            <CardDescription className="text-gray-600">
              Apply filters to narrow down the report data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              
              {/* Date Filter */}
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

              {/* Center Filter - For Outward/Inward reports */}
              {(activeReport === 'outward' || activeReport === 'inward') && (
                <div>
                  {/* <Label htmlFor="center" className="text-sm font-medium text-gray-700">Center</Label> */}
                  <CityTypeahead
                    id="center"
                    label="Center"
                    value={filters.center}
                    onChange={(value, city) => setFilters({ ...filters, center: city?.name || value })}
                    placeholder="Select center or search city..."
                    className="mt-1"
                  />
                </div>
              )}

              {/* Amount Type Filter - Only for Amount Type Report */}
              {activeReport === 'amount-type' && (
                <div>
                  <Label htmlFor="amountType" className="text-sm font-medium text-gray-700">Amount Type</Label>
                  <select
                    id="amountType"
                    value={filters.amountType}
                    onChange={(e) => setFilters({ ...filters, amountType: e.target.value })}
                    className="w-full h-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-black text-sm mt-1"
                  >
                    <option value="">All Types</option>
                    <option value="CASH">CASH</option>
                    <option value="CREDIT">CREDIT</option>
                  </select>
                </div>
              )}

                          </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0 mt-6">
              <Button
                onClick={generateReport}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                {loading ? 'Generating...' : 'Apply Filters'}
              </Button>
              <Button
                onClick={resetFilters}
                variant="outline"
                className="bg-black hover:bg-gray-800 text-white border border-gray-300 hover:border-gray-400 shadow-sm"
              >
                Reset Filters
              </Button>
              <Button
                onClick={() => exportReport('excel')}
                disabled={exporting || reportData.length === 0}
                variant="outline"
                className="bg-green-600 hover:bg-green-700 text-white border border-green-300 hover:border-green-400 shadow-sm"
              >
                {exporting ? 'Exporting...' : 'Export Excel'}
              </Button>
              <Button
                onClick={() => exportReport('pdf')}
                disabled={exporting || reportData.length === 0}
                variant="outline"
                className="bg-red-600 hover:bg-red-700 text-white border border-red-300 hover:border-red-400 shadow-sm"
              >
                {exporting ? 'Exporting...' : 'Export PDF'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Summary */}
        {summary && (
          <Card className="shadow-sm border-gray-200 bg-gray-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Report Summary
              </CardTitle>
              <CardDescription className="text-gray-600">
                Summary of the generated {activeReport.replace('-', ' ')} report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-sm font-medium text-gray-600">Total Records</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{summary.totalRecords}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-sm font-medium text-gray-600">Total Amount</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalAmount)}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-sm font-medium text-gray-600">Total Commission</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalCommission)}</div>
                </div>
                              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Data Table */}
        <Card className="shadow-sm border-gray-200 bg-gray-100">
          <CardHeader className="pb-4">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {activeReport.replace('-', ' ')} Report Data
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {filteredData.length} records found
                </CardDescription>
              </div>
              
              {/* Search Input */}
              <div className="hidden sm:block">
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white w-48 lg:w-64 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm placeholder:text-gray-600"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading report data...</span>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No data found. Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {getColumns().map((column, index) => (
                        <th
                          key={index}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.map((transaction, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        {getColumns().map((column, colIndex) => (
                          <td
                            key={colIndex}
                            className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 last:border-r-0"
                          >
                            {renderCell(transaction, column, rowIndex)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
