'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate, matchesTableSearch } from '@/lib/utils';
import { RefreshCw, Trash2, Save } from 'lucide-react';
import UpdatedEntryBadge from '@/components/reports/updated-entry-badge';
import { showSuccessToast, showUpdateToast, showDeleteToast, showErrorToast, Toaster } from '@/lib/toast';
import API_BASE_URL from '@/lib/api';
import { useAuthStore } from '@/store/index';

// Function to format time in Indian time format
const formatTime = (timeString: string) => {
  try {
    const date = new Date(timeString);
    // Convert to Indian time (UTC+5:30)
    const indianTime = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    
    // Format as HH:MM AM/PM
    // Get hours and minutes in 24-hour format
    const hours = indianTime.getHours();
    const minutes = indianTime.getMinutes();
    
    // Convert to 12-hour format without AM/PM
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    // Format as HH:MM
    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch (error) {
    return timeString; // Fallback to original string if formatting fails
  }
};
import { ClientTypeahead } from '@/components/ui/client-typeahead';
import {
  getSpecialEntries,
  getSpecialEntryById,
  createSpecialEntry,
  updateSpecialEntry,
  deleteSpecialEntry,
  SpecialEntry,
  SpecialEntryCreateRequest
} from '@/lib/specialEntry';
import { getFetchDateRange } from '@/lib/date-filter';
import { DatePicker } from '@/components/ui/date-picker';

// Types
interface SPLEntry {
  id: string;
  transactionId: string;
  tokenNo: number;
  date: string;
  time: string;
  partyA: string;
  amountA: number;
  partyB: string;
  amountB: number;
  partyC: string;
  amountC: number;
  remark: string;
}

export default function SPLPage() {
  const [splEntries, setSPLEntries] = useState<SpecialEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<SpecialEntry | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    transactionId: '',
    tokenNo: 0,
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
    amountA: '',
    partyB: '',
    amountB: '',
    partyC: '',
    amountC: '',
    remark: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterByDate, setFilterByDate] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSelectingRange, setIsSelectingRange] = useState(false);

  // Auto-refresh time every second (like accounting and hawala pages)
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
      const { accessToken } = useAuthStore.getState();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      const response = await fetch(`${API_BASE_URL}/api/specialEntry/next-ids?date=${selectedDate}`, {
        method: 'GET',
        headers,
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

  // Initialize form and fetch next IDs from backend
  useEffect(() => {
    const initializeForm = async () => {
      try {
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

        const { accessToken } = useAuthStore.getState();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/specialEntry/next-ids?date=${today}&type=INWARD`, {
          method: 'GET',
          headers: headers,
        });
        const result = await response.json();

        if (result.success) {
          setFormData(prev => ({
            ...prev,
            transactionId: result.nextTransactionId,
            tokenNo: result.nextTokenNo
          }));
        } else {
          console.error('Failed to get next special entry IDs:', result.error);
          // Fallback to generated IDs
          setFormData(prev => ({
            ...prev,
            transactionId: generateTransactionId(),
            tokenNo: parseInt(generateTokenNo())
          }));
        }
      } catch (error) {
        console.error('Error initializing form:', error);
        // Fallback to generated IDs
        setFormData(prev => ({
          ...prev,
          transactionId: generateTransactionId(),
          tokenNo: parseInt(generateTokenNo())
        }));
      }
    };

    initializeForm();
  }, []);

  // Fetch special entries on component mount
  useEffect(() => {
    const fetchSpecialEntries = async () => {
      try {
        const { dateFrom, dateTo } = getFetchDateRange(
          filterByDate,
          dateFilter,
          isSelectingRange,
          startDate,
          endDate
        );

        const response = await getSpecialEntries({
          page: 1,
          limit: 1000,
          status: statusFilter === 'all' ? undefined : statusFilter,
          dateFrom,
          dateTo,
        });

        if (response.success && response.data) {
          setSPLEntries(response.data);
        } else {
          console.error('Failed to fetch special entries:', response.message);
        }
      } catch (error) {
        console.error('Error fetching special entries:', error);
      }
    };

    fetchSpecialEntries();
  }, [statusFilter, filterByDate, dateFilter, startDate, endDate, isSelectingRange]);

  // Generate transaction ID based on latest SPL entries
  const generateTransactionId = () => {
    if (splEntries.length === 0) {
      return 'SPL001';
    }

    const lastEntry = splEntries.reduce((latest, entry) => {
      const entryNum = parseInt(entry.transactionId.replace('SPL', ''));
      const latestNum = parseInt(latest.transactionId.replace('SPL', ''));
      return entryNum > latestNum ? entry : latest;
    });

    const lastNumber = parseInt(lastEntry.transactionId.replace('SPL', ''));
    const nextNumber = lastNumber + 1;
    return `SPL${String(nextNumber).padStart(3, '0')}`;
  };

  // Generate token number based on highest existing token number
  const generateTokenNo = () => {
    // Find highest existing token number
    const highestTokenNo = splEntries.reduce((highest, entry) => {
      const tokenNo = entry.tokenNo || 0;
      return tokenNo > highest ? tokenNo : highest;
    }, 0);

    return (highestTokenNo + 1).toString();
  };

  // Clear form
  const clearForm = () => {
    // Get current date in Indian timezone
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
    const currentDate = `${year}-${month}-${day}`;

    // Get current time in Indian timezone
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const currentTime = timeFormatter.format(now);

    setFormData({
      transactionId: '',
      tokenNo: 0,
      date: currentDate,
      time: currentTime,
      partyA: '',
      amountA: '',
      partyB: '',
      amountB: '',
      partyC: '',
      amountC: '',
      remark: ''
    });
    setSelectedEntry(null);

    // Focus on amount input (keyboard-friendly)
    setTimeout(() => amountInputRef.current?.focus(), 100);
  };

  // Save entry
  const saveEntry = async () => {
    console.log('🔍 SPL DEBUG: Current formData:', formData);

    // Calculate amountC = amountA - amountB
    const calculatedAmountC = parseFloat(formData.amountA || '0') - parseFloat(formData.amountB || '0');
    console.log('🔍 SPL DEBUG: Calculated amountC:', calculatedAmountC);

    // Check for required fields
    const requiredFields = {
      partyA: formData.partyA,
      partyB: formData.partyB,
      partyC: formData.partyC,
      amountA: formData.amountA,
      amountB: formData.amountB,
      date: formData.date,
      time: formData.time
    };

    console.log('🔍 SPL DEBUG: Required fields check:', requiredFields);

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value || value.toString().trim() === '')
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.log('🔍 SPL DEBUG: Missing fields:', missingFields);
      showErrorToast('Please fill in all required fields');
      return;
    }

    if (formData.partyA === formData.partyB) {
      console.log('🔍 SPL DEBUG: Party A and Party B are the same:', formData.partyA);
      showErrorToast('Party A and Party B must be different');
      return;
    }

    const payload = {
      transactionId: formData.transactionId || generateTransactionId(),
      tokenNo: formData.tokenNo || parseInt(generateTokenNo()),
      date: formData.date,
      time: formData.time,
      partyA: formData.partyA,
      amountA: parseFloat(formData.amountA),
      partyB: formData.partyB,
      amountB: parseFloat(formData.amountB),
      partyC: formData.partyC,
      amountC: calculatedAmountC,
      remark: formData.remark
    };

    console.log('🔍 SPL DEBUG: API Payload:', payload);

    try {
      if (selectedEntry) {
        // Update existing entry
        const updatedEntry = await updateSpecialEntry(selectedEntry.id, {
          transactionId: formData.transactionId || generateTransactionId(),
          tokenNo: formData.tokenNo || parseInt(generateTokenNo()),
          date: formData.date,
          time: formData.time,
          partyA: formData.partyA,
          amountA: parseFloat(formData.amountA),
          partyB: formData.partyB,
          amountB: parseFloat(formData.amountB),
          partyC: formData.partyC,
          amountC: calculatedAmountC,
          remark: formData.remark
        });

        // Refresh table data after update
        setSPLEntries(prev => prev.map(entry =>
          entry.id === selectedEntry.id ? updatedEntry : entry
        ));
      } else {
        // Add new entry
        const newEntry = await createSpecialEntry(payload);
        setSPLEntries(prev => [...prev, newEntry]);
      }

      // Refresh data with a small delay to ensure backend has committed the entry
      await new Promise(resolve => setTimeout(resolve, 200));

      const { dateFrom, dateTo } = getFetchDateRange(
        filterByDate,
        dateFilter,
        isSelectingRange,
        startDate,
        endDate
      );
      const refreshResult = await getSpecialEntries({
        page: 1,
        limit: 1000,
        dateFrom,
        dateTo,
      });
      if (refreshResult.success && refreshResult.data) {
        setSPLEntries(refreshResult.data);
      }

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
        const { accessToken } = useAuthStore.getState();
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }
        const nextIdsResponse = await fetch(`${API_BASE_URL}/api/specialEntry/next-ids?date=${today}&type=INWARD`, {
          method: 'GET',
          headers,
        });
        const nextIdsResult = await nextIdsResponse.json();

        if (nextIdsResult.success) {
          setFormData(prev => ({
            ...prev,
            transactionId: nextIdsResult.nextTransactionId,
            tokenNo: nextIdsResult.nextTokenNo,
            date: today,
            time: currentTime,
            partyA: '',
            amountA: '',
            partyB: '',
            amountB: '',
            partyC: '',
            amountC: '',
            remark: ''
          }));
        } else {
          clearForm();
        }
      } catch (error) {
        clearForm();
      }

      if (selectedEntry) {
        showUpdateToast('Special entry updated successfully');
      } else {
        showSuccessToast('Special entry created successfully');
      }

      // Focus on amount input (keyboard-friendly)
      setTimeout(() => amountInputRef.current?.focus(), 100);
    } catch (error) {
      showErrorToast(`Error: ${(error as Error).message}`);
    }
  };

  // Delete entry
  const deleteEntry = async () => {
    if (selectedEntry) {
      try {
        await deleteSpecialEntry(selectedEntry.id);
        setSPLEntries(prev => prev.filter(e => e.id !== selectedEntry.id));
        clearForm();
        showDeleteToast('Special entry deleted successfully');
      } catch (error: any) {
        console.log(`Error: ${(error as Error).message}`);
      }
    }
  };

  // Edit entry
  const editEntry = (entry: SpecialEntry) => {
    // Format date for input field (YYYY-MM-DD format)
    const formattedDate = entry.date ? new Date(entry.date).toISOString().split('T')[0] : '';
    
    setFormData({
      transactionId: entry.transactionId,
      tokenNo: entry.tokenNo || 0,
      date: formattedDate,
      time: entry.time,
      partyA: entry.partyA,
      amountA: entry.amountA?.toString() || '',
      partyB: entry.partyB,
      amountB: entry.amountB?.toString() || '',
      partyC: entry.partyC || '',
      amountC: entry.amountC?.toString() || '',
      remark: entry.remark || ''
    });
    setSelectedEntry(entry);
  };

  // Filter and sort entries
  const filteredEntries = splEntries
    .filter((entry) =>
      matchesTableSearch(
        searchTerm,
        entry.tokenNo,
        entry.transactionId,
        formatDate(entry.date),
        entry.date,
        formatTime(entry.time),
        entry.time,
        entry.amountA,
        entry.amountB,
        entry.amountC,
        formatCurrency(entry.amountA || 0),
        formatCurrency(entry.amountB || 0),
        formatCurrency(entry.amountC || 0),
        entry.partyA,
        entry.partyB,
        entry.partyC,
        entry.remark,
      ),
    )
    .sort((a, b) => (a.tokenNo || 0) - (b.tokenNo || 0)); // Sort by tokenNo in ascending order

  const amountCDelta =
    parseFloat(formData.amountA || '0') - parseFloat(formData.amountB || '0');
  const isAmountCPositive = amountCDelta >= 0;

  const glassBase =
    'rounded-2xl backdrop-blur-md transition-all duration-200 shadow-[inset_0_2px_8px_rgba(15,23,42,0.07)]';
  const inactiveFieldClass = `${glassBase} bg-slate-100/80 border border-slate-200/90 text-slate-500 cursor-not-allowed`;
  const inactiveLookClass = `${glassBase} bg-slate-100/80 border border-slate-200/90 text-slate-500`;
  const datePickerClass = `${glassBase} h-10 border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-slate-100/50 to-slate-100/70 text-slate-600 hover:from-blue-50 hover:via-blue-50/80 hover:to-slate-100/80 hover:text-slate-700 shadow-[inset_0_2px_8px_rgba(59,130,246,0.12)]`;
  const expenseFieldClass = `${glassBase} bg-red-50/85 border border-red-300/80 text-red-900 placeholder:text-red-400 focus:ring-2 focus:ring-red-500/35 focus:border-red-500 shadow-[inset_0_2px_8px_rgba(239,68,68,0.12)]`;
  const incomeFieldClass = `${glassBase} bg-emerald-50/75 border border-emerald-300/80 text-emerald-950 placeholder:text-emerald-500/70 focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500 shadow-[inset_0_2px_8px_rgba(16,185,129,0.12)]`;
  const expenseReadonlyClass = `${glassBase} bg-red-100/70 border border-red-200/80 text-red-800 cursor-not-allowed`;
  const incomeReadonlyClass = `${glassBase} bg-emerald-100/65 border border-emerald-200/80 text-emerald-800 cursor-not-allowed`;
  const remarkFieldClass = `${glassBase} bg-white/95 border border-gray-200/90 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-orange-400/30 focus:border-orange-300 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)]`;
  const expenseTypeaheadClass = `${glassBase} !rounded-2xl !bg-red-50/85 !border-red-300/80 !text-red-900 placeholder:!text-red-400 focus:!ring-2 focus:!ring-red-500/35 focus:!border-red-500 shadow-[inset_0_2px_8px_rgba(239,68,68,0.12)]`;
  const incomeTypeaheadClass = `${glassBase} !rounded-2xl !bg-emerald-50/75 !border-emerald-300/80 !text-emerald-950 placeholder:!text-emerald-500/70 focus:!ring-2 focus:!ring-emerald-500/35 focus:!border-emerald-500 shadow-[inset_0_2px_8px_rgba(16,185,129,0.12)]`;
  const amountCFieldClass = isAmountCPositive ? incomeReadonlyClass : expenseReadonlyClass;
  const partyCTypeaheadClass = isAmountCPositive ? incomeTypeaheadClass : expenseTypeaheadClass;
  const amountCLabelClass = isAmountCPositive ? 'text-emerald-800' : 'text-red-800';

  return (
    <>
    <div className="bg-white min-h-screen w-full">
      <div className="pt-16 space-y-4 sm:space-y-6">
        
        
        {/* SPL Entry Form */}
        <Card className="shadow-lg border-orange-200/40 bg-gradient-to-br from-white via-orange-50/95 to-orange-100/80 backdrop-blur-md relative z-10">
          <CardHeader></CardHeader>
          <CardContent className="p-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Row 1 */}
              <div>
                <Label htmlFor="transactionId" className="text-sm font-medium text-slate-500">Transaction ID</Label>
                <Input
                  id="transactionId"
                  value={formData.transactionId || generateTransactionId()}
                  readOnly
                  className={`mt-1 ${inactiveFieldClass} text-sm`}
                />
              </div>
              <div>
                <Label htmlFor="tokenNo" className="text-sm font-medium text-slate-500">Token No</Label>
                <Input
                  id="tokenNo"
                  type="number"
                  value={formData.tokenNo || generateTokenNo()}
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
                    if (!selectedEntry) {
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
              

              {/* Row 2 */}
              <div>
                <Label htmlFor="amountA" className="text-sm font-medium text-red-800">Amount A (UDHAR) *</Label>
                <Input
                  id="amountA"
                  ref={amountInputRef}
                  type="number"
                  placeholder=""
                  value={formData.amountA}
                  onChange={(e) => setFormData(prev => ({ ...prev, amountA: e.target.value }))}
                  min="0"
                  onWheel={(e) => e.currentTarget.blur()}
                  className={`mt-1 ${expenseFieldClass} font-bold text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                />
              </div>
              <div>
                <Label htmlFor="partyA" className="text-sm font-medium text-red-800">Party A ( UDHAR PARTY )</Label>
                <div className="relative" style={{ zIndex: 101 }}>
                <ClientTypeahead
                  id="partyA"
                  label=""
                  placeholder="Select Party A (UDHAR PARTY)"
                  value={formData.partyA}
                  onChange={(client) => {
                    console.log('Party A selected:', client);
                    const partyAValue = client || '';
                    console.log('Setting partyA to:', partyAValue);
                    setFormData(prev => ({ ...prev, partyA: partyAValue }));
                  }}
                  className={`mt-1 h-10 ${expenseTypeaheadClass}`}
                />
                </div>
              </div>
              <div>
                <Label htmlFor="amountB" className="text-sm font-medium text-emerald-800">Amount B (JAMA) *</Label>
                <Input
                  id="amountB"
                  type="number"
                  placeholder=""
                  value={formData.amountB}
                  onChange={(e) => setFormData(prev => ({ ...prev, amountB: e.target.value }))}
                  min="0"
                  onWheel={(e) => e.currentTarget.blur()}
                  className={`mt-1 ${incomeFieldClass} font-bold text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                />
              </div>
              <div>
                <Label htmlFor="partyB" className="text-sm font-medium text-emerald-800">Party B ( JAMA PARTY )</Label>
                <ClientTypeahead
                  id="partyB"
                  label=""
                  placeholder="Select Party B (JAMA PARTY)"
                  value={formData.partyB}
                  onChange={(client) => {
                    console.log('Party B selected:', client);
                    const partyBValue = client || '';
                    console.log('Setting partyB to:', partyBValue);
                    setFormData(prev => ({ ...prev, partyB: partyBValue }));
                  }}
                  className={`mt-1 h-10 ${incomeTypeaheadClass}`}
                />
              </div>
              <div>
                <Label htmlFor="amountC" className={`text-sm font-medium ${amountCLabelClass}`}>Amount C (A - B) *</Label>
                <Input
                  id="amountC"
                  type="number"
                  placeholder=""
                  value={amountCDelta}
                  readOnly
                  onWheel={(e) => e.currentTarget.blur()}
                  className={`mt-1 ${amountCFieldClass} font-bold text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                />
              </div>
              <div>
                <Label htmlFor="partyC" className={`text-sm font-medium ${amountCLabelClass}`}>Party C ( +/- PARTY )</Label>
                <div className="relative" style={{ zIndex: 99 }}>
                <ClientTypeahead
                  id="partyC"
                  label=""
                  placeholder="Select Party C (+/- PARTY)"
                  value={formData.partyC}
                  onChange={(client) => {
                    console.log('Party C selected:', client);
                    const partyCValue = client || '';
                    console.log('Setting partyC to:', partyCValue);
                    setFormData(prev => ({ ...prev, partyC: partyCValue }));
                  }}
                  className={`mt-1 h-10 ${partyCTypeaheadClass}`}
                />
                </div>
              </div>
              
              <div className='md:col-span-2'>
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
            <div className="flex justify-end gap-3 mt-6">
            <Button onClick={saveEntry} className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
                <Save className="w-4 h-4 mr-2" />
                {selectedEntry ? 'Update' : 'Save'}
              </Button>
              <Button onClick={clearForm} variant="outline" className="bg-red-600 hover:bg-red-700 text-white border-red-600 w-full sm:w-auto">
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button onClick={deleteEntry} variant="outline" className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 w-full sm:w-auto" disabled={!selectedEntry}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              
            </div>
          </CardContent>
        </Card>


        {/* SPL Table */}
        <Card className="shadow-lg border-orange-200/40 bg-gradient-to-br from-white via-orange-50/95 to-orange-100/80 backdrop-blur-md relative z-10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">SPL Transactions</CardTitle>
                <CardDescription>View and manage special entry transactions</CardDescription>
              </div>
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
                      placeholder="Search SPL entries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`${remarkFieldClass} w-48 lg:w-64 text-sm`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 text-white">
                    <th className="px-4 py-3 text-left text-sm font-bold">Token No</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Time</th>
                    <th className="px-4 py-3 text-right text-sm font-bold">Amount A</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Party A (Udhar)</th>
                    <th className="px-4 py-3 text-right text-sm font-bold">Amount B</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Party B (Jama)</th>
                    <th className="px-4 py-3 text-right text-sm font-bold">Amount C</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Party C (Jama/Udhar)</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className={`border-b cursor-pointer transition-colors ${
                        index % 2 === 0 ? 'bg-white/90 hover:bg-orange-50/70' : 'bg-orange-50/45 hover:bg-orange-100/55'
                      } ${selectedEntry?.id === entry.id ? 'bg-orange-100/70' : ''}`}
                      onClick={() => editEntry(entry)}
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
                      <td className="px-4 py-3 text-sm text-gray-900">{formatDate(entry.date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatTime(entry.time)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-blue-600">{formatCurrency(entry.amountA || 0)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{entry.partyA}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-blue-600">{formatCurrency(entry.amountB || 0)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{entry.partyB}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-blue-600">{formatCurrency(entry.amountC || 0)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{entry.partyC}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{entry.remark || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
      <Toaster />
    </>
);
}
