'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import AccountingLoader from '@/components/ui/accounting-loader';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ClientLedgerClient,
  ClientLedgerEntry,
  fetchClientLedgerEntries,
} from '@/lib/client-ledger';
import { showErrorToast, Toaster } from '@/lib/toast';
import ClientLedgerEditModal from '@/components/reports/client-ledger-edit-modal';
import UpdatedEntryBadge from '@/components/reports/updated-entry-badge';
import { Edit } from 'lucide-react';

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

interface ClientLedgerViewProps {
  client: ClientLedgerClient;
}

function renderLedgerDescription(description: string) {
  const remarkMarker = 'Remark: ';
  const remarkIndex = description.indexOf(remarkMarker);
  if (remarkIndex === -1) {
    return description;
  }

  return (
    <>
      {description.slice(0, remarkIndex)}
      <span className="font-bold text-orange-900 bg-orange-50 px-1.5 py-0.5 rounded-md">
        {description.slice(remarkIndex)}
      </span>
    </>
  );
}

export default function ClientLedgerView({ client }: ClientLedgerViewProps) {
  const [clientLedger, setClientLedger] = useState<ClientLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [ledgerFilterByDate, setLedgerFilterByDate] = useState(false);
  const [ledgerDateFilter, setLedgerDateFilter] = useState('');
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');
  const [ledgerIsSelectingRange, setLedgerIsSelectingRange] = useState(false);
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState('');
  const [ledgerExporting, setLedgerExporting] = useState(false);
  const [checkedRows, setCheckedRows] = useState<Set<number>>(new Set());
  const [editingEntry, setEditingEntry] = useState<ClientLedgerEntry | null>(null);

  const reloadLedger = () => {
    setLoading(true);
    fetchClientLedgerEntries(client)
      .then((entries) => setClientLedger(entries))
      .catch(() => setClientLedger([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchClientLedgerEntries(client)
      .then((entries) => {
        if (!cancelled) setClientLedger(entries);
      })
      .catch(() => {
        if (!cancelled) setClientLedger([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client.id, client.name]);

  const toggleRowCheck = (index: number) => {
    const newCheckedRows = new Set(checkedRows);
    if (newCheckedRows.has(index)) {
      newCheckedRows.delete(index);
    } else {
      newCheckedRows.add(index);
    }
    setCheckedRows(newCheckedRows);
  };

  const filteredClientLedger = clientLedger.filter((entry) => {
    if (ledgerSearchTerm) {
      const searchLower = ledgerSearchTerm.toLowerCase();
      const matchesSearch =
        entry.module?.toLowerCase().includes(searchLower) ||
        entry.description?.toLowerCase().includes(searchLower) ||
        entry.reference?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

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

  const groupedLedgerEntries = (() => {
    const groups: Array<{
      date: string;
      openingBalance: number;
      entries: ClientLedgerEntry[];
      dayExpenseTotal: number;
      dayIncomeTotal: number;
    }> = [];

    if (filteredClientLedger.length === 0) return groups;

    const getIndianDateKey = (dateStr: string) => {
      const entryDate = new Date(dateStr);
      const indianDate = new Date(entryDate.getTime() + 5.5 * 60 * 60 * 1000);
      return indianDate.toISOString().split('T')[0];
    };

    const dateGroups: Record<string, ClientLedgerEntry[]> = {};
    filteredClientLedger.forEach((entry) => {
      const dateKey = getIndianDateKey(entry.date);
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = [];
      }
      dateGroups[dateKey].push(entry);
    });

    const sortedDatesAsc = Object.keys(dateGroups).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    const allEntriesSorted = [...clientLedger].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const balanceMap: Record<string, number> = {};

    sortedDatesAsc.forEach((date) => {
      balanceMap[date] = allEntriesSorted
        .filter((entry) => getIndianDateKey(entry.date) < date)
        .reduce((sum, entry) => sum + (entry.credit || 0) - (entry.debit || 0), 0);
    });

    const sortedDatesDesc = Object.keys(dateGroups).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    sortedDatesDesc.forEach((date) => {
      const entries = dateGroups[date];
      groups.push({
        date,
        openingBalance: balanceMap[date],
        entries,
        dayExpenseTotal: entries.reduce((sum, e) => sum + (e.debit || 0), 0),
        dayIncomeTotal: entries.reduce((sum, e) => sum + (e.credit || 0), 0),
      });
    });

    return groups;
  })();

  const generateClientLedgerPDF = () => {
    const reportTitle = `${client.name} - LEDGER REPORT`;
    const dataToExport = filteredClientLedger;

    let totalDebit = 0;
    let totalCredit = 0;
    dataToExport.forEach((entry) => {
      totalDebit += entry.debit || 0;
      totalCredit += entry.credit || 0;
    });
    const netBalance = totalCredit - totalDebit;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
          .header p { margin: 5px 0 0 0; color: #666; font-size: 14px; }
          .summary { margin-bottom: 30px; display: flex; justify-content: space-around; background: #f5f5f5; padding: 15px; border-radius: 5px; }
          .summary-item { text-align: center; }
          .summary-item .label { font-size: 12px; color: #666; margin-bottom: 5px; }
          .summary-item .value { font-size: 18px; font-weight: bold; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; font-size: 12px; text-transform: uppercase; }
          td { font-size: 12px; }
          .text-right { text-align: right; }
          .text-green { color: #28a745; }
          .text-red { color: #dc3545; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportTitle}</h1>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p>From ${client.createdAt ? formatDate(client.createdAt) : 'N/A'}</p>
          ${ledgerFilterByDate ? `<p>Filter Period: ${ledgerIsSelectingRange ? `${formatDate(ledgerStartDate)} to ${formatDate(ledgerEndDate)}` : formatDate(ledgerDateFilter)}</p>` : ''}
        </div>
        <div class="summary">
          <div class="summary-item"><div class="label">Total Records</div><div class="value">${dataToExport.length}</div></div>
          <div class="summary-item"><div class="label">Total Debit</div><div class="value text-red">${formatCurrency(totalDebit)}</div></div>
          <div class="summary-item"><div class="label">Total Credit</div><div class="value text-green">${formatCurrency(totalCredit)}</div></div>
          <div class="summary-item"><div class="label">Net Balance</div><div class="value ${netBalance >= 0 ? 'text-green' : 'text-red'}">${formatCurrency(netBalance)}</div></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Module</th><th>Description</th>
              <th class="text-right">Expense</th><th class="text-right">Income</th><th class="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${dataToExport
              .map(
                (entry) => `
              <tr>
                <td>${formatDate(entry.date)}</td>
                <td>${entry.module || '-'}</td>
                <td>${entry.description || '-'}</td>
                <td class="text-right ${entry.debit > 0 ? 'text-red' : ''}">${entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                <td class="text-right ${entry.credit > 0 ? 'text-green' : ''}">${entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                <td class="text-right ${entry.balance >= 0 ? 'text-green' : 'text-red'}">${formatCurrency(entry.balance)}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>This is a computer-generated report. For any discrepancies, please contact the administrator.</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    } else {
      showErrorToast('Please allow popups to generate PDF');
    }
  };

  const exportClientLedger = async (format: 'excel' | 'pdf') => {
    setLedgerExporting(true);
    try {
      if (format === 'excel') {
        const headers = ['Date', 'Module', 'Description', 'Debit', 'Credit', 'Balance'].join(',');
        const rows = filteredClientLedger
          .map((entry) => {
            const row = [
              formatDate(entry.date),
              entry.module || '-',
              entry.description || '-',
              entry.debit > 0 ? entry.debit.toString() : '0',
              entry.credit > 0 ? entry.credit.toString() : '0',
              entry.balance.toString(),
            ];
            return row.map((v) => escapeCSV(v)).join(',');
          })
          .join('\n');

        const csvContent = `${headers}\n${rows}`;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${client.name || 'client'}-ledger.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        generateClientLedgerPDF();
      }
    } catch {
      showErrorToast('Export failed');
    } finally {
      setLedgerExporting(false);
    }
  };

  const handleClose = () => {
    window.close();
  };

  return (
    <>
      <style jsx global>{`
        body {
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      `}</style>
      <div
        className="fixed top-0 inset-0 bg-white z-[1000000000] flex flex-col overflow-hidden"
        style={{ marginTop: 0 }}
      >
        <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 via-blue-50 to-gray-50 px-4 py-2 flex items-center justify-between flex-shrink-0 relative">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-bold text-gray-900">{client.name} - Ledger</h1>
            <span className="text-xs text-gray-500">
              From{' '}
              {client.createdAt
                ? formatDate(client.createdAt)
                : filteredClientLedger.length > 0
                  ? formatDate(filteredClientLedger[0].date)
                  : 'N/A'}
            </span>
            {filteredClientLedger.length > 0 && (
              <div
                className={`px-6 py-1 rounded-lg font-bold text-xl shadow-lg border-2 ${
                  filteredClientLedger[filteredClientLedger.length - 1].balance >= 0
                    ? 'bg-gradient-to-r from-green-400 to-green-600 border-green-700 text-white'
                    : 'bg-gradient-to-r from-red-400 to-red-600 border-red-700 text-white'
                }`}
              >
                Balance:{' '}
                {formatCurrency(filteredClientLedger[filteredClientLedger.length - 1].balance)}
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full p-2 transition-colors"
            title="Close tab"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="border-b border-gray-200 bg-white px-4 py-2 flex-shrink-0">
          <div className="flex items-center space-x-3 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ledgerFilterByDate"
                checked={ledgerFilterByDate}
                onChange={(e) => {
                  setLedgerFilterByDate(e.target.checked);
                  if (e.target.checked) {
                    const today = new Date();
                    const currentDate =
                      today.getFullYear() +
                      '-' +
                      String(today.getMonth() + 1).padStart(2, '0') +
                      '-' +
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
              <Label htmlFor="ledgerFilterByDate" className="text-sm font-medium text-gray-700">
                Date
              </Label>
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
                    className={`px-2 py-1 text-xs rounded ${
                      !ledgerIsSelectingRange && !ledgerDateFilter
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
                    className={`px-2 py-1 text-xs rounded ${
                      ledgerIsSelectingRange
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
                      />
                      <span className="text-gray-500 text-xs">to</span>
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

            <Input
              placeholder="Search..."
              value={ledgerSearchTerm}
              onChange={(e) => setLedgerSearchTerm(e.target.value)}
              className="bg-white h-8 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm w-48 placeholder:text-gray-600"
            />

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

        <div className="flex-1 overflow-auto p-4">
          <Card className="shadow-lg border-gray-200/50 bg-gradient-to-br from-gray-100/90 via-blue-100/80 to-purple-100/75 backdrop-blur-md relative z-10 h-full flex flex-col">
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                Ledger Data ({filteredClientLedger.length} records)
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              {loading ? (
                <AccountingLoader message="Loading ledger..." />
              ) : filteredClientLedger.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No ledger entries found. Please try adjusting your filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-10">
                          Check
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                          Time
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                          Module
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                          Description
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                          Expense
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                          Income
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Balance
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Edit
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedLedgerEntries.map((group, groupIndex) => (
                        <React.Fragment key={`group-${groupIndex}`}>
                          <tr
                            className={`${group.openingBalance >= 0 ? 'bg-green-300 border-b-2 border-green-200' : 'bg-red-300 border-b-2 border-red-200'}`}
                          >
                            <td colSpan={5} className="px-3 py-2 text-sm font-bold text-gray-900">
                              {formatDate(group.date)}
                            </td>
                            <td
                              colSpan={4}
                              className={`px-3 py-2 text-sm font-bold text-right ${group.openingBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}
                            >
                              <span className={group.openingBalance < 0 ? 'animate-pulse' : ''}>
                                Opening Balance: {formatCurrency(group.openingBalance)}
                              </span>
                            </td>
                          </tr>
                          {group.entries.map((entry, entryIndex) => {
                            const globalIndex = filteredClientLedger.indexOf(entry);
                            return (
                              <tr
                                key={`entry-${groupIndex}-${entryIndex}`}
                                className={`hover:bg-gray-50 cursor-pointer ${checkedRows.has(globalIndex) ? 'bg-blue-200' : ''}`}
                                onClick={() => toggleRowCheck(globalIndex)}
                              >
                                <td className="px-2 py-2 border-r border-gray-200">
                                  <input
                                    type="checkbox"
                                    checked={checkedRows.has(globalIndex)}
                                    onChange={() => toggleRowCheck(globalIndex)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-200">
                                  {formatDate(entry.date)}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-200">
                                  {entry.time || '-'}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-200">
                                  <span className="inline-flex items-center">
                                    {entry.module}
                                    <UpdatedEntryBadge
                                      createdAt={entry.createdAt}
                                      updatedAt={entry.updatedAt}
                                    />
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-200">
                                  {renderLedgerDescription(entry.description)}
                                </td>
                                <td
                                  className={`px-3 py-2 text-sm text-right border-r border-gray-200 ${entry.debit > 0 ? 'text-red-600' : 'text-gray-900'}`}
                                >
                                  {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                                </td>
                                <td
                                  className={`px-3 py-2 text-sm text-right border-r border-gray-200 ${entry.credit > 0 ? 'text-green-600' : 'text-gray-900'}`}
                                >
                                  {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                                </td>
                                <td
                                  className={`px-3 py-2 text-sm text-right font-medium ${entry.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                >
                                  {formatCurrency(entry.balance)}
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingEntry(entry);
                                    }}
                                    className="inline-flex items-center justify-center rounded-lg border border-orange-300 bg-orange-50 p-1.5 text-orange-700 hover:bg-orange-100"
                                    title="Edit entry"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="bg-gray-100 border-t-2 border-gray-300">
                            <td colSpan={5} className="px-3 py-2 text-sm font-bold text-gray-900 text-right">
                              Day Total
                            </td>
                            <td className="px-3 py-2 text-sm font-bold text-right text-red-600 border-r border-gray-200">
                              {group.dayExpenseTotal > 0
                                ? formatCurrency(group.dayExpenseTotal)
                                : '-'}
                            </td>
                            <td className="px-3 py-2 text-sm font-bold text-right text-green-600 border-r border-gray-200">
                              {group.dayIncomeTotal > 0
                                ? formatCurrency(group.dayIncomeTotal)
                                : '-'}
                            </td>
                            <td className="px-3 py-2 text-sm text-right text-gray-500">-</td>
                            <td className="px-3 py-2 text-sm text-center text-gray-500">-</td>
                          </tr>
                          <tr className="border-b-2 border-gray-300">
                            <td colSpan={9} className="py-1"></td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>
        <ClientLedgerEditModal
          entry={editingEntry}
          open={!!editingEntry}
          onClose={() => setEditingEntry(null)}
          onSaved={reloadLedger}
        />
      </div>
      <Toaster />
    </>
  );
}
