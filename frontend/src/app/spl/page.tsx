'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import { RefreshCw, Trash2, Save } from 'lucide-react';
import { showSuccessToast, showUpdateToast, showDeleteToast, showErrorToast, Toaster } from '@/lib/toast';

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
  const [formData, setFormData] = useState({
    transactionId: '',
    tokenNo: 0,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
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

  // Real-time time update
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const indianTime = now.toLocaleTimeString('en-IN', { hour12: false });
      setFormData(prev => ({
        ...prev,
        time: indianTime
      }));
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  // Fetch special entries on component mount
  useEffect(() => {
    const fetchSpecialEntries = async () => {
      try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Determine date range
        let dateFrom, dateTo;
        if (filterByDate) {
          if (isSelectingRange) {
            dateFrom = startDate || today;
            dateTo = endDate || today;
          } else {
            dateFrom = dateFilter || today;
            dateTo = dateFilter || today;
          }
        } else {
          // Default to today when filterByDate is false
          dateFrom = today;
          dateTo = today;
        }

        const response = await getSpecialEntries({
          page: 1,
          limit: 100,
          search: searchTerm || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          dateFrom,
          dateTo
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
  }, [searchTerm, statusFilter, filterByDate, dateFilter, startDate, endDate, isSelectingRange]);

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
    setFormData({
      transactionId: '',
      tokenNo: 0,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      partyA: '',
      amountA: '',
      partyB: '',
      amountB: '',
      partyC: '',
      amountC: '',
      remark: ''
    });
    setSelectedEntry(null);
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
      return;
    }

    if (formData.partyA === formData.partyB) {
      console.log('🔍 SPL DEBUG: Party A and Party B are the same:', formData.partyA);
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

      clearForm();
      if (selectedEntry) {
        showUpdateToast('Special entry updated successfully');
      } else {
        showSuccessToast('Special entry created successfully');
      }
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
    .filter(entry => {
      const matchesSearch = entry.partyA.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.partyB.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.partyC.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (entry.remark && entry.remark.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    })
    .sort((a, b) => (a.tokenNo || 0) - (b.tokenNo || 0)); // Sort by tokenNo in ascending order

  return (
    <>
    <div className="bg-white min-h-screen w-full">
      <div className="pt-16 space-y-4 sm:space-y-6 p-6">
        
        
        {/* SPL Entry Form */}
        <Card className="shadow-lg border-gray-200/50 bg-gradient-to-br from-gray-100/90 via-blue-100/80 to-purple-100/75 backdrop-blur-md relative z-10">
          <CardHeader></CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Row 1 */}
              <div>
                <Label htmlFor="transactionId" className="text-sm font-medium text-gray-700">Transaction ID</Label>
                <Input
                  id="transactionId"
                  value={formData.transactionId || generateTransactionId()}
                  readOnly
                  className="bg-white border-gray-300 text-gray-600 mt-1 placeholder:text-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="tokenNo" className="text-sm font-medium text-gray-700">Token No</Label>
                <Input
                  id="tokenNo"
                  type="number"
                  value={formData.tokenNo || generateTokenNo()}
                  readOnly
                  className="bg-white border-gray-300 text-gray-600 mt-1 placeholder:text-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="date" className="text-sm font-medium text-gray-700">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="bg-white border-gray-300 mt-1 text-black placeholder:text-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="time" className="text-sm font-medium text-gray-700">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="bg-white border-gray-300 mt-1 text-black placeholder:text-gray-600"
                />
              </div>
              

              {/* Row 2 */}
              <div>
                <Label htmlFor="amountA" className="text-sm font-medium text-red-700">Amount A (UDHAR) *</Label>
                <Input
                  id="amountA"
                  type="number"
                  value={formData.amountA}
                  onChange={(e) => setFormData(prev => ({ ...prev, amountA: e.target.value }))}
                  className="bg-white border-gray-300 mt-1 font-bold text-red-700 text-lg placeholder:text-red-700"
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="partyA" className="text-sm font-medium text-red-700">Party A ( UDHAR PARTY )</Label>
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
                  className="mt-1 bg-white border-gray-300 text-sm font-medium text-red-700 placeholder:text-red-500"
                />
                </div>
              </div>
              <div>
                <Label htmlFor="amountB" className="text-sm font-medium text-green-700">Amount B (JAMA) *</Label>
                <Input
                  id="amountB"
                  type="number"
                  value={formData.amountB}
                  onChange={(e) => setFormData(prev => ({ ...prev, amountB: e.target.value }))}
                  className="bg-white border-gray-300 mt-1 font-bold text-green-700 text-lg placeholder:text-green-700"
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="partyB" className="text-sm font-medium text-green-700">Party B ( JAMA PARTY )</Label>
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
                  className="mt-1 bg-white border-gray-300 text-sm font-medium text-green-700 placeholder:text-green-500"
                />
              </div>
              <div>
                <Label htmlFor="amountC" className="text-sm font-medium text-green-700">Amount C (A - B) *</Label>
                <Input
                  id="amountC"
                  type="number"
                  value={parseFloat(formData.amountA || '0') - parseFloat(formData.amountB || '0')}
                  readOnly
                  className={`bg-white border-gray-300 mt-1 font-bold text-lg placeholder:text-gray-500 ${
                    (parseFloat(formData.amountA || '0') - parseFloat(formData.amountB || '0')) >= 0 
                      ? 'text-green-700' 
                      : 'text-red-700'
                  }`}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="partyC" className="text-sm font-medium text-green-700">Party C ( +/- PARTY )</Label>
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
                  className={`bg-white border-gray-300 mt-1 text-sm font-medium placeholder:text-gray-500 ${
                    (parseFloat(formData.amountA || '0') - parseFloat(formData.amountB || '0')) >= 0 
                      ? 'text-green-700' 
                      : 'text-red-700'
                  }`}
                />
                </div>
              </div>
              
              <div className='md:col-span-2'>
                <Label htmlFor="remark" className="text-sm font-medium text-gray-700">Remark</Label>
                <Input
                  id="remark"
                  value={formData.remark}
                  onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
                  className="bg-white border-gray-300 mt-1 text-black placeholder:text-gray-600"
                  placeholder="Enter remark"
                />
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <Button onClick={clearForm} variant="outline" className="bg-red-600 hover:bg-red-700 text-white border-red-600 w-full sm:w-auto">
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button onClick={deleteEntry} variant="outline" className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 w-full sm:w-auto" disabled={!selectedEntry}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button onClick={saveEntry} className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
                <Save className="w-4 h-4 mr-2" />
                {selectedEntry ? 'Update' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>


        {/* SPL Table */}
        <Card className="shadow-lg border-gray-200/50 bg-gradient-to-br from-gray-100/90 via-blue-100/80 to-purple-100/75 backdrop-blur-md relative z-10">
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

                  <div className="hidden sm:block">
                    <Input
                      placeholder="Search SPL entries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-white w-48 lg:w-64 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm placeholder:text-gray-600"
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
                  <tr className="bg-blue-900 text-white">
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
                        index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
                      } ${selectedEntry?.id === entry.id ? 'bg-blue-100' : ''}`}
                      onClick={() => editEntry(entry)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">{entry.tokenNo}</td>
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
