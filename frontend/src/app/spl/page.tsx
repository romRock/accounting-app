'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';

// Types
interface SPLEntry {
  id: string;
  date: string;
  time: string;
  partyA: string;
  partyB: string;
  amount: number;
  commission: number;
  commissionType: 'auto' | 'manual';
  remark: string;
  status: 'pending' | 'completed';
}

// Mock data
const mockClients = [
  { id: '1', name: 'Client A' },
  { id: '2', name: 'Client B' },
  { id: '3', name: 'Client C' },
  { id: '4', name: 'Client D' },
];

const mockSPLEntries: SPLEntry[] = [
  {
    id: 'SPL001',
    date: '2024-01-15',
    time: '10:30',
    partyA: 'Client A',
    partyB: 'Client B',
    amount: 50000,
    commission: 500,
    commissionType: 'auto',
    remark: 'Monthly payment',
    status: 'completed'
  },
  {
    id: 'SPL002',
    date: '2024-01-16',
    time: '14:20',
    partyA: 'Client C',
    partyB: 'Client D',
    amount: 75000,
    commission: 750,
    commissionType: 'manual',
    remark: 'Emergency transfer',
    status: 'pending'
  }
];

export default function SPLPage() {
  const [splEntries, setSPLEntries] = useState<SPLEntry[]>(mockSPLEntries);
  const [selectedEntry, setSelectedEntry] = useState<SPLEntry | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    partyA: '',
    partyB: '',
    amount: '',
    commission: '',
    commissionType: 'auto' as 'auto' | 'manual',
    remark: '',
    status: 'pending' as 'pending' | 'completed'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Generate transaction ID
  const generateTransactionId = () => {
    const count = splEntries.length + 1;
    return `SPL${String(count).padStart(3, '0')}`;
  };

  // Clear form
  const clearForm = () => {
    setFormData({
      id: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      partyA: '',
      partyB: '',
      amount: '',
      commission: '',
      commissionType: 'auto',
      remark: '',
      status: 'pending'
    });
    setSelectedEntry(null);
  };

  // Save entry
  const saveEntry = () => {
    if (!formData.partyA || !formData.partyB || !formData.amount) {
      alert('Please fill all required fields');
      return;
    }

    if (formData.partyA === formData.partyB) {
      alert('Party A and Party B cannot be the same');
      return;
    }

    const entry: SPLEntry = {
      id: formData.id || generateTransactionId(),
      date: formData.date,
      time: formData.time,
      partyA: formData.partyA,
      partyB: formData.partyB,
      amount: parseFloat(formData.amount),
      commission: parseFloat(formData.commission || '0'),
      commissionType: formData.commissionType,
      remark: formData.remark,
      status: formData.status
    };

    if (selectedEntry) {
      // Update existing entry
      setSPLEntries(prev => prev.map(e => e.id === selectedEntry.id ? entry : e));
    } else {
      // Add new entry
      setSPLEntries(prev => [...prev, entry]);
    }

    clearForm();
  };

  // Delete entry
  const deleteEntry = () => {
    if (selectedEntry) {
      setSPLEntries(prev => prev.filter(e => e.id !== selectedEntry.id));
      clearForm();
    }
  };

  // Edit entry
  const editEntry = (entry: SPLEntry) => {
    setSelectedEntry(entry);
    setFormData({
      id: entry.id,
      date: entry.date,
      time: entry.time,
      partyA: entry.partyA,
      partyB: entry.partyB,
      amount: entry.amount.toString(),
      commission: entry.commission.toString(),
      commissionType: entry.commissionType,
      remark: entry.remark,
      status: entry.status
    });
  };

  // Filter entries
  const filteredEntries = splEntries.filter(entry => {
    const matchesSearch = entry.partyA.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.partyB.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.remark.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white min-h-screen w-full">
      <div className="pt-16 space-y-4 sm:space-y-6 p-6">
        
        
        {/* SPL Entry Form */}
        <Card className="shadow-sm border-gray-200 bg-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">SPL Entry Form</CardTitle>
            <CardDescription>Create new special entry transactions</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Row 1 */}
              <div>
                <Label htmlFor="transactionId" className="text-sm font-medium text-gray-700">Transaction ID</Label>
                <Input
                  id="transactionId"
                  value={formData.id || generateTransactionId()}
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
                <Label htmlFor="partyA" className="text-sm font-medium text-gray-700">Party A (Sender / Debit)</Label>
                <Select value={formData.partyA} onValueChange={(value) => setFormData(prev => ({ ...prev, partyA: value }))}>
                  <SelectTrigger className="bg-white border-gray-300 mt-1">
                    <SelectValue placeholder="Select Party A" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockClients.map(client => (
                      <SelectItem key={client.id} value={client.name}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="partyB" className="text-sm font-medium text-gray-700">Party B (Receiver / Credit)</Label>
                <Select value={formData.partyB} onValueChange={(value) => setFormData(prev => ({ ...prev, partyB: value }))}>
                  <SelectTrigger className="bg-white border-gray-300 mt-1">
                    <SelectValue placeholder="Select Party B" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockClients.map(client => (
                      <SelectItem key={client.id} value={client.name}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount" className="text-sm font-medium text-gray-700">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="bg-white border-gray-300 mt-1 font-bold text-black text-lg placeholder:text-gray-600"
                  placeholder="0.00"
                />
              </div>

              {/* Row 3 */}
              <div>
                <Label htmlFor="commission" className="text-sm font-medium text-gray-700">Commission</Label>
                <Input
                  id="commission"
                  type="number"
                  value={formData.commission}
                  onChange={(e) => setFormData(prev => ({ ...prev, commission: e.target.value }))}
                  className="bg-white border-gray-300 mt-1 font-bold text-black text-lg placeholder:text-gray-600"
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="commissionType" className="text-sm font-medium text-gray-700">Commission Type</Label>
                <Select value={formData.commissionType} onValueChange={(value: 'auto' | 'manual') => setFormData(prev => ({ ...prev, commissionType: value }))}>
                  <SelectTrigger className="bg-white border-gray-300 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                <Select value={formData.status} onValueChange={(value: 'pending' | 'completed') => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="bg-white border-gray-300 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Row 4 */}
              <div className="md:col-span-2">
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
            <div className="flex gap-3 mt-6">
              <Button onClick={clearForm} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                Clear
              </Button>
              <Button onClick={deleteEntry} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" disabled={!selectedEntry}>
                Delete
              </Button>
              <Button onClick={saveEntry} className="bg-green-600 hover:bg-green-700">
                {selectedEntry ? 'Update' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filter Bar */}
        <Card className="shadow-sm border-gray-200 bg-gray-100">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by party or remark..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border-gray-300 placeholder:text-gray-600 text-black"
                />
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={(value: 'all' | 'pending' | 'completed') => setStatusFilter(value)}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SPL Table */}
        <Card className="shadow-sm border-gray-200 bg-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">SPL Transactions</CardTitle>
            <CardDescription>View and manage special entry transactions</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-50 border-b border-blue-200">
                    <th className="px-4 py-3 text-left font-medium text-blue-900">Transaction ID</th>
                    <th className="px-4 py-3 text-left font-medium text-blue-900">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-blue-900">Time</th>
                    <th className="px-4 py-3 text-left font-medium text-blue-900">Party A (Debit)</th>
                    <th className="px-4 py-3 text-left font-medium text-blue-900">Party B (Credit)</th>
                    <th className="px-4 py-3 text-right font-medium text-blue-900">Amount</th>
                    <th className="px-4 py-3 text-right font-medium text-blue-900">Commission</th>
                    <th className="px-4 py-3 text-left font-medium text-blue-900">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-blue-900">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry, index) => (
                    <tr 
                      key={entry.id}
                      className={`border-b cursor-pointer transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } ${selectedEntry?.id === entry.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                      onClick={() => editEntry(entry)}
                    >
                      <td className="px-4 py-3 font-medium">{entry.id}</td>
                      <td className="px-4 py-3">{formatDate(entry.date)}</td>
                      <td className="px-4 py-3">{entry.time}</td>
                      <td className="px-4 py-3">{entry.partyA}</td>
                      <td className="px-4 py-3">{entry.partyB}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(entry.amount)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(entry.commission)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          entry.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{entry.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
