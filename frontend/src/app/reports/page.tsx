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
import { accountingApi, AccountingEntry } from '@/lib/accounting';
import { getHawalaEntries, HawalaEntry } from '@/lib/hawala';
import { getSpecialEntries, SpecialEntry } from '@/lib/specialEntry';

// Unified row used only by Transaction Report (report #5)
type TxnReportModule = 'transaction' | 'accounting' | 'hawala' | 'special';
interface TxnReportRow {
  key: string;
  module: TxnReportModule;
  moduleLabel: string;
  date: string;        // ISO date
  time: string;        // HH:MM
  sortTs: number;      // timestamp for sorting ascending
  trnId: string;
  token: string;
  type: string;        // OUTWARD/INWARD/INCOME/EXPENSE/HAWALA/SPL
  center: string;
  amountType: string;  // CASH/CREDIT (transactions only)
  partyA: string;
  partyB: string;
  partyC: string;
  category: string;
  amount: string;
  amountA: string;
  amountB: string;
  amountC: string;
  remark: string;
}

// Report Types
type ReportType = 'outward' | 'inward' | 'combo' | 'amount-type' | 'transaction' | 'customer' | 'transaction-refund';

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
  outwardTotal?: number;
  inwardTotal?: number;
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

  // ----- Transaction Report (#5) dedicated state -----
  const [txnReportRows, setTxnReportRows] = useState<TxnReportRow[]>([]);
  const [txnModuleFilter, setTxnModuleFilter] = useState<Record<TxnReportModule, boolean>>({
    transaction: true,
    accounting: true,
    hawala: true,
    special: true,
  });

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
      let response;
      
      if (activeReport === 'combo') {
        // Fetch both inward and outward transactions for combo report
        const [inwardResponse, outwardResponse] = await Promise.all([
          transactionApi.getTransactions({
            type: 'INWARD',
            page: currentPage,
            limit: 100,
          }),
          transactionApi.getTransactions({
            type: 'OUTWARD',
            page: currentPage,
            limit: 100,
          })
        ]);
        
        // Combine both transaction types and sort by time
        const allTransactions = [...inwardResponse.transactions, ...outwardResponse.transactions]
          .sort((a, b) => {
            // Sort by date first, then by time
            const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
            if (dateCompare !== 0) return dateCompare;
            
            // If same date, sort by time
            const timeA = a.time ? new Date(a.time).getTime() : 0;
            const timeB = b.time ? new Date(b.time).getTime() : 0;
            return timeA - timeB;
          });
        
        setReportData(allTransactions);
      } else if (activeReport === 'transaction') {
        // Transaction Report (#5): aggregate from 4 modules (today only)
        await fetchTransactionReport();
        setReportData([]); // unified table renders from txnReportRows
      } else if (activeReport === 'customer' || activeReport === 'transaction-refund') {
        // Placeholder for remaining reports (unchanged - to be implemented later)
        response = await transactionApi.getTransactions({
          type: 'OUTWARD',
          search: searchTerm,
          page: currentPage,
          limit: 100,
        });
        
        setReportData(response.transactions);
      } else {
        // Fetch regular transaction data for other reports
        response = await transactionApi.getTransactions({
          type: activeReport === 'inward' ? 'INWARD' : 'OUTWARD',
          search: searchTerm,
          page: currentPage,
          limit: 100,
          ...(activeReport === 'amount-type' && filters.amountType && filters.amountType.trim() && { amountType: filters.amountType })
        });
        
        setReportData(response.transactions);
      }
      
      // Calculate summary will be done in filteredData useEffect
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setReportData([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  // Helpers for Transaction Report (#5)
  const todayLocalString = () => {
    const t = new Date();
    return (
      t.getFullYear() +
      '-' +
      String(t.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(t.getDate()).padStart(2, '0')
    );
  };

  const isToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const local =
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0');
    return local === todayLocalString();
  };

  const extractTimeAndTs = (dateStr?: string, timeStr?: string) => {
    // Returns HH:MM display and timestamp for sorting
    let ts = 0;
    let hhmm = '';
    const baseDate = dateStr ? new Date(dateStr) : null;
    if (timeStr) {
      const t = new Date(timeStr);
      if (!isNaN(t.getTime())) {
        ts = t.getTime();
        hhmm = t.toTimeString().slice(0, 5);
      } else if (typeof timeStr === 'string' && timeStr.length >= 5) {
        hhmm = timeStr.slice(0, 5);
        if (baseDate && !isNaN(baseDate.getTime())) ts = baseDate.getTime();
      }
    }
    if (!ts && baseDate && !isNaN(baseDate.getTime())) ts = baseDate.getTime();
    return { hhmm, ts };
  };

  // Fetch all 4 modules' GET APIs for today and build unified rows
  const fetchTransactionReport = async () => {
    try {
      const today = todayLocalString();

      const [txnRes, accRes, hawalaRes, splRes] = await Promise.allSettled([
        // Transactions: get both INWARD and OUTWARD, exclude CASH later
        Promise.all([
          transactionApi.getTransactions({ type: 'OUTWARD', page: 1, limit: 500 }),
          transactionApi.getTransactions({ type: 'INWARD', page: 1, limit: 500 }),
        ]),
        accountingApi.getAccountEntries({
          page: 1,
          limit: 500,
          dateFrom: today,
          dateTo: today,
        }),
        getHawalaEntries({ page: 1, limit: 500, dateFrom: today, dateTo: today }),
        getSpecialEntries({ page: 1, limit: 500, dateFrom: today, dateTo: today }),
      ]);

      const rows: TxnReportRow[] = [];

      // Transactions (only credit-affecting, exclude CASH)
      if (txnRes.status === 'fulfilled') {
        const [outward, inward] = txnRes.value;
        const all: Transaction[] = [...(outward.transactions || []), ...(inward.transactions || [])];
        all.forEach((t) => {
          if (!isToday(t.date)) return;
          const at = (t.amountType || '').toUpperCase();
          if (at === 'CASH') return; // exclude cash
          const { hhmm, ts } = extractTimeAndTs(t.date, t.time);
          const totalAmt = t.type === 'OUTWARD' ? (t.amount || 0) + (t.centerCommission || 0) : (t.amount || 0);
          rows.push({
            key: `txn-${t.id}`,
            module: 'transaction',
            moduleLabel: 'Transaction',
            date: t.date,
            time: hhmm,
            sortTs: ts,
            trnId: t.transactionId || '',
            token: t.tokenNo != null ? String(t.tokenNo) : '',
            type: t.type || '',
            center: t.center?.name || t.centerId || '',
            amountType: t.amountType || '',
            partyA: t.receiverName || '',
            partyB: t.senderName || '',
            partyC: '',
            category: '',
            amount: String(totalAmt),
            amountA: '',
            amountB: '',
            amountC: '',
            remark: t.remark || '',
          });
        });
      }

      // Accounting entries (all - they all affect client/business ledger)
      if (accRes.status === 'fulfilled') {
        const entries: AccountingEntry[] = accRes.value.entries || [];
        entries.forEach((e) => {
          const dateField = e.date;
          if (!isToday(dateField)) return;
          const { hhmm, ts } = extractTimeAndTs(dateField, e.statusTime || e.time);
          rows.push({
            key: `acc-${e.id}`,
            module: 'accounting',
            moduleLabel: 'Accounting',
            date: dateField,
            time: hhmm,
            sortTs: ts,
            trnId: e.entryId || e.transactionId || '',
            token: '',
            type: e.type || '',
            center: '',
            amountType: '',
            partyA: e.party?.name || '',
            partyB: '',
            partyC: '',
            category: e.category?.name || '',
            amount: String(e.totalAmount ?? e.amount ?? 0),
            amountA: '',
            amountB: '',
            amountC: '',
            remark: e.description || '',
          });
        });
      }

      // Hawala (all entries affect 2 parties)
      if (hawalaRes.status === 'fulfilled') {
        const list: HawalaEntry[] = hawalaRes.value.data || [];
        list.forEach((h) => {
          if (!isToday(h.date)) return;
          const { hhmm, ts } = extractTimeAndTs(h.date, h.time);
          rows.push({
            key: `hwl-${h.id}`,
            module: 'hawala',
            moduleLabel: 'Hawala',
            date: h.date,
            time: hhmm,
            sortTs: ts,
            trnId: h.transactionId || '',
            token: h.tokenNo != null ? String(h.tokenNo) : '',
            type: 'HAWALA',
            center: '',
            amountType: '',
            partyA: h.partyA || '',
            partyB: h.partyB || '',
            partyC: '',
            category: '',
            amount: String(h.amount || 0),
            amountA: '',
            amountB: '',
            amountC: '',
            remark: h.remark || '',
          });
        });
      }

      // Special Entry (3-party entries always affect clients)
      if (splRes.status === 'fulfilled') {
        const list: SpecialEntry[] = splRes.value.data || [];
        list.forEach((s) => {
          if (!isToday(s.date)) return;
          const { hhmm, ts } = extractTimeAndTs(s.date, s.time);
          rows.push({
            key: `spl-${s.id}`,
            module: 'special',
            moduleLabel: 'Special Entry',
            date: s.date,
            time: hhmm,
            sortTs: ts,
            trnId: s.transactionId || '',
            token: s.tokenNo != null ? String(s.tokenNo) : '',
            type: 'SPL',
            center: '',
            amountType: '',
            partyA: s.partyA || '',
            partyB: s.partyB || '',
            partyC: s.partyC || '',
            category: '',
            amount: '',
            amountA: String(s.amountA || 0),
            amountB: String(s.amountB || 0),
            amountC: String(s.amountC || 0),
            remark: s.remark || '',
          });
        });
      }

      // Sort ascending by time (earliest first)
      rows.sort((a, b) => a.sortTs - b.sortTs);
      setTxnReportRows(rows);
    } catch (err) {
      console.error('Failed to fetch transaction report:', err);
      setTxnReportRows([]);
    }
  };

  // Generate report data
  const generateReport = () => {
    fetchTransactions();
  };

  // Filtered rows for Transaction Report (module filter + search)
  const txnReportFilteredRows = txnReportRows.filter((r) => {
    if (!txnModuleFilter[r.module]) return false;
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      r.trnId.toLowerCase().includes(s) ||
      r.token.toLowerCase().includes(s) ||
      r.partyA.toLowerCase().includes(s) ||
      r.partyB.toLowerCase().includes(s) ||
      r.partyC.toLowerCase().includes(s) ||
      r.category.toLowerCase().includes(s) ||
      r.center.toLowerCase().includes(s) ||
      r.remark.toLowerCase().includes(s)
    );
  });

  const TXN_REPORT_COLUMNS = [
    'TIME',
    'MODULE',
    'TRN ID',
    'TOKEN',
    'TYPE',
    'CENTER',
    'AMOUNT TYPE',
    'PARTY A',
    'AMOUNT A',
    'PARTY B',
    'AMOUNT B',
    'PARTY C',
    'AMOUNT C',
    'CATEGORY',
    'AMOUNT',
    'REMARK',
  ];

  const renderTxnReportCell = (row: TxnReportRow, column: string) => {
    const num = (v: string) => (v === '' ? '' : formatCurrency(Number(v) || 0));
    switch (column) {
      case 'TIME': return row.time || '';
      case 'MODULE': return row.moduleLabel;
      case 'TRN ID': return row.trnId || '';
      case 'TOKEN': return row.token || '';
      case 'TYPE': return row.type || '';
      case 'CENTER': return row.center || '';
      case 'AMOUNT TYPE': return row.amountType || '';
      case 'PARTY A': return row.partyA || '';
      case 'AMOUNT A': return num(row.amountA);
      case 'PARTY B': return row.partyB || '';
      case 'AMOUNT B': return num(row.amountB);
      case 'PARTY C': return row.partyC || '';
      case 'AMOUNT C': return num(row.amountC);
      case 'CATEGORY': return row.category || '';
      case 'AMOUNT': return num(row.amount);
      case 'REMARK': return row.remark || '';
      default: return '';
    }
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
              case 'OUTWARD AMOUNT':
                // Show amount only for outward transactions, empty for inward
                if (transaction.type === 'OUTWARD') {
                  const totalAmount = transaction.amount + (transaction.centerCommission || 0);
                  return totalAmount.toString();
                }
                return '';
              case 'INWARD AMOUNT':
                // Show amount only for inward transactions, empty for outward
                if (transaction.type === 'INWARD') {
                  return transaction.amount.toString();
                }
                return '';
              case 'AMOUNT':
                // For inward reports, show only amount without center commission
                if (activeReport === 'inward') {
                  return transaction.amount.toString();
                }
                // For outward and amount-type reports, show amount + center commission
                const totalAmount = transaction.amount + (transaction.centerCommission || 0);
                return totalAmount.toString();
              case 'AMOUNT TYPE':
                return transaction.amountType || '-';
              case 'OUR COMM':
                return (transaction.bookingCommission || 0).toString();
              case 'CUTTING COMM':
                // For inward reports, show cutting commission
                if (activeReport === 'inward') {
                  return (transaction.bookingCommission || 0).toString();
                }
                // For outward and amount-type reports, show our commission
                return (transaction.bookingCommission || 0).toString();
              case 'TRANSACTION TYPE':
                return transaction.type || 'OUTWARD';
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
    // For combo report, only filter by date, no search/filter by customer names
    if (activeReport === 'combo') {
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
      
      return matchesDate;
    }
    
    // For other reports, use existing filtering logic
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
    if (activeReport === 'combo') {
      return ['TRANSACTION TYPE', 'TOKEN', 'DATE', 'TIME', 'CENTER', 'OUTWARD AMOUNT', 'INWARD AMOUNT'];
    }
    if (activeReport === 'outward') {
      return ['TOKEN', 'DATE', 'TIME', 'CENTER', 'AMOUNT', 'AMOUNT TYPE', 'OUR COMM', 'RECEIVER NAME', 'SENDER NAME', 'REMARKS'];
    }
    if (activeReport === 'inward') {
      return ['TOKEN', 'DATE', 'TIME', 'CENTER', 'AMOUNT', 'AMOUNT TYPE', 'CUTTING COMM', 'SENDER NAME', 'RECEIVER NAME', 'REMARKS'];
    }
    if (activeReport === 'amount-type') {
      return ['TOKEN', 'DATE', 'TIME', 'CENTER', 'AMOUNT', 'AMOUNT TYPE', 'OUR COMM', 'RECEIVER NAME', 'SENDER NAME', 'REMARKS'];
    }
    // New accounting reports - placeholder columns for now
    if (activeReport === 'transaction') {
      return ['TRANSACTION ID', 'DATE', 'TYPE', 'CATEGORY', 'AMOUNT', 'STATUS', 'REMARKS'];
    }
    if (activeReport === 'customer') {
      return ['CUSTOMER NAME', 'MOBILE NUMBER', 'TOTAL TRANSACTIONS', 'TOTAL AMOUNT', 'LAST TRANSACTION DATE'];
    }
    if (activeReport === 'transaction-refund') {
      return ['TRANSACTION ID', 'DATE', 'ORIGINAL AMOUNT', 'REFUND AMOUNT', 'REFUND REASON', 'STATUS'];
    }
    return ['ID', 'Date', 'Time', 'Center', 'Amount', 'Type', 'Commission', 'Status'];
  };

  // Get render cell function (for outward, inward and amount-type transactions)
  const renderCell = (transaction: Transaction, column: string, index: number) => {
    switch (column) {
      case 'TRANSACTION TYPE':
        const transactionType = transaction.type || 'OUTWARD';
        return transactionType;
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
      case 'OUTWARD AMOUNT':
        // Show amount only for outward transactions, empty for inward
        if (transaction.type === 'OUTWARD') {
          const totalAmount = transaction.amount + (transaction.centerCommission || 0);
          return formatCurrency(totalAmount);
        }
        return '-';
      case 'INWARD AMOUNT':
        // Show amount only for inward transactions, empty for outward
        if (transaction.type === 'INWARD') {
          return formatCurrency(transaction.amount);
        }
        return '-';
      case 'AMOUNT':
        // For inward reports, show only amount without center commission
        if (activeReport === 'inward') {
          return transaction.amount.toString();
        }
        // For outward and amount-type reports, show amount + center commission
        const totalAmount = transaction.amount + (transaction.centerCommission || 0);
        return formatCurrency(totalAmount);
      case 'AMOUNT TYPE':
        return transaction.amountType || '-';
      case 'COMMISSION':
        return formatCurrency(transaction.commission || 0);
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
      // New accounting reports - placeholder data for now
      case 'TRANSACTION ID':
        return transaction.transactionId || `ACC${index + 1}`;
      case 'TYPE':
        if (activeReport === 'transaction') {
          return transaction.amountType || 'INCOME';
        }
        return transaction.type || 'OUTWARD';
      case 'CATEGORY':
        return transaction.amountType || 'General';
      case 'STATUS':
        return transaction.status ? 'Completed' : 'Pending';
      case 'CUSTOMER NAME':
        return transaction.receiverName || transaction.senderName || 'N/A';
      case 'MOBILE NUMBER':
        return transaction.receiverNumber || transaction.senderNumber || 'N/A';
      case 'TOTAL TRANSACTIONS':
        return Math.floor(Math.random() * 10) + 1; // Placeholder
      case 'TOTAL AMOUNT':
        return formatCurrency(transaction.amount || 0);
      case 'LAST TRANSACTION DATE':
        return formatDate(transaction.date);
      case 'ORIGINAL AMOUNT':
        return formatCurrency(transaction.amount || 0);
      case 'REFUND AMOUNT':
        return formatCurrency(Math.floor((transaction.amount || 0) * 0.1)); // Placeholder 10% refund
      case 'REFUND REASON':
        return 'Customer Request'; // Placeholder
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
    if (activeReport === 'transaction') {
      const totalAmt = txnReportFilteredRows.reduce((sum, r) => {
        if (r.module === 'special') {
          return sum + (Number(r.amountA) || 0) + (Number(r.amountB) || 0) + (Number(r.amountC) || 0);
        }
        return sum + (Number(r.amount) || 0);
      }, 0);
      setSummary({
        totalRecords: txnReportFilteredRows.length,
        totalAmount: totalAmt,
        totalCommission: 0,
      });
      return;
    }
    if (reportData.length > 0) {
      let summary: ReportSummary;
      
      if (activeReport === 'combo') {
        // Calculate separate totals for outward and inward amounts
        const outwardTotal = filteredData
          .filter(item => item.type === 'OUTWARD')
          .reduce((sum, item) => sum + (item.amount || 0) + (item.centerCommission || 0), 0);
        
        const inwardTotal = filteredData
          .filter(item => item.type === 'INWARD')
          .reduce((sum, item) => sum + (item.amount || 0), 0);

        summary = {
          totalRecords: filteredData.length,
          totalAmount: outwardTotal + inwardTotal,
          totalCommission: 0,
          outwardTotal,
          inwardTotal,
        };
      } else if (activeReport === 'customer') {
        // For customer report, calculate unique customers
        const uniqueCustomers = new Set(
          filteredData.map(item => item.receiverName || item.senderName).filter(Boolean)
        );
        
        summary = {
          totalRecords: uniqueCustomers.size,
          totalAmount: filteredData.reduce((sum, item) => sum + (item.amount || 0), 0),
          totalCommission: filteredData.reduce((sum, item) => sum + (item.bookingCommission || 0), 0),
        };
      } else if (activeReport === 'transaction-refund') {
        // For transaction refund report, calculate refund amounts (placeholder)
        summary = {
          totalRecords: filteredData.length,
          totalAmount: filteredData.reduce((sum, item) => sum + (item.amount || 0), 0),
          totalCommission: filteredData.reduce((sum, item) => sum + Math.floor((item.amount || 0) * 0.1), 0), // 10% refund placeholder
        };
      } else {
        // For transaction report and other reports
        summary = {
          totalRecords: filteredData.length,
          totalAmount: filteredData.reduce((sum, item) => sum + (item.amount || 0) + (item.centerCommission || 0), 0),
          totalCommission: filteredData.reduce((sum, item) => sum + (item.bookingCommission || 0), 0),
        };
      }
      
      setSummary(summary);
    }
  }, [reportData, searchTerm, filterByDate, dateFilter, startDate, endDate, isSelectingRange, filters.center, filters.amountType, activeReport, txnReportRows, txnModuleFilter]);

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

              {/* Module Filter - Only for Transaction Report (#5) */}
              {activeReport === 'transaction' && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <Label className="text-sm font-medium text-gray-700">Modules</Label>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {([
                      { id: 'transaction', name: 'Transaction' },
                      { id: 'accounting', name: 'Accounting' },
                      { id: 'hawala', name: 'Hawala' },
                      { id: 'special', name: 'Special Entry' },
                    ] as { id: TxnReportModule; name: string }[]).map((m) => (
                      <label key={m.id} className="flex items-center space-x-2 text-sm text-gray-800">
                        <input
                          type="checkbox"
                          checked={txnModuleFilter[m.id]}
                          onChange={(e) =>
                            setTxnModuleFilter((prev) => ({ ...prev, [m.id]: e.target.checked }))
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span>{m.name}</span>
                      </label>
                    ))}
                  </div>
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
                {activeReport === 'combo' ? (
                  <>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-sm font-medium text-gray-600">Outward Total</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.outwardTotal || 0)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-sm font-medium text-gray-600">Inward Total</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.inwardTotal || 0)}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-sm font-medium text-gray-600">Total Amount</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalAmount)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-sm font-medium text-gray-600">Total Commission</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalCommission)}</div>
                    </div>
                  </>
                )}
                              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Data Table */}
        {activeReport === 'transaction' ? (
          <Card className="shadow-sm border-gray-200 bg-gray-100">
            <CardHeader className="pb-4">
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Transaction Report Data
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {txnReportFilteredRows.length} records found (today, sorted by time)
                  </CardDescription>
                </div>
                <div className="hidden sm:block">
                  <Input
                    placeholder="Search by..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white w-48 lg:w-72 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm placeholder:text-gray-600"
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
              ) : txnReportFilteredRows.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No data found for today. Toggle modules or check back later.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {TXN_REPORT_COLUMNS.map((column, index) => (
                          <th
                            key={index}
                            className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0 whitespace-nowrap"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {txnReportFilteredRows.map((row) => (
                        <tr key={row.key} className="hover:bg-gray-50">
                          {TXN_REPORT_COLUMNS.map((column, colIndex) => {
                            const cellValue = renderTxnReportCell(row, column);
                            return (
                              <td
                                key={colIndex}
                                className="px-3 py-3 text-sm text-gray-900 border-r border-gray-200 last:border-r-0 whitespace-nowrap"
                              >
                                {column === 'MODULE' ? (
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      row.module === 'transaction'
                                        ? 'bg-blue-100 text-blue-800'
                                        : row.module === 'accounting'
                                        ? 'bg-purple-100 text-purple-800'
                                        : row.module === 'hawala'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {cellValue}
                                  </span>
                                ) : (
                                  cellValue || ''
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
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
              
              {/* Search Input - Hidden for combo report */}
              {activeReport !== 'combo' && (
                <div className="hidden sm:block">
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white w-48 lg:w-64 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm placeholder:text-gray-600"
                  />
                </div>
              )}
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
                <p className="text-gray-500">No data found. Please try adjusting your filters.</p>
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
                        {getColumns().map((column, colIndex) => {
                          const cellValue = renderCell(transaction, column, rowIndex);
                          return (
                            <td
                              key={colIndex}
                              className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 last:border-r-0"
                            >
                              {column === 'TRANSACTION TYPE' && activeReport === 'combo' ? (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  cellValue === 'OUTWARD' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {cellValue}
                                </span>
                              ) : (
                                cellValue
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
