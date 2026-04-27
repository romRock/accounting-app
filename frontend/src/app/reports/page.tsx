'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store';
import { formatCurrency, formatDate } from '@/lib/utils';

// Report Types
type ReportType = 'outward' | 'inward' | 'combo' | 'outward-centerwise' | 'inward-centerwise' | 'amount-type' | 'customer';

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
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Initialize filters with today's date
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    center: '',
    amountType: '',
    customerName: '',
    mobileNumber: '',
    status: '',
  });

  // Mock centers data
  const centers = [
    { id: '1', name: 'Mumbai' },
    { id: '2', name: 'Delhi' },
    { id: '3', name: 'Bangalore' },
    { id: '4', name: 'Chennai' },
    { id: '5', name: 'Kolkata' },
  ];

  // Mock data generator
  const generateMockData = (type: ReportType): ReportData[] => {
    const mockData: ReportData[] = [];
    
    switch (type) {
      case 'outward':
      case 'inward':
        for (let i = 1; i <= 50; i++) {
          mockData.push({
            id: `TXN${String(i).padStart(6, '0')}`,
            date: `2024-01-${String(i % 28 + 1).padStart(2, '0')}`,
            time: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
            center: centers[Math.floor(Math.random() * centers.length)].name,
            amount: Math.floor(Math.random() * 50000) + 1000,
            amountType: Math.random() > 0.5 ? 'CASH' : 'ACCOUNT / CREDIT',
            commission: Math.floor(Math.random() * 500) + 50,
            status: Math.random() > 0.3 ? 'COMPLETED' : 'PENDING',
          });
        }
        break;
        
      case 'combo':
        for (let i = 1; i <= 30; i++) {
          mockData.push({
            id: `COM${String(i).padStart(6, '0')}`,
            date: `2024-01-${String(i % 28 + 1).padStart(2, '0')}`,
            totalAmount: Math.floor(Math.random() * 100000) + 5000,
            totalCommission: Math.floor(Math.random() * 1000) + 100,
            transactionCount: Math.floor(Math.random() * 10) + 1,
          });
        }
        break;
        
      case 'outward-centerwise':
      case 'inward-centerwise':
        centers.forEach(center => {
          mockData.push({
            center: center.name,
            transactionCount: Math.floor(Math.random() * 100) + 10,
            totalAmount: Math.floor(Math.random() * 500000) + 50000,
            totalCommission: Math.floor(Math.random() * 10000) + 1000,
          });
        });
        break;
        
      case 'amount-type':
        ['CASH', 'ACCOUNT / CREDIT'].forEach(type => {
          mockData.push({
            amountType: type,
            transactionCount: Math.floor(Math.random() * 200) + 50,
            totalAmount: Math.floor(Math.random() * 1000000) + 100000,
            totalCommission: Math.floor(Math.random() * 20000) + 2000,
          });
        });
        break;
        
      case 'customer':
        for (let i = 1; i <= 40; i++) {
          mockData.push({
            customerName: `Customer ${i}`,
            mobileNumber: `9876543${String(i).padStart(4, '0')}`,
            transactionCount: Math.floor(Math.random() * 20) + 1,
            totalAmount: Math.floor(Math.random() * 100000) + 10000,
            totalCommission: Math.floor(Math.random() * 2000) + 200,
          });
        }
        break;
    }
    
    return mockData;
  };

  // Generate report data
  const generateReport = () => {
    setLoading(true);
    setTimeout(() => {
      const data = generateMockData(activeReport);
      setReportData(data);
      
      // Calculate summary
      const summary: ReportSummary = {
        totalRecords: data.length,
        totalAmount: data.reduce((sum, item) => sum + (item.amount || item.totalAmount || 0), 0),
        totalCommission: data.reduce((sum, item) => sum + (item.commission || item.totalCommission || 0), 0),
      };
      setSummary(summary);
      setLoading(false);
    }, 1000);
  };

  // Export functionality
  const exportReport = (format: 'excel' | 'pdf') => {
    setExporting(true);
    setTimeout(() => {
      // Create CSV content for Excel export
      if (format === 'excel') {
        const headers = Object.keys(reportData[0] || {}).join(',');
        const rows = reportData.map(item => Object.values(item).join(',')).join('\n');
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
            ${filteredData.map(item => `
              <tr>
                ${columns.map(column => {
                  const value = item[column.toLowerCase().replace(/\s+/g, '')] || item[column];
                  let displayValue = value;
                  
                  if (column.includes('Amount') || column.includes('Commission')) {
                    displayValue = formatCurrency(value as number);
                  } else if (column === 'Status') {
                    displayValue = `<span class="status-${value?.toString().toLowerCase()}">${value}</span>`;
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

  // Filter data based on search and filters
  const filteredData = reportData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      Object.values(item).some(value => 
        value?.toString().toLowerCase().includes(searchLower)
      );
    
    // Apply date filters (simplified for mock data)
    const matchesDateRange = true; // In real implementation, this would check actual dates
    
    return matchesSearch && matchesDateRange;
  });

  // Get columns based on report type
  const getColumns = () => {
    switch (activeReport) {
      case 'outward':
      case 'inward':
        return ['ID', 'Date', 'Time', 'Center', 'Amount', 'Type', 'Commission', 'Status'];
      case 'combo':
        return ['ID', 'Date', 'Total Amount', 'Total Commission', 'Transaction Count'];
      case 'outward-centerwise':
      case 'inward-centerwise':
        return ['Center', 'Transaction Count', 'Total Amount', 'Total Commission'];
      case 'amount-type':
        return ['Amount Type', 'Transaction Count', 'Total Amount', 'Total Commission'];
      case 'customer':
        return ['Customer Name', 'Mobile Number', 'Transaction Count', 'Total Amount', 'Total Commission'];
      default:
        return [];
    }
  };

  // Get render cell function
  const renderCell = (item: ReportData, column: string) => {
    const value = item[column.toLowerCase().replace(/\s+/g, '')] || item[column];
    
    if (column === 'Amount' || column === 'Total Amount' || column === 'Commission' || column === 'Total Commission') {
      return formatCurrency(value as number);
    }
    
    if (column === 'Status') {
      return (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      );
    }
    
    return value;
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Date Range Filters - Common for all reports */}
              <div>
                <Label htmlFor="dateFrom" className="text-sm font-medium text-gray-700">From Date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="dateTo" className="text-sm font-medium text-gray-700">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                />
              </div>

              {/* Center Filter - For most reports except Combo */}
              {(activeReport === 'outward' || activeReport === 'inward' || 
                activeReport === 'outward-centerwise' || activeReport === 'inward-centerwise') && (
                <div>
                  <Label htmlFor="center" className="text-sm font-medium text-gray-700">Center</Label>
                  <select
                    id="center"
                    value={filters.center}
                    onChange={(e) => setFilters({ ...filters, center: e.target.value })}
                    className="w-full h-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-sm mt-1"
                  >
                    <option value="">All Centers</option>
                    {centers.map((center) => (
                      <option key={center.id} value={center.name}>
                        {center.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount Type Filter - For Outward/Inward/Amount Type reports */}
              {(activeReport === 'outward' || activeReport === 'inward' || activeReport === 'amount-type') && (
                <div>
                  <Label htmlFor="amountType" className="text-sm font-medium text-gray-700">Amount Type</Label>
                  <select
                    id="amountType"
                    value={filters.amountType}
                    onChange={(e) => setFilters({ ...filters, amountType: e.target.value })}
                    className="w-full h-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-sm mt-1"
                  >
                    <option value="">All Types</option>
                    <option value="CASH">CASH</option>
                    <option value="ACCOUNT / CREDIT">ACCOUNT / CREDIT</option>
                  </select>
                </div>
              )}

              {/* Customer Name Filter - For Customer Report */}
              {activeReport === 'customer' && (
                <>
                  <div>
                    <Label htmlFor="customerName" className="text-sm font-medium text-gray-700">Customer Name</Label>
                    <Input
                      id="customerName"
                      placeholder="Search customer..."
                      value={filters.customerName}
                      onChange={(e) => setFilters({ ...filters, customerName: e.target.value })}
                      className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobileNumber" className="text-sm font-medium text-gray-700">Mobile Number</Label>
                    <Input
                      id="mobileNumber"
                      placeholder="Search mobile..."
                      value={filters.mobileNumber}
                      onChange={(e) => setFilters({ ...filters, mobileNumber: e.target.value })}
                      className="bg-white border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
                    />
                  </div>
                </>
              )}

              {/* Status Filter - Optional for transaction reports */}
              {(activeReport === 'outward' || activeReport === 'inward') && (
                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                  <select
                    id="status"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full h-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-sm mt-1"
                  >
                    <option value="">All Status</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0 mt-6">
              <Button
                onClick={generateReport}
                disabled={loading}
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400 shadow-sm"
              >
                {loading ? 'Generating...' : 'Apply Filters'}
              </Button>
              <Button
                onClick={resetFilters}
                variant="outline"
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400 shadow-sm"
              >
                Reset Filters
              </Button>
              <Button
                onClick={() => exportReport('excel')}
                disabled={exporting || reportData.length === 0}
                variant="outline"
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400 shadow-sm"
              >
                {exporting ? 'Exporting...' : 'Export Excel'}
              </Button>
              <Button
                onClick={() => exportReport('pdf')}
                disabled={exporting || reportData.length === 0}
                variant="outline"
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400 shadow-sm"
              >
                {exporting ? 'Exporting...' : 'Export PDF'}
              </Button>
              <Button
                onClick={() => window.print()}
                disabled={reportData.length === 0}
                variant="outline"
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400 shadow-sm"
              >
                Print
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
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-sm font-medium text-gray-600">Average Amount</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    {summary.totalRecords > 0 ? formatCurrency(summary.totalAmount / summary.totalRecords) : '₹0.00'}
                  </div>
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
              
              <div className="hidden sm:block">
                <Input
                  placeholder="Search report data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white w-48 lg:w-64 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-600"
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
                    {filteredData.map((item, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        {getColumns().map((column, colIndex) => (
                          <td
                            key={colIndex}
                            className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 last:border-r-0"
                          >
                            {renderCell(item, column)}
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
