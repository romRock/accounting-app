'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate, formatTime, matchesTableSearch } from '@/lib/utils';
import { Search, Calendar, Filter, Trash2, Save, RefreshCw, Edit, Check, X, Clock, User, DollarSign, FileText } from 'lucide-react';
import UpdatedEntryBadge from '@/components/reports/updated-entry-badge';
import { ClientTypeahead } from '@/components/ui/client-typeahead';
import { getHawalaEntries, createHawala, updateHawala, deleteHawala, HawalaEntry } from '@/lib/hawala';
import { getFetchDateRange, matchesDateFilter } from '@/lib/date-filter';
import { compareEntriesByTimeDesc } from '@/lib/entry-sort';
import { DatePicker } from '@/components/ui/date-picker';
import API_BASE_URL from '@/lib/api';
import { useAuthStore } from '@/store/index';
import { showSuccessToast, showUpdateToast, showDeleteToast, showErrorToast, Toaster } from '@/lib/toast';

// Get auth token from store (same as transactions)
const getAuthToken = () => {
  const { accessToken } = useAuthStore.getState();
  return accessToken;
};

// Types
interface LedgerEffect {
  id: string;
  hawalaId: string;
  party: string;
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  createdAt: string;
}

export default function HawalaPage() {
  // State
  const [hawalaEntries, setHawalaEntries] = useState<HawalaEntry[]>([]);
  const [ledgerEffects, setLedgerEffects] = useState<LedgerEffect[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<HawalaEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByDate, setFilterByDate] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);

  // Generate transaction ID based on latest hawala entries
  const generateTransactionId = () => {
    if (hawalaEntries.length === 0) {
      return 'HWL001';
    }

    const lastEntry = hawalaEntries.reduce((latest, entry) => {
      const entryNum = parseInt(entry.transactionId.replace('HWL', ''));
      const latestNum = parseInt(latest.transactionId.replace('HWL', ''));
      return entryNum > latestNum ? entry : latest;
    });

    const lastNumber = parseInt(lastEntry.transactionId.replace('HWL', ''));
    const nextNumber = lastNumber + 1;
    return `HWL${String(nextNumber).padStart(3, '0')}`;
  };

  // Generate token number based on today's hawala entries
  const generateTokenNo = () => {
    const today = new Date();
    const istToday = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const todayStart = new Date(istToday.getFullYear(), istToday.getMonth(), istToday.getDate());

    // Count today's hawala entries
    const todayEntries = hawalaEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= todayStart;
    });

    return (todayEntries.length + 1).toString();
  };

  // Form state
  const [formData, setFormData] = useState({
    transactionId: '',
    tokenNo: '',
    date: (() => {
      // Get current date in Indian timezone (UTC+5:30)
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const parts = formatter.formatToParts(now);
      const year = parts.find(p => p.type === 'year')?.value;
      const month = parts.find(p => p.type === 'month')?.value;
      const day = parts.find(p => p.type === 'day')?.value;
      return `${year}-${month}-${day}`;
    })(),
    time: (() => {
      // Get current time in Indian timezone (UTC+5:30)
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      return formatter.format(now);
    })(),
    partyA: '',
    partyB: '',
    amount: '',
    remark: '',
  });
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Auto-refresh time every second (like accounting page)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      // Format Indian time (HH:MM)
      const indianTime = now.toLocaleTimeString('en-IN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      });
      setFormData(prev => ({ ...prev, time: indianTime }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch next token for a selected date (transaction ID stays global)
  const fetchNextTokenForDate = async (selectedDate: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/hawala/next-ids?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          tokenNo: result.nextTokenNo,
        }));
      }
    } catch (error) {
      console.error('Error fetching next token for date:', error);
    }
  };

  // Initialize form and fetch hawala entries
  useEffect(() => {
    const initializeForm = async () => {
      try {
        // First fetch hawala entries to get latest data
        await fetchHawalaEntries();

        // Get current date in Indian timezone for next IDs API
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        const parts = formatter.formatToParts(now);
        const year = parts.find(p => p.type === 'year')?.value;
        const month = parts.find(p => p.type === 'month')?.value;
        const day = parts.find(p => p.type === 'day')?.value;
        const today = `${year}-${month}-${day}`;

        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/hawala/next-ids?date=${today}&type=INWARD`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const result = await response.json();

        if (result.success) {
          setFormData(prev => ({
            ...prev,
            transactionId: result.nextTransactionId,
            tokenNo: result.nextTokenNo
          }));
        } else {
          console.error('Failed to get next hawala IDs:', result.error);
          // Fallback to generated IDs
          const [transactionId, tokenNo] = [
            generateTransactionId(),
            generateTokenNo()
          ];
          setFormData(prev => ({
            ...prev,
            transactionId: transactionId,
            tokenNo: tokenNo
          }));
        }
      } catch (error) {
        console.error('Error initializing form:', error);
        // Fallback to generated IDs
        const [transactionId, tokenNo] = [
          generateTransactionId(),
          generateTokenNo()
        ];
        setFormData(prev => ({
          ...prev,
          transactionId: transactionId,
          tokenNo: tokenNo
        }));
      }
    };

    initializeForm();
  }, []);

  // Fetch hawala entries from API
  const fetchHawalaEntries = async () => {
    try {
      const { dateFrom, dateTo } = getFetchDateRange(
        filterByDate,
        dateFilter,
        isSelectingRange,
        startDate,
        endDate
      );
      const result = await getHawalaEntries({
        page: 1,
        limit: 1000,
        dateFrom,
        dateTo,
      });
      if (result.success) {
        setHawalaEntries(result.data || []);
      } else {
        console.error('API Error:', result.error);
      }
    } catch (error) {
      console.error('Error fetching hawala entries:', error);
      showErrorToast('Failed to fetch hawala entries');
    }
  };

  useEffect(() => {
    void fetchHawalaEntries();
  }, [filterByDate, dateFilter, startDate, endDate, isSelectingRange]);

  const entryMatchesSearch = (entry: HawalaEntry) =>
    matchesTableSearch(
      searchTerm,
      entry.tokenNo,
      entry.transactionId,
      formatDate(entry.date),
      entry.date,
      formatTime(entry.time),
      entry.time,
      entry.amount,
      formatCurrency(entry.amount),
      entry.partyA,
      entry.partyB,
      entry.remark,
    );

  // Filter entries
  const filteredEntries = useMemo(() => {
    return hawalaEntries.filter((entry) => {
      if (!entryMatchesSearch(entry)) {
        return false;
      }

      if (!filterByDate) {
        return true;
      }

      return matchesDateFilter(
        entry.date,
        filterByDate,
        dateFilter,
        isSelectingRange,
        startDate,
        endDate,
      );
    }).sort(compareEntriesByTimeDesc);
  }, [hawalaEntries, searchTerm, filterByDate, dateFilter, isSelectingRange, startDate, endDate]);

  // Generate ledger effect
  const generateLedgerEffect = (entry: HawalaEntry): LedgerEffect[] => {
    const effects: LedgerEffect[] = [];
    const timestamp = new Date().toISOString();

    // Debit entry for Party A
    effects.push({
      id: `debit_${entry.id}`,
      hawalaId: entry.id,
      party: entry.partyA,
      type: 'debit',
      amount: entry.amount,
      description: `Hawala debit - ${entry.transactionId}`,
      createdAt: timestamp,
    });

    // Credit entry for Party B
    effects.push({
      id: `credit_${entry.id}`,
      hawalaId: entry.id,
      party: entry.partyB,
      type: 'credit',
      amount: entry.amount,
      description: `Hawala credit - ${entry.transactionId}`,
      createdAt: timestamp,
    });

    // Commission entry (if applicable)
    // if (entry.commission > 0) {
    //   effects.push({
    //     id: `commission_${entry.id}`,
    //     hawalaId: entry.id,
    //     party: 'System',
    //     type: 'income',
    //     amount: entry.commission,
    //     description: `Commission income - ${entry.transactionId}`,
    //     createdAt: timestamp,
    //   });
    // }

    return effects;
  };

  // Form validation
  const validateForm = () => {
    if (!formData.partyA || !formData.partyB) {
      showErrorToast('Please select both parties');
      return false;
    }

    if (formData.partyA === formData.partyB) {
      showErrorToast('Party A and Party B must be different');
      return false;
    }

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      showErrorToast('Amount must be greater than 0');
      return false;
    }

    // const commission = parseFloat(formData.commission);
    // if (formData.commission && (isNaN(commission) || commission < 0)) {
    //   showErrorToast('Commission must be a positive number');
    //   return false;
    // }

    return true;
  };

  // Save hawala entry
  const handleSave = async () => {
    // Debug logging to see form data values
    console.log('Current form data:', formData);
    console.log('Validation checks:', {
      transactionId: !!formData.transactionId,
      transactionIdValue: formData.transactionId,
      date: !!formData.date,
      dateValue: formData.date,
      time: !!formData.time,
      timeValue: formData.time,
      partyA: !!formData.partyA,
      partyAValue: formData.partyA,
      partyB: !!formData.partyB,
      partyBValue: formData.partyB,
      amount: !!formData.amount,
      amountValue: formData.amount,
      amountTrimmed: formData.amount?.trim() !== ''
    });

    // Validate required fields (remark is optional)
    if (!formData.transactionId || !formData.date || !formData.time || !formData.partyA || !formData.partyB || !formData.amount || formData.amount.trim() === '') {
      showErrorToast('Please fill in all required fields');
      console.log('Validation failed - one or more required fields are empty');
      return;
    }

    // Validate that Party A and Party B are different
    if (formData.partyA === formData.partyB) {
      showErrorToast('Party A and Party B must be different clients');
      console.log('Validation failed - Party A and Party B are the same');
      return;
    }

    console.log('Validation passed - proceeding with API call');

    try {
      const token = getAuthToken();

      if (!token) {
        showErrorToast('Please login to save hawala entries');
        return;
      } else {
        console.log('SUCCESS: Token found, proceeding with API call');
      }

      // Create or update hawala entry
      const hawalaData = {
        transactionId: formData.transactionId,
        tokenNo: formData.tokenNo ? parseInt(formData.tokenNo) : undefined,
        date: formData.date,
        time: formData.time,
        partyA: formData.partyA,
        partyB: formData.partyB,
        amount: parseInt(formData.amount),
        remark: formData.remark || undefined,
        createdBy: 'admin@mail.com', // Use admin email that exists in database
      };

      console.log('Making API call with data:', hawalaData);
      console.log('Is editing:', !!editingId);

      if (editingId) {
        // Update existing entry
        console.log('Calling updateHawala API...');
        await updateHawala(editingId, hawalaData);
      } else {
        // Create new entry
        console.log('Calling createHawala API...');
        await createHawala(hawalaData);
      }

      console.log('API call completed successfully');

      // Refresh data with a small delay to ensure backend has committed the entry
      await new Promise(resolve => setTimeout(resolve, 200));
      await fetchHawalaEntries();

      // Fetch next IDs after successful save (reset to today)
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const parts = formatter.formatToParts(now);
      const year = parts.find(p => p.type === 'year')?.value;
      const month = parts.find(p => p.type === 'month')?.value;
      const day = parts.find(p => p.type === 'day')?.value;
      const today = `${year}-${month}-${day}`;
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const currentTime = timeFormatter.format(now);

      try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/hawala/next-ids?date=${today}&type=INWARD`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const result = await response.json();

        if (result.success) {
          setFormData(prev => ({
            ...prev,
            transactionId: result.nextTransactionId,
            tokenNo: result.nextTokenNo,
            date: today, // Use current date in Indian timezone
            time: currentTime, // Use current time in Indian timezone
            partyA: '',
            partyB: '',
            amount: '',
            remark: '',
          }));
        } else {
          console.error('Failed to get next hawala IDs:', result.error);
          // Fallback to clearing form
          handleClear();
        }
      } catch (error) {
        console.error('Error fetching next IDs after save:', error);
        // Fallback to clearing form
        handleClear();
      }

      if (editingId) {
        showUpdateToast('Hawala entry updated successfully');
      } else {
        showSuccessToast('Hawala entry created successfully');
      }
      
      // Focus on amount input (keyboard-friendly)
      setTimeout(() => amountInputRef.current?.focus(), 100);
    } catch (error) {
      console.error('Error saving hawala entry:', error);
      showErrorToast('Failed to save hawala entry');
    }
  };

  // Clear form
  const handleClear = () => {
    // Fetch latest IDs first before clearing form
    fetchHawalaEntries().then(() => {
      setFormData({
        transactionId: generateTransactionId(),
        tokenNo: generateTokenNo(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        partyA: '',
        partyB: '',
        amount: '',
        remark: '',
      });
      setEditingId(null);
      setSelectedEntry(null);
      
      // Focus on amount input (keyboard-friendly)
      setTimeout(() => amountInputRef.current?.focus(), 100);
    });
  };

  // Delete entry
  const handleDelete = async () => {
    if (editingId) {
      try {
        // Call delete API
        await deleteHawala(editingId, 'admin@mail.com');
        
        // Clear form
        handleClear();
        
        // Refresh hawala entries
        fetchHawalaEntries();
        
        showDeleteToast('Hawala entry deleted successfully');
      } catch (error: any) {
        console.error('Error deleting hawala entry:', error);
        showErrorToast(error.message || 'Failed to delete hawala entry');
      }
    }
  };

  // Select entry
  const handleSelectEntry = (entry: HawalaEntry) => {
    setSelectedEntry(entry);
    setEditingId(entry.id);
    setFormData({
      transactionId: entry.transactionId,
      tokenNo: entry.tokenNo ? entry.tokenNo.toString() : '',
      date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : '',
      time: entry.time ? new Date(entry.time).toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour12: false }).slice(0, 5) : '',
      partyA: entry.partyA,
      partyB: entry.partyB,
      amount: entry.amount.toString(),
      remark: entry.remark || '',
    });
  };

  const glassBase =
    'rounded-2xl backdrop-blur-md transition-all duration-200 shadow-[inset_0_2px_8px_rgba(15,23,42,0.07)]';
  const inactiveFieldClass = `${glassBase} bg-slate-100/80 border border-slate-200/90 text-slate-500 cursor-not-allowed`;
  const inactiveLookClass = `${glassBase} bg-slate-100/80 border border-slate-200/90 text-slate-500`;
  const datePickerClass = `${glassBase} h-10 border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-slate-100/50 to-slate-100/70 text-slate-600 hover:from-blue-50 hover:via-blue-50/80 hover:to-slate-100/80 hover:text-slate-700 shadow-[inset_0_2px_8px_rgba(59,130,246,0.12)]`;
  const amountFieldClass = `${glassBase} bg-white/95 border border-gray-200/90 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-orange-400/30 focus:border-orange-300 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)]`;
  const remarkFieldClass = amountFieldClass;
  const expenseTypeaheadClass = `${glassBase} !rounded-2xl !bg-red-50/85 !border-red-300/80 !text-red-900 placeholder:!text-red-400 focus:!ring-2 focus:!ring-red-500/35 focus:!border-red-500 shadow-[inset_0_2px_8px_rgba(239,68,68,0.12)]`;
  const incomeTypeaheadClass = `${glassBase} !rounded-2xl !bg-emerald-50/75 !border-emerald-300/80 !text-emerald-950 placeholder:!text-emerald-500/70 focus:!ring-2 focus:!ring-emerald-500/35 focus:!border-emerald-500 shadow-[inset_0_2px_8px_rgba(16,185,129,0.12)]`;

  return (
    <>
      <div className="bg-white min-h-screen w-full">
        <div className="pt-16 space-y-4 sm:space-y-6">
        {/* Entry Form */}
        <Card className="shadow-lg border-orange-200/40 bg-gradient-to-br from-white via-orange-50/95 to-orange-100/80 backdrop-blur-md relative z-10">
          <CardHeader></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
            {/* Row 1: Transaction ID, Token No, Date, Time */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="transactionId" className="text-sm font-medium text-slate-500">Transaction ID</Label>
                <Input
                  id="transactionId"
                  value={formData.transactionId}
                  readOnly
                  className={`mt-1 ${inactiveFieldClass} text-sm`}
                />
              </div>
              <div>
                <Label htmlFor="tokenNo" className="text-sm font-medium text-slate-500">Token No</Label>
                <Input
                  id="tokenNo"
                  value={formData.tokenNo}
                  readOnly
                  className={`mt-1 ${inactiveFieldClass} text-sm`}
                />
              </div>
              <div>
                <Label htmlFor="date" className="text-sm font-medium text-slate-500">Date</Label>
                <DatePicker
                  id="date"
                  value={formData.date}
                  onChange={(newDate) => {
                    setFormData(prev => ({ ...prev, date: newDate }));
                    if (!editingId) {
                      fetchNextTokenForDate(newDate);
                    }
                  }}
                  className={`mt-1 text-sm font-medium ${datePickerClass}`}
                  iconClassName="text-blue-500 drop-shadow-sm"
                />
              </div>
              <div>
                <Label htmlFor="time" className="text-sm font-medium text-slate-500">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className={`mt-1 ${inactiveLookClass} text-sm`}
                />
              </div>
            </div>

            {/* Row 2: Amount, Party A, Party B */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="amount" className="text-sm font-medium text-gray-700">Amount</Label>
                <Input
                  id="amount"
                  ref={amountInputRef}
                  type="number"
                  placeholder=""
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  min="0"
                  onWheel={(e) => e.currentTarget.blur()}
                  className={`mt-1 ${amountFieldClass} font-bold text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                />
              </div>
              <div>
                <ClientTypeahead
                  id="partyB"
                  label="Udhar Party (Expense)"
                  placeholder="Select Udhar Party (Debit)"
                  value={formData.partyB}
                  onChange={(client) => {
                    console.log('Party B selected:', client);
                    const partyBValue = client || '';
                    console.log('Setting partyB to:', partyBValue);
                    setFormData(prev => ({ ...prev, partyB: partyBValue }));
                  }}
                  className={`mt-1 h-10 ${expenseTypeaheadClass}`}
                />
              </div>
              <div>
                <ClientTypeahead
                  id="partyA"
                  label="Jama Party (Income)"
                  placeholder="Select Jama Party (Credit)"
                  value={formData.partyA}
                  onChange={(client) => {
                    console.log('Party A selected:', client);
                    const partyAValue = client || '';
                    console.log('Setting partyA to:', partyAValue);
                    setFormData(prev => ({ ...prev, partyA: partyAValue }));
                  }}
                  className={`mt-1 h-10 ${incomeTypeaheadClass}`}
                />
              </div>
              <div>
                <Label htmlFor="remark" className="text-sm font-medium text-gray-700">Remark</Label>
                <Input
                  id="remark"
                  value={formData.remark}
                  onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
                  className={`mt-1 ${remarkFieldClass} text-sm`}
                  placeholder="Enter remark"
                />
              </div>
            </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingId ? 'Update' : 'Save'}
              </Button>
              <Button
                onClick={handleClear}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600 w-full sm:w-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear
              </Button>
              {editingId && (
                <Button
                  onClick={handleDelete}
                  className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              
            </div>
          </CardContent>
        </Card>


        {/* Hawala Table */}
        <Card className="shadow-lg border-orange-200/40 bg-gradient-to-br from-white via-orange-50/95 to-orange-100/80 backdrop-blur-md relative z-10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-gray-900">Hawala Entries</div>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="filterByDate"
                      checked={filterByDate}
                      onChange={(e) => {
                        setFilterByDate(e.target.checked);
                        if (!e.target.checked) {
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
                          <DatePicker
                            value={dateFilter}
                            onChange={setDateFilter}
                            placeholder="Select date"
                            className="h-8 text-sm"
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <DatePicker
                              value={startDate}
                              onChange={setStartDate}
                              placeholder="Start date"
                              className="h-8 text-sm"
                            />
                            <span className="text-gray-500 text-sm">to</span>
                            <DatePicker
                              value={endDate}
                              onChange={setEndDate}
                              placeholder="End date"
                              className="h-8 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="hidden sm:block">
                    <Input
                      placeholder="Search hawala entries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`${amountFieldClass} w-48 lg:w-64 text-sm`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 text-white">
                    <th className="px-4 py-3 text-left text-sm font-bold">
                      Token No
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold">
                      Udhar Party (Debit)
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold">
                      Jama Party (Credit)
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold">
                      Remark
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="border border-gray-200 px-4 py-8 text-center text-gray-500">
                        No hawala entries found
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry, index) => (
                      <tr
                        key={entry.id}
                        onClick={() => handleSelectEntry(entry)}
                        className={`border-b cursor-pointer transition-colors ${
                          index % 2 === 0 ? 'bg-white/90 hover:bg-orange-50/70' : 'bg-orange-50/45 hover:bg-orange-100/55'
                        } ${selectedEntry?.id === entry.id ? 'bg-orange-100/70' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <span className="inline-flex items-center">
                            {entry.tokenNo}
                            <UpdatedEntryBadge
                              createdAt={entry.createdAt}
                              updatedAt={entry.updatedAt}
                            />
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatTime(entry.time)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                          {formatCurrency(entry.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {entry.partyB}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {entry.partyA}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {entry.remark || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Ledger Effects Summary */}
        {ledgerEffects.length > 0 && (
          <Card className="shadow-lg border-orange-200/40 bg-gradient-to-br from-white via-orange-50/95 to-orange-100/80 backdrop-blur-md relative z-10 mx-4 sm:mx-6 lg:mx-8">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Ledger Effects Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <div className="text-sm text-gray-600">Total Debits</div>
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency(
                        ledgerEffects
                          .filter(effect => effect.type === 'debit')
                          .reduce((sum, effect) => sum + effect.amount, 0)
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <div className="text-sm text-gray-600">Total Credits</div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(
                        ledgerEffects
                          .filter(effect => effect.type === 'credit')
                          .reduce((sum, effect) => sum + effect.amount, 0)
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <div className="text-sm text-gray-600">Total Commission</div>
                    <div className="text-lg font-bold text-blue-600">
                      {formatCurrency(
                        ledgerEffects
                          .filter(effect => effect.type === 'credit')
                          .reduce((sum, effect) => sum + effect.amount, 0)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    <Toaster />
    </>
  );
}
