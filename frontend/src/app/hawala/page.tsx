'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { Search, Calendar, Filter, Trash2, Save, RefreshCw, Edit, Check, X, Clock, User, DollarSign, FileText } from 'lucide-react';
import { ClientTypeahead } from '@/components/ui/client-typeahead';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { getHawalaEntries, createHawala, updateHawala, deleteHawala, HawalaEntry } from '@/lib/hawala';
import API_BASE_URL from '@/lib/api';
import { useAuthStore } from '@/store/index';

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

const hawalaApiUrl = 'https://example.com/hawala-api';

const fetchHawalaEntries = async () => {
  const response = await fetch(hawalaApiUrl);
  const data = await response.json();
  return data;
};

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    partyA: '',
    partyB: '',
    amount: '',
    remark: '',
  });

  // Initialize form and fetch hawala entries
  useEffect(() => {
    const initializeForm = async () => {
      try {
        // First fetch hawala entries to get latest data
        await fetchHawalaEntries();

        // Then call next IDs API like transactions module
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`${API_BASE_URL}/api/hawala/next-ids?date=${today}&type=INWARD`);
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
      const result = await getHawalaEntries();
      if (result.success) {
        setHawalaEntries(result.data || []);
      } else {
        console.error('API Error:', result.error);
      }
    } catch (error) {
      console.error('Error fetching hawala entries:', error);
      setError('Failed to fetch hawala entries');
    }
  };

  // Initialize form and fetch hawala entries
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      transactionId: generateTransactionId(),
      tokenNo: generateTokenNo(),
    }));

    fetchHawalaEntries();
  }, []);

  // Filter entries
  const filteredEntries = useMemo(() => {
    const today = new Date();
    const todayString = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    return hawalaEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const entryDateString = entryDate.getFullYear() + '-' +
        String(entryDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(entryDate.getDate()).padStart(2, '0');

      // Default to showing current day transactions, or filter by date range
      const matchesDate = !filterByDate ?
        entryDateString === todayString :
        (isSelectingRange && startDate && endDate ?
          entryDateString >= startDate && entryDateString <= endDate :
          entryDateString === dateFilter);

      const matchesSearch = searchTerm === '' ||
        entry.partyA.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.partyB.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.remark && entry.remark.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesDate && matchesSearch;
    });
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
      alert('Please select both parties');
      return false;
    }

    if (formData.partyA === formData.partyB) {
      alert('Party A and Party B must be different');
      return false;
    }

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      alert('Amount must be greater than 0');
      return false;
    }

    // const commission = parseFloat(formData.commission);
    // if (formData.commission && (isNaN(commission) || commission < 0)) {
    //   alert('Commission must be a positive number');
    //   return false;
    // }

    return true;
  };

  // Save hawala entry
  const handleSave = async () => {
    // Clear previous messages
    setError(null);
    setSuccess(null);

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
      setError('Please fill in all required fields');
      console.log('Validation failed - one or more required fields are empty');
      return;
    }

    // Validate that Party A and Party B are different
    if (formData.partyA === formData.partyB) {
      setError('Party A and Party B must be different clients');
      console.log('Validation failed - Party A and Party B are the same');
      return;
    }

    console.log('Validation passed - proceeding with API call');

    try {
      const token = getAuthToken();
      console.log('=== HAWALA PAGE AUTH DEBUG ===');
      console.log('Token from getAuthToken():', token);
      console.log('Auth store state:', JSON.stringify(useAuthStore.getState()));

      if (!token) {
        setError('Please login to save hawala entries');
        console.log('ERROR: No token found');
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

      // Refresh the data first to get latest entries
      await fetchHawalaEntries();

      // Fetch next IDs after successful save
      const today = new Date().toISOString().split('T')[0];
      try {
        const response = await fetch(`${API_BASE_URL}/api/hawala/next-ids?date=${today}&type=INWARD`);
        const result = await response.json();

        if (result.success) {
          setFormData(prev => ({
            ...prev,
            transactionId: result.nextTransactionId,
            tokenNo: result.nextTokenNo,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().slice(0, 5),
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

      setSuccess(editingId ? 'Hawala entry updated successfully' : 'Hawala entry created successfully');
    } catch (error) {
      console.error('Error saving hawala entry:', error);
      setError('Failed to save hawala entry');
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
        
        setSuccess('Hawala entry deleted successfully');
      } catch (error: any) {
        console.error('Error deleting hawala entry:', error);
        setError(error.message || 'Failed to delete hawala entry');
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

  return (
    <div className="bg-white min-h-screen w-full">
      <div className="pt-16 space-y-4 sm:space-y-6">


        {/* Entry Form */}
        <Card className="shadow-lg border-gray-200/50 bg-gradient-to-br from-gray-100/90 via-blue-100/80 to-purple-100/75 backdrop-blur-md relative z-10 mx-4 sm:mx-6 lg:mx-8">
          <CardHeader></CardHeader>
          <CardContent className="space-y-4">
            {/* Row 1: Transaction ID, Token No, Date, Time */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="transactionId">Transaction ID</Label>
                <Input
                  id="transactionId"
                  value={formData.transactionId}
                  readOnly
                  className="bg-white border-gray-300 rounded-md text-black placeholder:text-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="tokenNo">Token No</Label>
                <Input
                  id="tokenNo"
                  value={formData.tokenNo}
                  readOnly
                  className="bg-white border-gray-300 rounded-md text-black placeholder:text-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="bg-white border-gray-300 rounded-md text-black placeholder:text-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="bg-white border-gray-300 rounded-md text-black placeholder:text-gray-600"
                />
              </div>
            </div>

            {/* Row 2: Amount, Party A, Party B */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="bg-white border-gray-300 rounded-md font-bold text-black text-lg placeholder:text-gray-600"
                  placeholder="0.00"
                />
              </div>
              <div>
                <ClientTypeahead
                  id="partyA"
                  label="Party A (Debit Party / Sender)"
                  placeholder="Select Party A (Debit Party / Sender)"
                  value={formData.partyA}
                  onChange={(client) => {
                    console.log('Party A selected:', client);
                    const partyAValue = client || '';
                    console.log('Setting partyA to:', partyAValue);
                    setFormData(prev => ({ ...prev, partyA: partyAValue }));
                  }}
                  className="bg-white border-gray-300 text-black"
                />
              </div>
              <div>
                <ClientTypeahead
                  id="partyB"
                  label="Party B (Credit Party / Receiver)"
                  placeholder="Select Party B (Credit Party / Receiver)"
                  value={formData.partyB}
                  onChange={(client) => {
                    console.log('Party B selected:', client);
                    const partyBValue = client || '';
                    console.log('Setting partyB to:', partyBValue);
                    setFormData(prev => ({ ...prev, partyB: partyBValue }));
                  }}
                  className="bg-white border-gray-300 text-black"
                />
              </div>
            </div>

            {/* Row 3: Remark (Full Width) */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="remark">Remark</Label>
                <Input
                  id="remark"
                  value={formData.remark}
                  onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
                  className="bg-white border-gray-300 rounded-md text-black placeholder:text-gray-600"
                  placeholder="Enter remark"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
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
              <Button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingId ? 'Update' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>


        {/* Hawala Table */}
        <Card className="shadow-lg border-gray-200/50 bg-gradient-to-br from-gray-100/90 via-blue-100/80 to-purple-100/75 backdrop-blur-md relative z-10 mx-4 sm:mx-6 lg:mx-8">
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
                            className="h-8 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm"
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              placeholder="Start date"
                              className="h-8 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm"
                            />
                            <span className="text-gray-500 text-sm">to</span>
                            <Input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              placeholder="End date"
                              className="h-8 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm"
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
                      className="bg-white w-48 lg:w-64 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm placeholder:text-gray-600"
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
                  <tr className="bg-blue-900 text-white">
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
                      Party A (Udhar Party)
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold">
                      Party B (Jama Party)
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
                          index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
                        } ${selectedEntry?.id === entry.id ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {entry.tokenNo}
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
                          {entry.partyA}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {entry.partyB}
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
          <Card className="shadow-lg border-gray-200/50 bg-gradient-to-br from-gray-100/90 via-blue-100/80 to-purple-100/75 backdrop-blur-md relative z-10 mx-4 sm:mx-6 lg:mx-8">
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
  );
}
