'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, Calendar, Filter, Trash2, Save, RefreshCw, Edit, Check, X, Clock, User, DollarSign, FileText } from 'lucide-react';

// Types
interface HawalaEntry {
  id: string;
  transactionId: string;
  date: string;
  time: string;
  partyA: string;
  partyB: string;
  amount: number;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

interface LedgerEffect {
  id: string;
  hawalaId: string;
  party: string;
  type: 'debit' | 'credit' | 'income';
  amount: number;
  description: string;
  createdAt: string;
}

// Mock data
const mockClients = [
  { id: '1', name: 'ABC Trading', type: 'Both' },
  { id: '2', name: 'XYZ Corporation', type: 'Sender' },
  { id: '3', name: 'Global Exports', type: 'Receiver' },
  { id: '4', name: 'Local Business', type: 'Both' },
  { id: '5', name: 'International Co', type: 'Sender' },
];

const mockHawalaEntries: HawalaEntry[] = [
  {
    id: '1',
    transactionId: 'HWL001',
    date: new Date().toISOString().split('T')[0],
    time: '10:30',
    partyA: 'ABC Trading',
    partyB: 'XYZ Corporation',
    amount: 50000,
    remark: 'Monthly settlement',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    transactionId: 'HWL002',
    date: new Date().toISOString().split('T')[0],
    time: '14:15',
    partyA: 'Global Exports',
    partyB: 'Local Business',
    amount: 25000,
    remark: 'Pending verification',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function HawalaPage() {
  // State
  const [hawalaEntries, setHawalaEntries] = useState<HawalaEntry[]>(mockHawalaEntries);
  const [ledgerEffects, setLedgerEffects] = useState<LedgerEffect[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<HawalaEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    transactionId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    partyA: '',
    partyB: '',
    amount: '',
    remark: '',
  });

  // Generate transaction ID
  const generateTransactionId = () => {
    const count = hawalaEntries.length + 1;
    return `HWL${String(count).padStart(3, '0')}`;
  };

  // Initialize form
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      transactionId: generateTransactionId(),
    }));
  }, [hawalaEntries.length]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return hawalaEntries.filter(entry => {
      const matchesSearch = searchTerm === '' || 
        entry.partyA.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.partyB.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.remark.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.transactionId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDate = dateFilter === '' || entry.date === dateFilter;

      return matchesSearch && matchesDate;
    });
  }, [hawalaEntries, searchTerm, dateFilter]);

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

  // Save entry
  const handleSave = () => {
    if (!validateForm()) return;

    const entryData: HawalaEntry = {
      id: editingId || Date.now().toString(),
      transactionId: formData.transactionId,
      date: formData.date,
      time: formData.time,
      partyA: formData.partyA,
      partyB: formData.partyB,
      amount: parseFloat(formData.amount),
      remark: formData.remark,
      createdAt: editingId ? 
        hawalaEntries.find(e => e.id === editingId)?.createdAt || new Date().toISOString() :
        new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingId) {
      // Update existing entry
      setHawalaEntries(prev => prev.map(entry => 
        entry.id === editingId ? entryData : entry
      ));
      setEditingId(null);
    } else {
      // Add new entry
      setHawalaEntries(prev => [entryData, ...prev]);
    }

    // Generate ledger effects
    const effects = generateLedgerEffect(entryData);
    setLedgerEffects(prev => {
      // Remove old effects for this entry if updating
      const filtered = prev.filter(effect => effect.hawalaId !== entryData.id);
      return [...filtered, ...effects];
    });

    handleClear();
  };

  // Clear form
  const handleClear = () => {
    setFormData({
      transactionId: generateTransactionId(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      partyA: '',
      partyB: '',
      amount: '',
      remark: '',
    });
    setEditingId(null);
    setSelectedEntry(null);
  };

  // Delete entry
  const handleDelete = () => {
    if (editingId) {
      setHawalaEntries(prev => prev.filter(entry => entry.id !== editingId));
      setLedgerEffects(prev => prev.filter(effect => effect.hawalaId !== editingId));
      handleClear();
    }
  };

  // Select entry
  const handleSelectEntry = (entry: HawalaEntry) => {
    setSelectedEntry(entry);
    setEditingId(entry.id);
    setFormData({
      transactionId: entry.transactionId,
      date: entry.date,
      time: entry.time,
      partyA: entry.partyA,
      partyB: entry.partyB,
      amount: entry.amount.toString(),
      remark: entry.remark,
    });
  };

  return (
    <div className="bg-white min-h-screen w-full">
      <div className="pt-16 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Hawala Entry</h1>
            <p className="text-gray-600">Manage special middleman transactions</p>
          </div>
        </div>

        {/* Entry Form */}
        <Card className="shadow-sm border-gray-200 bg-gray-100 mx-4 sm:mx-6 lg:mx-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Entry Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Row 1: Transaction ID, Date, Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Row 2: Party A, Party B */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="partyA">Party A (Debit Party / Sender)</Label>
                <Select
                  value={formData.partyA}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, partyA: value }))}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-black">
                    <SelectValue placeholder="Select Party A" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockClients.map(client => (
                      <SelectItem key={client.id} value={client.name}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="partyB">Party B (Credit Party / Receiver)</Label>
                <Select
                  value={formData.partyB}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, partyB: value }))}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-black">
                    <SelectValue placeholder="Select Party B" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockClients.map(client => (
                      <SelectItem key={client.id} value={client.name}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: Amount, Commission, Commission Mode */}
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
            <div className="flex flex-wrap gap-2 pt-4">
              <Button
                onClick={handleClear}
                className="bg-gray-500 hover:bg-gray-600 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button
                onClick={handleDelete}
                disabled={!editingId}
                className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button
                onClick={handleSave}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingId ? 'Update' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filter Bar */}
        <Card className="shadow-sm border-gray-200 bg-gray-100 mx-4 sm:mx-6 lg:mx-8">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by party, remark, or transaction ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white border-gray-300 pl-10 text-black placeholder:text-gray-600"
                  />
                </div>
              </div>
              <div>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hawala Table */}
        <Card className="shadow-sm border-gray-200 bg-gray-100 mx-4 sm:mx-6 lg:mx-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Hawala Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Party A (Debit)
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Party B (Credit)
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Remark
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="border border-gray-200 px-4 py-8 text-center text-gray-500">
                        No hawala entries found
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => (
                      <tr
                        key={entry.id}
                        onClick={() => handleSelectEntry(entry)}
                        className={`hover:bg-gray-50 cursor-pointer ${
                          selectedEntry?.id === entry.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900">
                          {entry.transactionId}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
                          {formatDate(entry.date)}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
                          {entry.time}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                          {entry.partyA}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                          {entry.partyB}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900">
                          {formatCurrency(entry.amount)}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
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
          <Card className="shadow-sm border-gray-200 bg-gray-100 mx-4 sm:mx-6 lg:mx-8">
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
                          .filter(effect => effect.type === 'income')
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
