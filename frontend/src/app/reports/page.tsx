'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CityTypeahead } from '@/components/ui/typeahead';
import AccountingLoader from '@/components/ui/accounting-loader';
import { transactionApi, Transaction } from '@/lib/transactions';
import { accountingApi, AccountingEntry } from '@/lib/accounting';
import { getHawalaEntries, HawalaEntry } from '@/lib/hawala';
import { getSpecialEntries, SpecialEntry } from '@/lib/specialEntry';
import { fetchAllModuleHistoryData } from '@/lib/fetch-all-history';
import {
  accountingEntryInvolvesClient,
  isPartyNameMatch,
  isTransactionReceiver,
  isTransactionSender,
  transactionInvolvesClient,
} from '@/lib/client-match';
import { compareEntriesByTimeAsc } from '@/lib/entry-sort';
import { getStoredCommissions } from '@/lib/transaction-commission-display';
import { showErrorToast, showSuccessToast, Toaster } from '@/lib/toast';
import { useBranchStore } from '@/store/branch-store';
import { ExcelExportIcon, PdfExportIcon } from '@/components/icons/export-format-icons';

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

/** UI labels for outward/inward reports (dropdown uses Booking/Cutting; ids stay outward/inward). */
function getReportDisplayName(report: ReportType): string {
  if (report === 'outward') return 'Booking';
  if (report === 'inward') return 'Cutting';
  return report.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getReportExportTitle(report: ReportType): string {
  if (report === 'outward') return 'BOOKING REPORT';
  if (report === 'inward') return 'CUTTING REPORT';
  return report.replace('-', ' ').toUpperCase() + ' REPORT';
}

interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  center: string;
  amountType: string;
  branchId: string;
  customerName: string;
  mobileNumber: string;
  status: string;
}

const BRANCH_FILTER_REPORTS: ReportType[] = ['outward', 'inward', 'combo', 'amount-type'];

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

/** Combo report: inward amount column = transaction amount + our commission. */
function getComboInwardDisplayAmount(transaction: { amount?: number; bookingCommission?: number }) {
  return (transaction.amount || 0) + (transaction.bookingCommission || 0);
}

/** Combo report: outward amount column = transaction amount + center commission. */
function getComboOutwardDisplayAmount(transaction: { amount?: number; centerCommission?: number }) {
  return (transaction.amount || 0) + (transaction.centerCommission || 0);
}

function compareComboTransactionsByTimeAsc(a: Transaction, b: Transaction) {
  return compareEntriesByTimeAsc(a, b);
}

