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

  // ----- Customer Report dedicated state -----
  const [clients, setClients] = useState<any[]>([]);
  const [clientBalances, setClientBalances] = useState<Record<string, { balance: number; credit: number; debit: number }>>({});
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientLedger, setClientLedger] = useState<any[]>([]);

  // Client ledger filter state
  const [ledgerFilterByDate, setLedgerFilterByDate] = useState(false);
  const [ledgerDateFilter, setLedgerDateFilter] = useState('');
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');
  const [ledgerIsSelectingRange, setLedgerIsSelectingRange] = useState(false);
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState('');
  const [ledgerExporting, setLedgerExporting] = useState(false);
  const [checkedRows, setCheckedRows] = useState<Set<number>>(new Set());

  // Transaction Refund Report state
  const [refundReportData, setRefundReportData] = useState<any[]>([]);
  const [refundSummary, setRefundSummary] = useState<any>(null);

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


  // Fetch all clients
  const fetchClients = async () => {
    try {
      const allClients = await transactionApi.getClients();
      setClients(allClients);
      return allClients;
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      setClients([]);
      return [];
    }
  };

  // Calculate balance for a single client from all 4 modules
  const calculateClientBalance = async (client: any) => {
    let totalCredit = 0;
    let totalDebit = 0;
    const clientName = client.name.toLowerCase();

    try {
      // 1. Transactions Module
      const [outwardTxns, inwardTxns] = await Promise.all([
        transactionApi.getTransactions({ type: 'OUTWARD', page: 1, limit: 1000 }),
        transactionApi.getTransactions({ type: 'INWARD', page: 1, limit: 1000 })
      ]);

      const allTxns = [...(outwardTxns.transactions || []), ...(inwardTxns.transactions || [])];

      allTxns.forEach(txn => {
        const receiverName = txn.receiverName?.toLowerCase() || '';
        const senderName = txn.senderName?.toLowerCase() || '';

        if (receiverName === clientName || senderName === clientName) {
          if (txn.type === 'OUTWARD') {
            // OUTWARD: Receiver gets credit (money coming to them), we collect
            totalCredit += (txn.amount || 0) + (txn.centerCommission || 0);
          } else if (txn.type === 'INWARD') {
            // INWARD: Sender pays debit (money going from them), we pay
            totalDebit += (txn.amount || 0);
          }
        }
      });

      // 2. Accounting Module
      const accEntries = await accountingApi.getAccountEntries({ page: 1, limit: 1000 });
      (accEntries.entries || []).forEach(entry => {
        const partyName = entry.party?.name?.toLowerCase() || '';
        if (partyName === clientName) {
          if (entry.type === 'INCOME') {
            totalCredit += entry.creditAmount || entry.amount || 0;
          } else if (entry.type === 'EXPENSE') {
            totalDebit += entry.debitAmount || entry.amount || 0;
          }
        }
      });

      // 3. Hawala Module
      const hawalaEntries = await getHawalaEntries({ page: 1, limit: 1000 });
      (hawalaEntries.data || []).forEach(entry => {
        const partyA = entry.partyA?.toLowerCase() || '';
        const partyB = entry.partyB?.toLowerCase() || '';

        if (partyA === clientName) {
          // Party A gives money (debit)
          totalDebit += entry.amount || 0;
        }
        if (partyB === clientName) {
          // Party B receives money (credit)
          totalCredit += entry.amount || 0;
        }
      });

      // 4. Special Entry Module
      const splEntries = await getSpecialEntries({ page: 1, limit: 1000 });
      (splEntries.data || []).forEach(entry => {
        const partyA = entry.partyA?.toLowerCase() || '';
        const partyB = entry.partyB?.toLowerCase() || '';
        const partyC = entry.partyC?.toLowerCase() || '';

        if (partyA === clientName) {
          totalDebit += entry.amountA || 0;
        }
        if (partyB === clientName) {
          totalDebit += entry.amountB || 0;
        }
        if (partyC === clientName) {
          totalCredit += entry.amountC || 0;
        }
      });

    } catch (error) {
      console.error('Error calculating balance for client:', client.name, error);
    }

    const balance = totalCredit - totalDebit;
    return { balance, credit: totalCredit, debit: totalDebit };
  };

  // Fetch all client balances
  const fetchAllClientBalances = async (clientList: any[]) => {
    const balances: Record<string, { balance: number; credit: number; debit: number }> = {};

    for (const client of clientList) {
      const balanceData = await calculateClientBalance(client);
      balances[client.id] = balanceData;
    }

    setClientBalances(balances);
    return balances;
  };

  // Fetch ledger entries for a specific client from all modules
  const fetchClientLedger = async (client: any) => {
    setLoading(true);
    const ledgerEntries: any[] = [];
    const clientName = client.name.toLowerCase();
    const clientCreatedDate = new Date(client.createdAt);

    try {
      // 1. Transactions Module
      const [outwardTxns, inwardTxns] = await Promise.all([
        transactionApi.getTransactions({ type: 'OUTWARD', page: 1, limit: 1000 }),
        transactionApi.getTransactions({ type: 'INWARD', page: 1, limit: 1000 })
      ]);

      const allTxns = [...(outwardTxns.transactions || []), ...(inwardTxns.transactions || [])];

      allTxns.forEach(txn => {
        const receiverName = txn.receiverName?.toLowerCase() || '';
        const senderName = txn.senderName?.toLowerCase() || '';
        const txnDate = new Date(txn.date);

        if ((receiverName === clientName || senderName === clientName) && txnDate >= clientCreatedDate) {
          const isCredit = txn.type === 'OUTWARD';
          const otherParty = receiverName === clientName ? senderName : receiverName;
          const descParts = [txn.type, otherParty];
          if (txn.center?.name) descParts.push(`Center: ${txn.center.name}`);
          else if (txn.centerId) descParts.push(`Center: ${txn.centerId}`);
          if (txn.amountType) descParts.push(txn.amountType);
          if (txn.remark) descParts.push(`Remark: ${txn.remark}`);
          ledgerEntries.push({
            date: txn.date,
            module: 'Transaction',
            description: descParts.join(' - '),
            debit: isCredit ? 0 : (txn.amount || 0),
            credit: isCredit ? (txn.amount || 0) + (txn.centerCommission || 0) : 0,
            balance: 0,
            reference: txn.transactionId || txn.id,
          });
        }
      });

      // 2. Accounting Module
      const accEntries = await accountingApi.getAccountEntries({ page: 1, limit: 1000 });
      (accEntries.entries || []).forEach(entry => {
        const partyName = entry.party?.name?.toLowerCase() || '';
        const entryDate = new Date(entry.date);

        if (partyName === clientName && entryDate >= clientCreatedDate) {
          const isCredit = entry.type === 'INCOME';
          const descParts = [entry.type, entry.category || 'General'];
          ledgerEntries.push({
            date: entry.date,
            module: 'Accounting',
            description: descParts.join(' - '),
            debit: isCredit ? 0 : (entry.debitAmount || entry.amount || 0),
            credit: isCredit ? (entry.creditAmount || entry.amount || 0) : 0,
            balance: 0,
            reference: entry.id,
          });
        }
      });

      // 3. Hawala Module
      const hawalaEntries = await getHawalaEntries({ page: 1, limit: 1000 });
      (hawalaEntries.data || []).forEach(entry => {
        const partyA = entry.partyA?.toLowerCase() || '';
        const partyB = entry.partyB?.toLowerCase() || '';
        const entryDate = new Date(entry.date);

        if ((partyA === clientName || partyB === clientName) && entryDate >= clientCreatedDate) {
          const isCredit = partyB === clientName;
          const descParts = [entry.partyA, 'to', entry.partyB];
          if (entry.remark) descParts.push(`Remark: ${entry.remark}`);
          ledgerEntries.push({
            date: entry.date,
            module: 'Hawala',
            description: descParts.join(' - '),
            debit: isCredit ? 0 : (entry.amount || 0),
            credit: isCredit ? (entry.amount || 0) : 0,
            balance: 0,
            reference: entry.id,
          });
        }
      });

      // 4. Special Entry Module
      const splEntries = await getSpecialEntries({ page: 1, limit: 1000 });
      (splEntries.data || []).forEach(entry => {
        const partyA = entry.partyA?.toLowerCase() || '';
        const partyB = entry.partyB?.toLowerCase() || '';
        const partyC = entry.partyC?.toLowerCase() || '';
        const entryDate = new Date(entry.date);

        if ((partyA === clientName || partyB === clientName || partyC === clientName) && entryDate >= clientCreatedDate) {
          const isCredit = partyC === clientName;
          const amount = partyA === clientName ? entry.amountA : partyB === clientName ? entry.amountB : entry.amountC;
          const descParts = ['SPL', entry.partyA, entry.partyB, entry.partyC];
          if (entry.remark) descParts.push(`Remark: ${entry.remark}`);
          ledgerEntries.push({
            date: entry.date,
            module: 'Special Entry',
            description: descParts.join(' - '),
            debit: isCredit ? 0 : (amount || 0),
            credit: isCredit ? (amount || 0) : 0,
            balance: 0,
            reference: entry.id,
          });
        }
      });

      // Sort by date and calculate running balance
      ledgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      let runningBalance = 0;
      ledgerEntries.forEach(entry => {
        runningBalance += (entry.credit || 0) - (entry.debit || 0);
        entry.balance = runningBalance;
      });

      setClientLedger(ledgerEntries);
    } catch (error) {
      console.error('Error fetching client ledger:', error);
      setClientLedger([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle client row click
  const handleClientClick = (client: any) => {
    setSelectedClient(client);
    fetchClientLedger(client);
  };

  // Close ledger modal
  const closeLedger = () => {
    setSelectedClient(null);
    setClientLedger([]);
    // Reset ledger filters
    setLedgerFilterByDate(false);
    setLedgerDateFilter('');
    setLedgerStartDate('');
    setLedgerEndDate('');
    setLedgerIsSelectingRange(false);
    setLedgerSearchTerm('');
    setCheckedRows(new Set());
  };

  // Toggle row check
  const toggleRowCheck = (index: number) => {
    const newCheckedRows = new Set(checkedRows);
    if (newCheckedRows.has(index)) {
      newCheckedRows.delete(index);
    } else {
      newCheckedRows.add(index);
    }
    setCheckedRows(newCheckedRows);
  };

  // Filter client ledger entries
  const filteredClientLedger = clientLedger.filter(entry => {
    // Search filter
    if (ledgerSearchTerm) {
      const searchLower = ledgerSearchTerm.toLowerCase();
      const matchesSearch =
        entry.module?.toLowerCase().includes(searchLower) ||
        entry.description?.toLowerCase().includes(searchLower) ||
        entry.reference?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Date filter
    if (ledgerFilterByDate) {
      const entryDate = new Date(entry.date).toISOString().split('T')[0];

      if (ledgerIsSelectingRange) {
        if (ledgerStartDate && entryDate < ledgerStartDate) return false;
        if (ledgerEndDate && entryDate > ledgerEndDate) return false;
      } else {
        if (ledgerDateFilter && entryDate !== ledgerDateFilter) return false;
      }
    }

    return true;
  });

  // Export client ledger
  const exportClientLedger = async (format: 'excel' | 'pdf') => {
    setLedgerExporting(true);
    try {
      const dataToExport = filteredClientLedger;

      if (format === 'excel') {
        // Create CSV content for Excel export
        const headers = ['Date', 'Module', 'Description', 'Debit', 'Credit', 'Balance'].join(',');
        const rows = dataToExport.map(entry => {
          const date = formatDate(entry.date);
          const module = entry.module || '-';
          const description = entry.description || '-';
          const debit = entry.debit > 0 ? entry.debit.toString() : '0';
          const credit = entry.credit > 0 ? entry.credit.toString() : '0';
          const balance = entry.balance.toString();

          return [date, module, description, debit, credit, balance].map(v => escapeCSV(v)).join(',');
        }).join('\n');

        const csvContent = `${headers}\n${rows}`;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedClient?.name || 'client'}-ledger.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Generate PDF using HTML-to-PDF approach
        generateClientLedgerPDF();
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed');
    } finally {
      setLedgerExporting(false);
    }
  };

  // Generate client ledger PDF using print window approach
  const generateClientLedgerPDF = () => {
    const clientName = selectedClient?.name || 'Client';
    const reportTitle = `${clientName} - LEDGER REPORT`;
    const dataToExport = filteredClientLedger;

    // Calculate summary
    let totalDebit = 0;
    let totalCredit = 0;
    dataToExport.forEach(entry => {
      totalDebit += entry.debit || 0;
      totalCredit += entry.credit || 0;
    });
    const netBalance = totalCredit - totalDebit;

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
          .text-right {
            text-align: right;
          }
          .text-green {
            color: #28a745;
          }
          .text-red {
            color: #dc3545;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportTitle}</h1>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p>From ${selectedClient?.createdAt ? formatDate(selectedClient.createdAt) : 'N/A'}</p>
          ${ledgerFilterByDate ? `<p>Filter Period: ${ledgerIsSelectingRange ? `${formatDate(ledgerStartDate)} to ${formatDate(ledgerEndDate)}` : formatDate(ledgerDateFilter)}</p>` : ''}
        </div>
        
        <div class="summary">
          <div class="summary-item">
            <div class="label">Total Records</div>
            <div class="value">${dataToExport.length}</div>
          </div>
          <div class="summary-item">
            <div class="label">Total Debit</div>
            <div class="value text-red">${formatCurrency(totalDebit)}</div>
          </div>
          <div class="summary-item">
            <div class="label">Total Credit</div>
            <div class="value text-green">${formatCurrency(totalCredit)}</div>
          </div>
          <div class="summary-item">
            <div class="label">Net Balance</div>
            <div class="value ${netBalance >= 0 ? 'text-green' : 'text-red'}">${formatCurrency(netBalance)}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Module</th>
              <th>Description</th>
              <th class="text-right">Debit</th>
              <th class="text-right">Credit</th>
              <th class="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${dataToExport.map(entry => `
              <tr>
                <td>${formatDate(entry.date)}</td>
                <td>${entry.module || '-'}</td>
                <td>${entry.description || '-'}</td>
                <td class="text-right ${entry.debit > 0 ? 'text-red' : ''}">${entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                <td class="text-right ${entry.credit > 0 ? 'text-green' : ''}">${entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                <td class="text-right ${entry.balance >= 0 ? 'text-green' : 'text-red'}">${formatCurrency(entry.balance)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>This is a computer-generated report. For any discrepancies, please contact the administrator.</p>
        </div>
      </body>
      </html>
    `;

    // Open in new window for printing
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
  };
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let response;

      if (activeReport === 'customer') {
        // Customer Report: Fetch clients and calculate balances
        const clientList = await fetchClients();
        await fetchAllClientBalances(clientList);
        setReportData([]); // No transaction data for customer report
        setLoading(false);
        return;
      }

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
      } else if (activeReport === 'transaction-refund') {
        // Transaction Refund Report - fetch deleted entries (defaults to last 7 days)
        console.log('=== TRANSACTION REFUND REPORT FRONTEND DEBUG ===');
        const refundData = await transactionApi.getTransactionRefundReport(); // No date parameter - uses default 7-day range
        console.log('Refund API response:', refundData);
        setRefundReportData(refundData.deletedEntries || []);
        setRefundSummary(refundData.summary || null);
        setReportData([]); // no regular data for this report
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

  const toLocalDateString = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    );
  };

  const isDateInRange = (dateStr?: string, dateFrom?: string, dateTo?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const local =
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0');

    // If no date range specified, default to today
    if (!dateFrom || !dateTo) {
      const today = todayLocalString();
      return local === today;
    }

    // Check if date is within the specified range
    return local >= dateFrom && local <= dateTo;
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

  // Get the date range from the existing filter UI
  const getTxnReportDateRange = (): { from: string; to: string } => {
    const today = todayLocalString();
    if (!filterByDate) return { from: today, to: today };
    if (isSelectingRange) {
      if (startDate && endDate) {
        return startDate <= endDate
          ? { from: startDate, to: endDate }
          : { from: endDate, to: startDate };
      }
      return { from: today, to: today };
    }
    return dateFilter ? { from: dateFilter, to: dateFilter } : { from: today, to: today };
  };

  // Fetch all 4 modules' GET APIs for the selected date range and build unified rows
  const fetchTransactionReport = async () => {
    try {
      const { from, to } = getTxnReportDateRange();

      const [txnRes, accRes, hawalaRes, splRes] = await Promise.allSettled([
        // Transactions: get both INWARD and OUTWARD, exclude CASH later
        Promise.all([
          transactionApi.getTransactions({ type: 'OUTWARD', page: 1, limit: 500 }),
          transactionApi.getTransactions({ type: 'INWARD', page: 1, limit: 500 }),
        ]),
        accountingApi.getAccountEntries({
          page: 1,
          limit: 500,
          dateFrom: from,
          dateTo: to,
        }),
        getHawalaEntries({ page: 1, limit: 500, dateFrom: from, dateTo: to }),
        getSpecialEntries({ page: 1, limit: 500, dateFrom: from, dateTo: to }),
      ]);

      const rows: TxnReportRow[] = [];

      // Transactions (only credit-affecting, exclude CASH)
      if (txnRes.status === 'fulfilled') {
        const [outward, inward] = txnRes.value;
        const all: Transaction[] = [...(outward.transactions || []), ...(inward.transactions || [])];
        all.forEach((t) => {
          if (!isDateInRange(t.date, from, to)) return;
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
          if (!isDateInRange(dateField, from, to)) return;
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
          if (!isDateInRange(h.date, from, to)) return;
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
          if (!isDateInRange(s.date, from, to)) return;
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
    'DATE',
    'TIME',
    'MODULE',
    'TYPE',
    'CENTER',
    'AMOUNT TYPE',
    'AMOUNT',
    'PARTY A',
    'AMOUNT A',
    'PARTY B',
    'AMOUNT B',
    'PARTY C',
    'AMOUNT C',
    'CATEGORY',
    'REMARK',
  ];

  const renderTxnReportCell = (row: TxnReportRow, column: string, forCSV = false) => {
    const num = (v: string) => {
      if (v === '') return '';
      const n = Number(v) || 0;
      return forCSV ? n.toString() : formatCurrency(n);
    };
    const formatDateDDMMYYYY = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    };
    switch (column) {
      case 'DATE': return formatDateDDMMYYYY(row.date);
      case 'TIME': return row.time || '';
      case 'MODULE': return row.moduleLabel;
      case 'TYPE': return row.type || '';
      case 'CENTER': return row.center || '';
      case 'AMOUNT TYPE': return row.amountType || '';
      case 'AMOUNT': return num(row.amount);
      case 'PARTY A': return row.partyA || '';
      case 'AMOUNT A': return num(row.amountA);
      case 'PARTY B': return row.partyB || '';
      case 'AMOUNT B': return num(row.amountB);
      case 'PARTY C': return row.partyC || '';
      case 'AMOUNT C': return num(row.amountC);
      case 'CATEGORY': return row.category || '';
      case 'REMARK': return row.remark || '';
      default: return '';
    }
  };

  // Helper to escape CSV values
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  // Export functionality
  const exportReport = (format: 'excel' | 'pdf') => {
    setExporting(true);
    setTimeout(() => {
      // Create CSV content for Excel export
      if (format === 'excel') {
        const headers = activeReport === 'transaction' ? TXN_REPORT_COLUMNS.join(',') : getColumns().join(',');
        const rows = (activeReport === 'transaction' ? txnReportFilteredRows : filteredData).map((row, index) => {
          const columns = activeReport === 'transaction' ? TXN_REPORT_COLUMNS : getColumns();
          return columns.map(column => {
            let value = '';
            if (activeReport === 'transaction') {
              value = renderTxnReportCell(row as TxnReportRow, column, true);
            } else {
              // Legacy reports
              const txn = row as Transaction;
              switch (column) {
                case 'TOKEN':
                  value = txn.tokenNo?.toString() || (index + 1).toString();
                  break;
                case 'DATE':
                  value = formatDate(txn.date);
                  break;
                case 'TIME':
                  // Format time to show only HH:MM
                  if (txn.time) {
                    const timeStr = txn.time.includes('T') ? new Date(txn.time).toTimeString().slice(0, 5) : txn.time.slice(0, 5);
                    value = timeStr;
                  } else {
                    value = '-';
                  }
                  break;
                case 'CENTER':
                  value = txn.center?.name || txn.centerId || '-';
                  break;
                case 'OUTWARD AMOUNT':
                  // Show amount only for outward transactions, empty for inward
                  if (txn.type === 'OUTWARD') {
                    const totalAmount = txn.amount + (txn.centerCommission || 0);
                    value = totalAmount.toString();
                  } else {
                    value = '';
                  }
                  break;
                case 'INWARD AMOUNT':
                  // Show amount only for inward transactions, empty for outward
                  if (txn.type === 'INWARD') {
                    value = txn.amount.toString();
                  } else {
                    value = '';
                  }
                  break;
                case 'AMOUNT':
                  // For inward reports, show only amount without center commission
                  if (activeReport === 'inward') {
                    value = txn.amount.toString();
                  } else {
                    // For outward and amount-type reports, show amount + center commission
                    const totalAmount = txn.amount + (txn.centerCommission || 0);
                    value = totalAmount.toString();
                  }
                  break;
                case 'AMOUNT TYPE':
                  value = txn.amountType || '-';
                  break;
                case 'OUR COMM':
                  value = (txn.bookingCommission || 0).toString();
                  break;
                case 'CUTTING COMM':
                  // For inward reports, show cutting commission
                  if (activeReport === 'inward') {
                    value = (txn.bookingCommission || 0).toString();
                  } else {
                    // For outward and amount-type reports, show our commission
                    value = (txn.bookingCommission || 0).toString();
                  }
                  break;
                case 'TRANSACTION TYPE':
                  value = txn.type || 'OUTWARD';
                  break;
                case 'RECEIVER NAME':
                  value = txn.receiverName || '-';
                  break;
                case 'SENDER NAME':
                  value = txn.senderName || '-';
                  break;
                case 'REMARKS':
                  value = txn.remark || '-';
                  break;
                default:
                  value = '-';
              }
            }
            return escapeCSV(value);
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
        if (activeReport === 'transaction') {
          generateTransactionReportPDF();
        } else {
          generatePDF();
        }
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

  // Generate PDF for Transaction Report
  const generateTransactionReportPDF = () => {
    const columns = TXN_REPORT_COLUMNS;
    const reportTitle = 'TRANSACTION REPORT';
    const { from, to } = getTxnReportDateRange();

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
          .module-transaction { background-color: #e3f2fd; }
          .module-accounting { background-color: #f3e5f5; }
          .module-hawala { background-color: #fff3e0; }
          .module-special { background-color: #e8f5e9; }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportTitle}</h1>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p>Filter Period: ${from} to ${to}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${col}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${txnReportFilteredRows.map(row => `
              <tr class="module-${row.module}">
                ${columns.map(column => {
      const displayValue = renderTxnReportCell(row, column);
      return `<td>${displayValue}</td>`;
    }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>This report was generated from the Accounting System</p>
          <p>Total Records: ${txnReportFilteredRows.length}</p>
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
      return ['CLIENT NAME', 'JAMA/UDHAR (CREDIT/DEBIT)'];
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
    if (activeReport === 'customer') {
      // Customer Report: Calculate total clients, total credit, total debit
      const totalClients = clients.length;
      const totalCredit = Object.values(clientBalances).reduce((sum, b) => sum + b.credit, 0);
      const totalDebit = Object.values(clientBalances).reduce((sum, b) => sum + b.debit, 0);

      setSummary({
        totalRecords: totalClients,
        totalAmount: totalCredit,
        totalCommission: totalDebit,
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
      } else if (activeReport === 'transaction-refund') {
        // For transaction refund report, use the refund summary data
        summary = {
          totalRecords: refundSummary?.totalDeletedRecords || 0,
          totalAmount: 0,
          totalCommission: 0,
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
  }, [reportData, searchTerm, filterByDate, dateFilter, startDate, endDate, isSelectingRange, filters.center, filters.amountType, activeReport, txnReportRows, txnModuleFilter, clients, clientBalances]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-white min-h-screen w-full">
      <div className="pt-16 space-y-4 sm:space-y-6">

        {/* Filter Section */}
        {activeReport !== 'transaction-refund' && (
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
                          className={`px-3 py-1 text-xs rounded ${!isSelectingRange && !dateFilter
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
                          className={`px-3 py-1 text-xs rounded ${isSelectingRange
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
                  disabled={exporting || (activeReport === 'transaction' ? txnReportFilteredRows.length === 0 : reportData.length === 0)}
                  variant="outline"
                  className="bg-green-600 hover:bg-green-700 text-white border border-green-300 hover:border-green-400 shadow-sm"
                >
                  {exporting ? 'Exporting...' : 'Export Excel'}
                </Button>
                <Button
                  onClick={() => exportReport('pdf')}
                  disabled={exporting || (activeReport === 'transaction' ? txnReportFilteredRows.length === 0 : reportData.length === 0)}
                  variant="outline"
                  className="bg-red-600 hover:bg-red-700 text-white border border-red-300 hover:border-red-400 shadow-sm"
                >
                  {exporting ? 'Exporting...' : 'Export PDF'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Summary */}
        {summary && activeReport !== 'transaction-refund' && (
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
                {activeReport === 'customer' ? (
                  <>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-sm font-medium text-gray-600">Total Credit (Devana Paisa)</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalAmount)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-sm font-medium text-gray-600">Total Debit (Levana Paisa)</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalCommission)}</div>
                    </div>
                  </>
                ) : activeReport === 'combo' ? (
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
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${row.module === 'transaction'
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
        ) : activeReport === 'customer' ? (
          <Card className="shadow-sm border-gray-200 bg-gray-100">
            <CardHeader className="pb-4">
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Customer Report Data
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {clients.length} clients found
                  </CardDescription>
                </div>
                <div className="hidden sm:block">
                  <Input
                    placeholder="Search clients..."
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
                  <span className="ml-2 text-gray-600">Loading client data...</span>
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No clients found.</p>
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
                      {clients
                        .filter(client => {
                          if (!searchTerm) return true;
                          const searchLower = searchTerm.toLowerCase();
                          return client.name?.toLowerCase().includes(searchLower) ||
                            client.mobileNumber?.toLowerCase().includes(searchLower);
                        })
                        .map((client) => {
                          const balanceData = clientBalances[client.id] || { balance: 0, credit: 0, debit: 0 };
                          const isPositive = balanceData.balance >= 0;
                          return (
                            <tr key={client.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleClientClick(client)}>
                              <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                                {client.name}
                              </td>
                              <td className={`px-4 py-3 text-sm font-medium border-r border-gray-200 last:border-r-0 ${isPositive ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {formatCurrency(Math.abs(balanceData.balance))}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : activeReport === 'transaction-refund' ? (
          <Card className="shadow-sm border-gray-200 bg-gray-100">
            <CardHeader className="pb-4">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Transaction Refund Report
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {refundReportData.length} deleted records found (last 7 days)
                </CardDescription>
                <p className="text-xs text-gray-500 mt-1">
                  Shows deleted entries from the last 7 days. Entries older than 7 days are automatically removed.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading refund report data...</span>
                </div>
              ) : refundReportData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No deleted records found for the selected date.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Module</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Deleted At</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Deleted By</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {refundReportData.map((entry: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm border-r border-gray-200">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${entry.moduleName === 'Transactions'
                                  ? 'bg-blue-100 text-blue-800'
                                  : entry.moduleName === 'Accounting'
                                    ? 'bg-purple-100 text-purple-800'
                                    : entry.moduleName === 'Hawala'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                }`}
                            >
                              {entry.moduleName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">{entry.moduleId}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                            {entry.deletedAt ? new Date(entry.deletedAt).toLocaleString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                            {entry.deletedByName} ({entry.deletedByEmail})
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                            {entry.details && (
                              <div className="space-y-1">
                                {entry.details.amount && (
                                  <div><span className="text-gray-500">Amount:</span> {formatCurrency(entry.details.amount)}</div>
                                )}
                                {entry.details.type && (
                                  <div><span className="text-gray-500">Type:</span> {entry.details.type}</div>
                                )}
                                {entry.details.receiverName && (
                                  <div><span className="text-gray-500">Receiver:</span> {entry.details.receiverName}</div>
                                )}
                                {entry.details.senderName && (
                                  <div><span className="text-gray-500">Sender:</span> {entry.details.senderName}</div>
                                )}
                                {entry.details.partyA && (
                                  <div><span className="text-gray-500">Party A:</span> {entry.details.partyA}</div>
                                )}
                                {entry.details.partyB && (
                                  <div><span className="text-gray-500">Party B:</span> {entry.details.partyB}</div>
                                )}
                                {entry.details.categoryName && (
                                  <div><span className="text-gray-500">Category:</span> {entry.details.categoryName}</div>
                                )}
                              </div>
                            )}
                          </td>
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
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cellValue === 'OUTWARD'
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

        {/* Client Ledger Full Screen White Board */}
        {selectedClient && (
          <>
            <style jsx global>{`
              body { overflow: hidden !important; margin: 0 !important; padding: 0 !important; }
            `}</style>
            <div className="fixed top-0 inset-0 bg-white z-[1000000000] flex flex-col overflow-hidden" style={{ marginTop: 0 }}>
              {/* Compact Header */}
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-4">
                  <h1 className="text-lg font-bold text-gray-900">{selectedClient.name} - Ledger</h1>
                  <span className="text-xs text-gray-500">From {formatDate(selectedClient.createdAt)}</span>
                </div>
                <button
                  onClick={closeLedger}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full p-2 transition-colors"
                  title="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Compact Filters - One Row */}
              <div className="border-b border-gray-200 bg-white px-4 py-2 flex-shrink-0">
                <div className="flex items-center space-x-3 flex-wrap gap-2">
                  {/* Date Filter */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="ledgerFilterByDate"
                      checked={ledgerFilterByDate}
                      onChange={(e) => {
                        setLedgerFilterByDate(e.target.checked);
                        if (e.target.checked) {
                          const today = new Date();
                          const currentDate = today.getFullYear() + '-' +
                            String(today.getMonth() + 1).padStart(2, '0') + '-' +
                            String(today.getDate()).padStart(2, '0');
                          setLedgerDateFilter(currentDate);
                          setLedgerStartDate('');
                          setLedgerEndDate('');
                          setLedgerIsSelectingRange(false);
                        } else {
                          setLedgerDateFilter('');
                          setLedgerStartDate('');
                          setLedgerEndDate('');
                          setLedgerIsSelectingRange(false);
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="ledgerFilterByDate" className="text-sm font-medium text-gray-700">Date</Label>
                    {ledgerFilterByDate && (
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setLedgerStartDate('');
                            setLedgerEndDate('');
                            setLedgerDateFilter('');
                            setLedgerIsSelectingRange(false);
                          }}
                          className={`px-2 py-1 text-xs rounded ${!ledgerIsSelectingRange && !ledgerDateFilter
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                          Single
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLedgerStartDate('');
                            setLedgerEndDate('');
                            setLedgerDateFilter('');
                            setLedgerIsSelectingRange(true);
                          }}
                          className={`px-2 py-1 text-xs rounded ${ledgerIsSelectingRange
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                          Range
                        </button>
                        {!ledgerIsSelectingRange ? (
                          <Input
                            type="date"
                            value={ledgerDateFilter}
                            onChange={(e) => setLedgerDateFilter(e.target.value)}
                            className="h-8 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white text-sm w-36"
                          />
                        ) : (
                          <div className="flex items-center space-x-1">
                            <Input
                              type="date"
                              value={ledgerStartDate}
                              onChange={(e) => setLedgerStartDate(e.target.value)}
                              className="h-8 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white text-sm w-36"
                            />                            <span className="text-gray-500 text-xs">to</span>
                            <Input
                              type="date"
                              value={ledgerEndDate}
                              onChange={(e) => setLedgerEndDate(e.target.value)}
                              className="h-8 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white text-sm w-36"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Search Input */}
                  <Input
                    placeholder="Search..."
                    value={ledgerSearchTerm}
                    onChange={(e) => setLedgerSearchTerm(e.target.value)}
                    className="bg-white h-8 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm w-48 placeholder:text-gray-600"
                  />

                  {/* Action Buttons */}
                  <Button
                    onClick={() => {
                      setLedgerFilterByDate(false);
                      setLedgerDateFilter('');
                      setLedgerStartDate('');
                      setLedgerEndDate('');
                      setLedgerIsSelectingRange(false);
                      setLedgerSearchTerm('');
                    }}
                    variant="outline"
                    className="bg-black hover:bg-gray-800 text-white border border-gray-300 hover:border-gray-400 h-8 text-sm px-3"
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={() => exportClientLedger('excel')}
                    disabled={ledgerExporting || filteredClientLedger.length === 0}
                    variant="outline"
                    className="bg-green-600 hover:bg-green-700 text-white border border-green-300 hover:border-green-400 h-8 text-sm px-3"
                  >
                    Excel
                  </Button>
                  <Button
                    onClick={() => exportClientLedger('pdf')}
                    disabled={ledgerExporting || filteredClientLedger.length === 0}
                    variant="outline"
                    className="bg-red-600 hover:bg-red-700 text-white border border-red-300 hover:border-red-400 h-8 text-sm px-3"
                  >
                    PDF
                  </Button>
                </div>
              </div>

              {/* Ledger Data Table - Full Height */}
              <div className="flex-1 overflow-auto p-4">
                <Card className="shadow-sm border-gray-200 bg-gray-100 h-full flex flex-col">
                  <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Ledger Data ({filteredClientLedger.length} records)</span>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Loading ledger...</span>
                      </div>
                    ) : filteredClientLedger.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No ledger entries found. Please try adjusting your filters.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full bg-white border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-10">Check</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Date</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Module</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Description</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Debit</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Credit</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {filteredClientLedger.map((entry, index) => (
                              <tr
                                key={index}
                                className={`hover:bg-gray-50 cursor-pointer ${checkedRows.has(index) ? 'bg-blue-50' : ''}`}
                                onClick={() => toggleRowCheck(index)}
                              >
                                <td className="px-2 py-2 border-r border-gray-200">
                                  <input
                                    type="checkbox"
                                    checked={checkedRows.has(index)}
                                    onChange={() => toggleRowCheck(index)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-200">{formatDate(entry.date)}</td>
                                <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-200">{entry.module}</td>
                                <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-200">{entry.description}</td>
                                <td className={`px-3 py-2 text-sm text-right border-r border-gray-200 ${entry.debit > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                  {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                                </td>
                                <td className={`px-3 py-2 text-sm text-right border-r border-gray-200 ${entry.credit > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                  {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                                </td>
                                <td className={`px-3 py-2 text-sm text-right font-medium ${entry.balance >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                  {formatCurrency(entry.balance)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