/** Amount Type report (CASH): single amount = base + center + booking commission. */
function getAmountTypeCashDisplayAmount(transaction: {
  amount?: number;
  centerCommission?: number;
  bookingCommission?: number;
}) {
  return (
    (transaction.amount || 0) +
    (transaction.centerCommission || 0) +
    (transaction.bookingCommission || 0)
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const assignedBranches = useBranchStore((state) => state.assignedBranches);
  const setAssignedBranches = useBranchStore((state) => state.setAssignedBranches);
  const [activeReport, setActiveReport] = useState<ReportType>('customer');
  const [reportData, setReportData] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Default to Customer Report and sync header; honour dashboard shortcut via localStorage
  useEffect(() => {
    const savedActiveReport = localStorage.getItem('activeReport');
    if (savedActiveReport === 'customer') {
      localStorage.removeItem('activeReport');
    }
    setActiveReport('customer');
    window.dispatchEvent(new CustomEvent('setActiveReport', { detail: 'customer' }));
  }, []);

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
      branchId: '',
      customerName: '',
      mobileNumber: '',
      status: '',
    };
  });


  useEffect(() => {
    if (!user) return;
    const fromUser = user.branches ?? (user.branch ? [user.branch] : []);
    if (fromUser.length > 0) {
      setAssignedBranches(fromUser);
    }
  }, [user, setAssignedBranches]);

  useEffect(() => {
    if (assignedBranches.length === 0) return;
    setFilters((prev) => ({
      ...prev,
      branchId: prev.branchId && assignedBranches.some((b) => b.id === prev.branchId)
        ? prev.branchId
        : assignedBranches[0].id,
    }));
  }, [assignedBranches]);

  const getReportBranchOptions = () => {
    if (!BRANCH_FILTER_REPORTS.includes(activeReport)) return undefined;
    const branchId =
      filters.branchId ||
      assignedBranches[0]?.id ||
      user?.branches?.[0]?.id ||
      user?.branch?.id ||
      '';
    return branchId ? { branchId } : undefined;
  };


  // Fetch all clients
  const fetchClients = async () => {
    try {
      const allClients = await transactionApi.getClients();
      setClients(allClients);
      return allClients;
    } catch (error) {
      setClients([]);
      return [];
    }
  };

  // Fetch all client balances - OPTIMIZED: Batch fetch all data upfront instead of N+1 queries
  const fetchAllClientBalances = async (clientList: any[]) => {
    const balances: Record<string, { balance: number; credit: number; debit: number }> = {};

    try {
      const {
        transactions: allTxns,
        accounting: allAccEntries,
        hawala: allHawalaEntries,
        specialEntry: allSplEntries,
      } = await fetchAllModuleHistoryData();

      // Calculate balances for all clients in memory
      for (const client of clientList) {
        const clientRef = { id: client.id, name: client.name };
        let totalCredit = 0;
        let totalDebit = 0;

        // Process transactions
        allTxns.forEach(txn => {
          if (!transactionInvolvesClient(txn, clientRef)) return;

          if (txn.type === 'OUTWARD') {
            if (txn.amountType === 'CREDIT' && isTransactionSender(txn, clientRef)) {
              totalDebit += (txn.amount || 0) + (txn.commission || 0);
            } else {
              totalCredit += (txn.amount || 0) + (txn.centerCommission || 0);
            }
          } else if (txn.type === 'INWARD') {
            if (txn.amountType === 'CREDIT' && isTransactionReceiver(txn, clientRef)) {
              totalCredit += (txn.amount || 0);
            } else {
              totalDebit += (txn.amount || 0);
            }
          }
        });

        // Process accounting entries
        allAccEntries.forEach(entry => {
          if (!accountingEntryInvolvesClient(entry, clientRef)) return;

          if (entry.type === 'INCOME') {
            totalCredit += entry.creditAmount || entry.amount || 0;
          } else if (entry.type === 'EXPENSE') {
            totalDebit += entry.debitAmount || entry.amount || 0;
          }
        });

        // Process hawala entries
        allHawalaEntries.forEach(entry => {
          if (isPartyNameMatch(entry.partyA, clientRef)) {
            totalCredit += entry.amount || 0;
          }
          if (isPartyNameMatch(entry.partyB, clientRef)) {
            totalDebit += entry.amount || 0;
          }
        });

        // Process special entries
        allSplEntries.forEach(entry => {
          if (isPartyNameMatch(entry.partyA, clientRef)) {
            totalDebit += entry.amountA || 0;
          }
          if (isPartyNameMatch(entry.partyB, clientRef)) {
            totalCredit += entry.amountB || 0;
          }
          if (isPartyNameMatch(entry.partyC, clientRef)) {
            const amountC = entry.amountC || 0;
            if (amountC > 0) {
              totalCredit += amountC;
            } else {
              totalDebit += Math.abs(amountC);
            }
          }
        });

        balances[client.id] = { balance: totalCredit - totalDebit, credit: totalCredit, debit: totalDebit };
      }

      setClientBalances(balances);
      return balances;
    } catch (error) {
      setClientBalances({});
      return {};
    }
  };

  // Open client ledger in a new tab so the user can keep working in this tab
  const handleClientClick = (client: { id: string; name?: string }) => {
    const url = `/reports/client-ledger?clientId=${encodeURIComponent(client.id)}`;
    // Do not pass noopener/noreferrer — those make window.open return null even when the tab opens
    const opened = window.open(url, '_blank');
    if (!opened) {
      showErrorToast('Please allow popups to open the client ledger in a new tab.');
      return;
    }
    const label = client.name?.trim() || 'Client';
    showSuccessToast(`${label} ledger opened in a new tab`);
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
        const branchOptions = getReportBranchOptions();
        // Fetch both inward and outward transactions for combo report
        const [inwardResponse, outwardResponse] = await Promise.all([
          transactionApi.getTransactions({
            type: 'INWARD',
            page: currentPage,
            limit: 100,
          }, branchOptions),
          transactionApi.getTransactions({
            type: 'OUTWARD',
            page: currentPage,
            limit: 100,
          }, branchOptions)
        ]);

        const allTransactions = [...inwardResponse.transactions, ...outwardResponse.transactions];

        setReportData(allTransactions);
      } else if (activeReport === 'transaction') {
        // Transaction Report (#5): aggregate from 4 modules (today only)
        await fetchTransactionReport();
        setReportData([]); // unified table renders from txnReportRows
      } else if (activeReport === 'transaction-refund') {
        // Transaction Refund Report - fetch deleted entries (defaults to last 7 days)
        const refundData = await transactionApi.getTransactionRefundReport(); // No date parameter - uses default 7-day range
        setRefundReportData(refundData.deletedEntries || []);
        setRefundSummary(refundData.summary || null);
        setReportData([]); // no regular data for this report
      } else {
        // Fetch regular transaction data for other reports
        response = await transactionApi.getTransactions({
          type: activeReport === 'inward' ? 'INWARD' : 'OUTWARD',
          search: searchTerm,
          page: currentPage,
          limit: 10000, // High limit to ensure all entries are fetched
          ...(activeReport === 'amount-type' && filters.amountType && filters.amountType.trim() && { amountType: filters.amountType })
        }, getReportBranchOptions());

        setReportData(response.transactions);
      }

      // Calculate summary will be done in filteredData useEffect
    } catch (error) {
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
          // OUTWARD CREDIT (client-affecting): amount + full commission; other OUTWARD: amount + center commission
          const totalAmt =
            t.type === 'OUTWARD'
              ? at === 'CREDIT'
                ? (t.amount || 0) + (t.commission || 0)
                : (t.amount || 0) + (t.centerCommission || 0)
              : (t.amount || 0);
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
        const rows = (activeReport === 'transaction' ? txnReportFilteredRows : reportTableData).map((row, index) => {
          const columns = activeReport === 'transaction' ? TXN_REPORT_COLUMNS : getColumns();
          return columns.map(column => {
            let value = '';
            if (activeReport === 'transaction') {
              value = renderTxnReportCell(row as TxnReportRow, column, true);
            } else {
              // Legacy reports
              const txn = row as Transaction;
              const stored = getStoredCommissions(txn);
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
                  if (txn.type === 'OUTWARD') {
                    value = getComboOutwardDisplayAmount(txn).toString();
                  } else {
                    value = '';
                  }
                  break;
                case 'INWARD AMOUNT':
                  // Inward: amount + our commission (auto or manual)
                  if (txn.type === 'INWARD') {
                    value = getComboInwardDisplayAmount(txn).toString();
                  } else {
                    value = '';
                  }
                  break;
                case 'BALANCE':
                  if (activeReport === 'combo') {
                    const balance = comboRunningBalances[index];
                    value = balance !== undefined ? balance.toString() : '';
                  } else {
                    value = '';
                  }
                  break;
                case 'AMOUNT':
                  if (activeReport === 'inward') {
                    value = txn.amount.toString();
                  } else if (activeReport === 'outward') {
                    value = getComboOutwardDisplayAmount(txn).toString();
                  } else if (activeReport === 'amount-type' && filters.amountType?.toUpperCase() === 'CASH') {
                    value = getAmountTypeCashDisplayAmount(txn).toString();
                  } else {
                    value = txn.amount.toString();
                  }
                  break;
                case 'AMOUNT TYPE':
                  value = txn.amountType || '-';
                  break;
                case 'COMMISSION':
                  value = stored.commission.toString();
                  break;
                case 'CENTER COMM':
                  value = stored.centerCommission.toString();
                  break;
                case 'OUR COMM':
                  value = stored.bookingCommission.toString();
                  break;
                case 'CUTTING COMM':
                  value = stored.bookingCommission.toString();
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
    const reportTitle = getReportExportTitle(activeReport);

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
            <div class="value">${summary.totalRecords > 0 ? formatCurrency(summary.totalAmount / summary.totalRecords) : 'â‚¹0.00'}</div>
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
            ${reportTableData.map((transaction, index) => `
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
      branchId: assignedBranches[0]?.id || user?.branches?.[0]?.id || user?.branch?.id || '',
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

  // Combo report: chronological order with running balance
  const { comboDisplayData, comboRunningBalances } = useMemo(() => {
    if (activeReport !== 'combo') {
      return { comboDisplayData: [] as Transaction[], comboRunningBalances: [] as number[] };
    }

    const comboDisplayData = [...filteredData].sort(compareComboTransactionsByTimeAsc);
    let runningBalance = 0;
    const comboRunningBalances = comboDisplayData.map((transaction) => {
      if (transaction.type === 'OUTWARD') {
        runningBalance += getComboOutwardDisplayAmount(transaction);
      } else if (transaction.type === 'INWARD') {
        runningBalance -= getComboInwardDisplayAmount(transaction);
      }
      return runningBalance;
    });

    return { comboDisplayData, comboRunningBalances };
  }, [activeReport, filteredData]);

  const reportTableData = useMemo(() => {
    if (activeReport === 'combo') return comboDisplayData;
    if (BRANCH_FILTER_REPORTS.includes(activeReport)) {
      return [...filteredData].sort(compareComboTransactionsByTimeAsc);
    }
    return filteredData;
  }, [activeReport, comboDisplayData, filteredData]);

  // Get columns based on report type (for outward and inward transactions)
  const getColumns = () => {
    if (activeReport === 'combo') {
      return ['TRANSACTION TYPE', 'TOKEN', 'DATE', 'TIME', 'CENTER', 'OUTWARD AMOUNT', 'INWARD AMOUNT', 'BALANCE'];
    }
    if (activeReport === 'outward') {
      return ['TOKEN', 'DATE', 'TIME', 'CENTER', 'AMOUNT', 'AMOUNT TYPE', 'OUR COMM', 'RECEIVER NAME', 'SENDER NAME', 'REMARKS'];
    }
    if (activeReport === 'inward') {
      return ['TOKEN', 'DATE', 'TIME', 'CENTER', 'AMOUNT', 'AMOUNT TYPE', 'CUTTING COMM', 'SENDER NAME', 'RECEIVER NAME', 'REMARKS'];
    }
    if (activeReport === 'amount-type') {
      const isCashAmountType = filters.amountType?.toUpperCase() === 'CASH';
      if (isCashAmountType) {
        return ['TOKEN', 'DATE', 'TIME', 'CENTER', 'AMOUNT', 'AMOUNT TYPE', 'RECEIVER NAME', 'SENDER NAME', 'REMARKS'];
      }
      return ['TOKEN', 'DATE', 'TIME', 'CENTER', 'AMOUNT', 'AMOUNT TYPE', 'COMMISSION', 'CENTER COMM', 'OUR COMM', 'RECEIVER NAME', 'SENDER NAME', 'REMARKS'];
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
    const stored = getStoredCommissions(transaction);

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
          return formatCurrency(getComboOutwardDisplayAmount(transaction));
        }
        return '-';
      case 'INWARD AMOUNT':
        // Inward: amount + our commission (auto or manual)
        if (transaction.type === 'INWARD') {
          return formatCurrency(getComboInwardDisplayAmount(transaction));
        }
        return '-';
      case 'BALANCE':
        if (activeReport === 'combo') {
          const balance = comboRunningBalances[index];
          return balance !== undefined ? formatCurrency(balance) : '-';
        }
        return '-';
      case 'AMOUNT':
        if (activeReport === 'inward') {
          return formatCurrency(transaction.amount);
        }
        if (activeReport === 'outward') {
          return formatCurrency(getComboOutwardDisplayAmount(transaction));
        }
        // Amount Type + CASH: combined amount (base + center + booking commission)
        if (activeReport === 'amount-type' && filters.amountType?.toUpperCase() === 'CASH') {
          return formatCurrency(getAmountTypeCashDisplayAmount(transaction));
        }
        return formatCurrency(transaction.amount);
      case 'AMOUNT TYPE':
        return transaction.amountType || '-';
      case 'COMMISSION':
        return formatCurrency(stored.commission);
      case 'CENTER COMM':
        return formatCurrency(stored.centerCommission);
      case 'OUR COMM':
        return formatCurrency(stored.bookingCommission);
      case 'CUTTING COMM':
        return formatCurrency(stored.bookingCommission);
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
          .reduce((sum, item) => sum + getComboInwardDisplayAmount(item), 0);

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
      } else if (activeReport === 'amount-type' && filters.amountType?.toUpperCase() === 'CASH') {
        summary = {
          totalRecords: filteredData.length,
          totalAmount: filteredData.reduce(
            (sum, item) => sum + getAmountTypeCashDisplayAmount(item),
            0
          ),
          totalCommission: 0,
        };
      } else {
        // For transaction report and other reports
        if (activeReport === 'inward') {
          // For inward report, don't include center commission in total amount
          summary = {
            totalRecords: filteredData.length,
            totalAmount: filteredData.reduce((sum, item) => sum + (item.amount || 0), 0),
            totalCommission: filteredData.reduce((sum, item) => sum + (item.bookingCommission || 0), 0),
          };
        } else {
          summary = {
            totalRecords: filteredData.length,
            totalAmount: filteredData.reduce((sum, item) => sum + (item.amount || 0) + (item.centerCommission || 0), 0),
            totalCommission: filteredData.reduce((sum, item) => sum + (item.bookingCommission || 0), 0),
          };
        }
      }

      setSummary(summary);
    }
  }, [reportData, searchTerm, filterByDate, dateFilter, startDate, endDate, isSelectingRange, filters.center, filters.amountType, activeReport, txnReportRows, txnModuleFilter, clients, clientBalances]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
    <div className="bg-white min-h-screen w-full">
      <div className="pt-16 space-y-4 sm:space-y-6">

        {/* Filter Section */}
        {activeReport !== 'transaction-refund' && (
          <Card className={`shadow-lg border-orange-200/40 bg-gradient-to-br from-white via-orange-50/95 to-orange-100/80 backdrop-blur-md relative overflow-visible ${
            activeReport === 'outward' || activeReport === 'inward' ? 'z-30' : 'z-10'
          }`}>
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
                              ? 'bg-orange-600 text-white'
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
                              ? 'bg-orange-600 text-white'
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

                {/* Branch Filter - Booking, Cutting, Combo, Amount Type */}
                {BRANCH_FILTER_REPORTS.includes(activeReport) && assignedBranches.length > 0 && (
                  <div>
                    <Label htmlFor="reportBranch" className="text-sm font-medium text-gray-700">Branch</Label>
                    {assignedBranches.length === 1 ? (
                      <div className="mt-1 flex h-10 items-center rounded-md border border-gray-300 bg-gray-50 px-3 text-sm font-medium text-gray-900">
                        {assignedBranches[0].name} ({assignedBranches[0].code})
                      </div>
                    ) : (
                      <select
                        id="reportBranch"
                        value={filters.branchId || assignedBranches[0]?.id || ''}
                        onChange={(e) => setFilters({ ...filters, branchId: e.target.value })}
                        className="mt-1 w-full h-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-black text-sm"
                      >
                        {assignedBranches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name} ({branch.code})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Center Filter - For Outward/Inward reports */}
                {(activeReport === 'outward' || activeReport === 'inward') && (
                  <div className="relative z-50">
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
                  className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
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
                <button
                  type="button"
                  onClick={() => exportReport('excel')}
                  disabled={exporting || (activeReport === 'transaction' ? txnReportFilteredRows.length === 0 : reportData.length === 0)}
                  className="relative overflow-hidden flex items-center justify-center rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-green-400/60 hover:text-white hover:from-green-400 hover:via-green-500 hover:to-green-600 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100 before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent,rgba(34,197,94,0.25),transparent)] before:translate-x-[-150%] hover:before:translate-x-[150%] before:transition-transform before:duration-1000 p-2.5"
                  title={exporting ? 'Exporting...' : 'Export Excel'}
                  aria-label="Export Excel"
                >
                  <ExcelExportIcon className="h-6 w-6 relative z-10" />
                </button>
                <button
                  type="button"
                  onClick={() => exportReport('pdf')}
                  disabled={exporting || (activeReport === 'transaction' ? txnReportFilteredRows.length === 0 : reportData.length === 0)}
                  className="relative overflow-hidden flex items-center justify-center rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-red-400/60 hover:text-white hover:from-red-400 hover:via-red-500 hover:to-red-600 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100 before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent,rgba(239,68,68,0.25),transparent)] before:translate-x-[-150%] hover:before:translate-x-[150%] before:transition-transform before:duration-1000 p-2.5"
                  title={exporting ? 'Exporting...' : 'Export PDF'}
                  aria-label="Export PDF"
                >
                  <PdfExportIcon className="h-6 w-6 relative z-10" />
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Summary */}
        {summary && activeReport !== 'transaction-refund' && (
          <Card className={`shadow-lg border-orange-200/40 bg-gradient-to-br from-white via-orange-50/95 to-orange-100/80 backdrop-blur-md relative ${
            activeReport === 'outward' || activeReport === 'inward' ? 'z-0' : 'z-10'
          }`}>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Report Summary
              </CardTitle>
              <CardDescription className="text-gray-600">
                Summary of the generated {getReportDisplayName(activeReport).toLowerCase()} report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-white to-orange-50/80 p-4 rounded-lg border border-orange-200/60">
                  <div className="text-sm font-medium text-gray-600">Total Records</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{summary.totalRecords}</div>
                </div>
                {activeReport === 'customer' ? null : activeReport === 'combo' ? (
                  <>
                    <div className="bg-gradient-to-br from-white to-orange-50/80 p-4 rounded-lg border border-orange-200/60">
                      <div className="text-sm font-medium text-gray-600">Outward Total</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.outwardTotal || 0)}</div>
                    </div>
                    <div className="bg-gradient-to-br from-white to-orange-50/80 p-4 rounded-lg border border-orange-200/60">
                      <div className="text-sm font-medium text-gray-600">Inward Total</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.inwardTotal || 0)}</div>
                    </div>
                  </>
                ) : activeReport === 'amount-type' && filters.amountType?.toUpperCase() === 'CASH' ? (
                  <div className="bg-gradient-to-br from-white to-orange-50/80 p-4 rounded-lg border border-orange-200/60">
                    <div className="text-sm font-medium text-gray-600">Total Amount</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalAmount)}</div>
                  </div>
                ) : activeReport === 'inward' ? (
                  <>
                    <div className="bg-gradient-to-br from-white to-orange-50/80 p-4 rounded-lg border border-orange-200/60">
                      <div className="text-sm font-medium text-gray-600">Amount + Commission</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalAmount + summary.totalCommission)}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-gradient-to-br from-white to-orange-50/80 p-4 rounded-lg border border-orange-200/60">
                      <div className="text-sm font-medium text-gray-600">Total Amount</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalAmount)}</div>
                    </div>
                    <div className="bg-gradient-to-br from-white to-orange-50/80 p-4 rounded-lg border border-orange-200/60">
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
          <Card className="shadow-lg border-orange-200/40 bg-gradient-to-br from-white via-orange-50/95 to-orange-100/80 backdrop-blur-md relative z-10">
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
                <AccountingLoader message="Loading report data..." />
              ) : txnReportFilteredRows.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No data found for today. Toggle modules or check back later.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border border-orange-200/60 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 text-white">
                        {TXN_REPORT_COLUMNS.map((column, index) => (
                          <th
                            key={index}
                            className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-orange-500/30 last:border-r-0 whitespace-nowrap"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {txnReportFilteredRows.map((row, index) => (
                        <tr key={row.key} className={`border-b transition-colors ${index % 2 === 0 ? 'bg-white/90 hover:bg-orange-50/70' : 'bg-orange-50/45 hover:bg-orange-100/55'}`}>
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
          <Card className="shadow-lg border-orange-200/40 bg-gradient-to-br from-white via-orange-50/95 to-orange-100/80 backdrop-blur-md relative z-10">
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
                <AccountingLoader message="Loading client data..." />
              ) : clients.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No clients found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border border-orange-200/60 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 text-white">
                        {getColumns().map((column, index) => (
                          <th
                            key={index}
                            className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-orange-500/30 last:border-r-0"
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
                        .sort((a, b) => {
                          const balanceA = clientBalances[a.id]?.balance || 0;
                          const balanceB = clientBalances[b.id]?.balance || 0;
                          return balanceA - balanceB; // Ascending order: most negative first
                        })
                        .map((client, index) => {
                          const balanceData = clientBalances[client.id] || { balance: 0, credit: 0, debit: 0 };
                          const isPositive = balanceData.balance >= 0;
                          return (
                            <tr key={client.id} className={`border-b cursor-pointer transition-colors ${index % 2 === 0 ? 'bg-white/90 hover:bg-orange-50/70' : 'bg-orange-50/45 hover:bg-orange-100/55'}`} onClick={() => handleClientClick(client)}>
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
          <Card className="shadow-lg border-orange-200/40 bg-gradient-to-br from-white via-orange-50/95 to-orange-100/80 backdrop-blur-md relative z-10">
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
                <AccountingLoader message="Loading refund report data..." />
              ) : refundReportData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No deleted records found for the selected date.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border border-orange-200/60 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 text-white">
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-orange-500/30">Module</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-orange-500/30">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-orange-500/30">Deleted At</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-orange-500/30">Deleted By</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-orange-500/30">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {refundReportData.map((entry: any, index: number) => (
                        <tr key={index} className={`border-b transition-colors ${index % 2 === 0 ? 'bg-white/90 hover:bg-orange-50/70' : 'bg-orange-50/45 hover:bg-orange-100/55'}`}>
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
          <Card className="shadow-lg border-orange-200/40 bg-gradient-to-br from-white via-orange-50/95 to-orange-100/80 backdrop-blur-md relative z-10">
            <CardHeader className="pb-4">
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {getReportDisplayName(activeReport)} Report Data
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
                  <table className="w-full border border-orange-200/60 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 text-white">
                        {getColumns().map((column, index) => (
                          <th
                            key={index}
                            className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-orange-500/30 last:border-r-0"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportTableData.map((transaction, rowIndex) => (
                        <tr key={rowIndex} className={`border-b transition-colors ${rowIndex % 2 === 0 ? 'bg-white/90 hover:bg-orange-50/70' : 'bg-orange-50/45 hover:bg-orange-100/55'}`}>
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
                                ) : column === 'BALANCE' && activeReport === 'combo' ? (
                                  <span className={`font-semibold ${
                                    (comboRunningBalances[rowIndex] ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
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
    <Toaster />
    </>
  );
}
