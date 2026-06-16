'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { ClientTypeahead } from '@/components/ui/client-typeahead';
import { CityTypeahead } from '@/components/ui/typeahead';
import AccountingLoader from '@/components/ui/accounting-loader';
import UpdatedEntryBadge from '@/components/reports/updated-entry-badge';
import {
  ClientLedgerEntry,
  ClientLedgerSourceRecord,
  fetchSourceRecordForLedgerEntry,
} from '@/lib/client-ledger';
import { transactionApi, Transaction, City } from '@/lib/transactions';
import { accountingApi, AccountingEntry } from '@/lib/accounting';
import { updateHawala, deleteHawala, HawalaEntry } from '@/lib/hawala';
import { updateSpecialEntry, deleteSpecialEntry, SpecialEntry } from '@/lib/specialEntry';
import { showDeleteToast, showErrorToast, showUpdateToast } from '@/lib/toast';
import { getStoredCommissions } from '@/lib/transaction-commission-display';
import { Save, Trash2, X } from 'lucide-react';

interface LedgerClientOption {
  id: string;
  name: string;
  mobileNumber?: string;
}

interface ClientLedgerEditModalProps {
  entry: ClientLedgerEntry | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function toDateInput(value?: string): string {
  if (!value) return '';
  if (value.includes('T')) return value.split('T')[0];
  return value;
}

function toTimeInput(value?: string): string {
  if (!value) return '';
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  try {
    return new Date(value).toTimeString().slice(0, 5);
  } catch {
    return value.slice(0, 5);
  }
}

const LEDGER_TYPEAHEAD_Z = 1000000002;
const OUTWARD_MIN_COMMISSION = 50;

function calculateOutwardCommissionsFromAmount(amount: number) {
  const minCharge = OUTWARD_MIN_COMMISSION;
  let calculatedCommission = 0;

  if (amount <= 50000) calculatedCommission = minCharge;
  else if (amount <= 60000) calculatedCommission = 60;
  else if (amount <= 70000) calculatedCommission = 70;
  else if (amount <= 80000) calculatedCommission = 80;
  else if (amount <= 90000) calculatedCommission = 90;
  else if (amount <= 100000) calculatedCommission = 100;
  else calculatedCommission = Math.ceil(amount / 10000) * 10;

  const bookingCommission = Math.floor(calculatedCommission * 0.35);
  const centerCommission = calculatedCommission - bookingCommission;
  return { calculatedCommission, bookingCommission, centerCommission };
}

function calculateInwardCommissionFromAmount(amount: number) {
  const minCharge = OUTWARD_MIN_COMMISSION;
  let calculatedCommission = 0;

  if (amount <= 50000) calculatedCommission = minCharge;
  else if (amount <= 60000) calculatedCommission = 60;
  else if (amount <= 70000) calculatedCommission = 70;
  else if (amount <= 80000) calculatedCommission = 80;
  else if (amount <= 90000) calculatedCommission = 90;
  else if (amount <= 100000) calculatedCommission = 100;
  else calculatedCommission = Math.ceil(amount / 10000) * 10;

  return {
    calculatedCommission,
    cuttingCommission: Math.floor(calculatedCommission * 0.35),
  };
}

const hideScrollbarClass =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

export default function ClientLedgerEditModal({
  entry,
  open,
  onClose,
  onSaved,
}: ClientLedgerEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sourceRecord, setSourceRecord] = useState<ClientLedgerSourceRecord | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [selectedCenter, setSelectedCenter] = useState<City | null>(null);
  const [selectedSenderClient, setSelectedSenderClient] = useState<LedgerClientOption | null>(null);
  const [selectedReceiverClient, setSelectedReceiverClient] = useState<LedgerClientOption | null>(null);
  const [autoCommission, setAutoCommission] = useState(true);
  const [txnAmount, setTxnAmount] = useState(0);

  const [txnForm, setTxnForm] = useState<
    Partial<Transaction> & { cuttingCommission?: number }
  >({});

  const glassBase =
    'rounded-xl backdrop-blur-md transition-all duration-200 shadow-[inset_0_2px_8px_rgba(15,23,42,0.07)]';
  const labelClass = 'text-sm font-medium text-gray-800';
  const inactiveFieldClass = `${glassBase} bg-slate-100/80 border border-slate-200/90 text-slate-600 cursor-not-allowed`;
  const datePickerClass = `${glassBase} h-10 border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-slate-100/50 to-slate-100/70 text-slate-800 hover:from-blue-50 hover:via-blue-50/80 hover:to-slate-100/80 shadow-[inset_0_2px_8px_rgba(59,130,246,0.12)]`;
  const centerFieldClass = `${glassBase} !rounded-xl !bg-blue-50/70 !border-blue-300/80 !text-blue-950 placeholder:!text-blue-400/80 focus:!ring-2 focus:!ring-blue-500/35 focus:!border-blue-500`;
  const timeFieldClass = `${glassBase} bg-white/90 border border-slate-200/90 text-slate-900 focus:ring-2 focus:ring-slate-400/25 focus:border-slate-400`;
  const creditFieldClass = `${glassBase} bg-red-50/85 border border-red-300/80 text-red-900 placeholder:text-red-400 focus:ring-2 focus:ring-red-500/35 focus:border-red-500`;
  const creditReadonlyClass = `${glassBase} bg-red-100/70 border border-red-200/80 text-red-800 font-semibold cursor-default`;
  const contactFieldClass = `${glassBase} bg-white/95 border border-gray-200/90 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-orange-400/30 focus:border-orange-300`;
  const contactTypeaheadClass = `${glassBase} !rounded-xl !bg-white/95 !border-gray-200/90 !text-gray-900 placeholder:!text-gray-500 focus:!ring-2 focus:!ring-orange-400/30 focus:!border-orange-300`;
  const selectFieldClass = `${glassBase} h-10 w-full border border-gray-300/90 bg-white/95 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-orange-400/30 focus:border-orange-300`;
  const sectionClass = 'rounded-xl border border-gray-200 bg-white/95 p-3 shadow-sm';
  const compactGridClass = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6';
  const [accForm, setAccForm] = useState({
    date: '',
    time: '',
    amount: '',
    amountType: 'INCOME' as 'INCOME' | 'EXPENSE',
    categoryId: '',
    account: '',
    remark: '',
  });
  const [hawalaForm, setHawalaForm] = useState({
    date: '',
    time: '',
    partyA: '',
    partyB: '',
    amount: '',
    remark: '',
  });
  const [splForm, setSplForm] = useState({
    date: '',
    time: '',
    partyA: '',
    amountA: '',
    partyB: '',
    amountB: '',
    partyC: '',
    remark: '',
  });

  const amountCDelta = useMemo(
    () => parseFloat(splForm.amountA || '0') - parseFloat(splForm.amountB || '0'),
    [splForm.amountA, splForm.amountB],
  );

  useEffect(() => {
    if (!open || !entry) return;

    let cancelled = false;
    setLoading(true);
    setSourceRecord(null);
    setConfirmDelete(false);
    setSelectedCenter(null);
    setSelectedSenderClient(null);
    setSelectedReceiverClient(null);
    setAutoCommission(false);
    setTxnAmount(0);

    (async () => {
      try {
        const record = await fetchSourceRecordForLedgerEntry(entry);
        if (cancelled || !record) {
          if (!cancelled && !record) showErrorToast('Could not load entry for editing');
          return;
        }
        if (!cancelled) setSourceRecord(record);

        switch (entry.module) {
          case 'Transaction': {
            const txn = record as Transaction;
            const stored = getStoredCommissions(txn);
            setTxnForm({
              ...txn,
              date: toDateInput(txn.date),
              time: toTimeInput(txn.time),
              amountType: 'CREDIT',
              commission: stored.commission,
              bookingCommission: stored.bookingCommission,
              centerCommission: stored.centerCommission,
              autoCommission: false,
              cuttingCommission: txn.type === 'INWARD' ? stored.bookingCommission : undefined,
            });
            setTxnAmount(Number(txn.amount) || 0);
            setAutoCommission(false);
            if (txn.center) {
              setSelectedCenter({
                id: txn.center.id,
                name: txn.center.name,
                code: txn.center.code,
                state: '',
              });
            }
            if (txn.type === 'OUTWARD' && txn.senderClient) {
              setSelectedSenderClient({
                id: txn.senderClient.id,
                name: txn.senderClient.name,
                mobileNumber: txn.senderClient.phone,
              });
            }
            if (txn.type === 'INWARD' && txn.receiverClient) {
              setSelectedReceiverClient({
                id: txn.receiverClient.id,
                name: txn.receiverClient.name,
                mobileNumber: txn.receiverClient.phone,
              });
            }
            break;
          }
          case 'Accounting': {
            const acc = record as AccountingEntry;
            const cats = await accountingApi.getAccountCategories();
            if (!cancelled) setCategories(cats || []);
            const amountType =
              acc.type ||
              (acc.accountType === 'INCOME_ACCOUNT' ? 'INCOME' : 'EXPENSE');
            let categoryId = acc.categoryId || acc.category?.id || '';
            setAccForm({
              date: toDateInput(acc.date),
              time: toTimeInput(acc.statusTime || acc.time || acc.createdAt),
              amount: String(acc.amount || acc.creditAmount || acc.debitAmount || ''),
              amountType: amountType as 'INCOME' | 'EXPENSE',
              categoryId,
              account: acc.party?.name || acc.partyId || acc.accountId || '',
              remark: acc.description || '',
            });
            break;
          }
          case 'Hawala': {
            const h = record as HawalaEntry;
            setHawalaForm({
              date: toDateInput(h.date),
              time: toTimeInput(h.time),
              partyA: h.partyA,
              partyB: h.partyB,
              amount: String(h.amount || ''),
              remark: h.remark || '',
            });
            break;
          }
          case 'Special Entry': {
            const s = record as SpecialEntry;
            setSplForm({
              date: toDateInput(s.date),
              time: toTimeInput(s.time),
              partyA: s.partyA,
              amountA: String(s.amountA || ''),
              partyB: s.partyB,
              amountB: String(s.amountB || ''),
              partyC: s.partyC || '',
              remark: s.remark || '',
            });
            break;
          }
        }
      } catch (error) {
        if (!cancelled) showErrorToast('Failed to load entry');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, entry]);

  const txnType = (entry?.transactionType || txnForm.type || 'OUTWARD') as 'OUTWARD' | 'INWARD';
  const isInwardTxn = txnType === 'INWARD';
  const senderUsesClientPicker = txnType === 'OUTWARD';
  const receiverUsesClientPicker = txnType === 'INWARD';

  useEffect(() => {
    if (!open || loading || entry?.module !== 'Transaction' || !autoCommission) return;

    if (txnAmount <= 0) {
      setTxnForm((prev) => ({
        ...prev,
        amount: 0,
        commission: 0,
        bookingCommission: 0,
        centerCommission: 0,
        cuttingCommission: 0,
      }));
      return;
    }

    if (isInwardTxn) {
      const { calculatedCommission, cuttingCommission } =
        calculateInwardCommissionFromAmount(txnAmount);
      setTxnForm((prev) => ({
        ...prev,
        amount: txnAmount,
        commission: calculatedCommission,
        cuttingCommission,
      }));
    } else {
      const { calculatedCommission, bookingCommission, centerCommission } =
        calculateOutwardCommissionsFromAmount(txnAmount);
      setTxnForm((prev) => ({
        ...prev,
        amount: txnAmount,
        commission: calculatedCommission,
        bookingCommission,
        centerCommission,
      }));
    }
  }, [open, loading, entry?.module, txnAmount, autoCommission, isInwardTxn]);

  useEffect(() => {
    if (!open) return;
    transactionApi.getClients().catch(() => {});
  }, [open]);

  if (!open || !entry) return null;

  const handleSave = async () => {
    if (!entry) return;
    setSaving(true);
    try {
      switch (entry.module) {
        case 'Transaction': {
          const txn = txnForm as Transaction & { cuttingCommission?: number };
          const type = entry.transactionType || txn.type;

          if (type === 'OUTWARD' && !selectedSenderClient?.id && !txn.senderClientId) {
            showErrorToast('Please select a client for sender');
            setSaving(false);
            return;
          }
          if (type === 'INWARD' && !selectedReceiverClient?.id && !txn.receiverClientId) {
            showErrorToast('Please select a client for receiver');
            setSaving(false);
            return;
          }
          if (!txn.centerId) {
            showErrorToast('Please select a center');
            setSaving(false);
            return;
          }

          const transactionData: Record<string, unknown> = {
            transactionId: txn.transactionId,
            tokenNo: txn.tokenNo,
            date: txn.date,
            time: txn.time,
            centerId: txn.centerId,
            amount: Number(txn.amount) || 0,
            amountType: 'CREDIT',
            commission: Number(txn.commission) || 0,
            bookingCommission: Number(txn.bookingCommission) || 0,
            centerCommission: Number(txn.centerCommission) || 0,
            receiverName: txn.receiverName || '',
            receiverNumber: txn.receiverNumber || '',
            senderName: txn.senderName || '',
            senderNumber: txn.senderNumber || '',
            remark: txn.remark || '',
            type,
            status: txn.status ?? true,
            autoCommission,
            statusTime: new Date().toISOString(),
          };

          if (type === 'OUTWARD') {
            transactionData.senderClientId =
              selectedSenderClient?.id || txn.senderClientId;
          }
          if (type === 'INWARD') {
            transactionData.receiverClientId =
              selectedReceiverClient?.id || txn.receiverClientId;
            transactionData.bookingCommission =
              Number(txn.cuttingCommission) || Number(txn.bookingCommission) || 0;
            transactionData.centerCommission = 0;
          }

          await transactionApi.updateTransaction(entry.sourceId, transactionData);
          break;
        }
        case 'Accounting': {
          const amountValue = parseFloat(accForm.amount) || 0;
          await accountingApi.updateAccountEntry(entry.sourceId, {
            date: accForm.date,
            time: accForm.time,
            categoryId: accForm.categoryId,
            amount: amountValue,
            description: accForm.remark,
            partyId: accForm.account,
            totalAmount: amountValue,
            type: accForm.amountType,
            status: 'COMPLETED',
          });
          break;
        }
        case 'Hawala': {
          const original = sourceRecord as HawalaEntry;
          await updateHawala(entry.sourceId, {
            date: hawalaForm.date,
            time: hawalaForm.time,
            partyA: hawalaForm.partyA,
            partyB: hawalaForm.partyB,
            amount: parseInt(hawalaForm.amount, 10) || 0,
            remark: hawalaForm.remark || undefined,
            createdBy: original.createdBy,
          });
          break;
        }
        case 'Special Entry': {
          const original = sourceRecord as SpecialEntry;
          await updateSpecialEntry(entry.sourceId, {
            date: splForm.date,
            time: splForm.time,
            partyA: splForm.partyA,
            amountA: parseFloat(splForm.amountA) || 0,
            partyB: splForm.partyB,
            amountB: parseFloat(splForm.amountB) || 0,
            partyC: splForm.partyC,
            amountC: amountCDelta,
            remark: splForm.remark,
          });
          break;
        }
      }
      showUpdateToast(`${entry.module} entry updated successfully`);
      onSaved();
      onClose();
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Failed to update entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    try {
      switch (entry.module) {
        case 'Transaction':
          await transactionApi.deleteTransaction(entry.sourceId);
          break;
        case 'Accounting':
          await accountingApi.deleteAccountEntry(entry.sourceId);
          break;
        case 'Hawala': {
          const original = sourceRecord as HawalaEntry;
          await deleteHawala(entry.sourceId, original.createdBy);
          break;
        }
        case 'Special Entry':
          await deleteSpecialEntry(entry.sourceId);
          break;
      }
      showDeleteToast(`${entry.module} entry deleted successfully`);
      onSaved();
      onClose();
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Failed to delete entry');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === accForm.amountType);

  return (
    <div className="fixed inset-0 z-[1000000001] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative flex max-h-[92vh] w-[min(96vw,1400px)] flex-col rounded-2xl border border-orange-200/60 bg-white shadow-2xl ring-1 ring-black/5">
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Edit {entry.module} Entry
            </h2>
            <p className="text-sm text-gray-500">
              Ref: {entry.reference}
              <UpdatedEntryBadge createdAt={entry.createdAt} updatedAt={entry.updatedAt} />
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 ${hideScrollbarClass}`}>
          {loading ? (
            <AccountingLoader message="Loading entry..." />
          ) : entry.module === 'Transaction' ? (
            <div className={`space-y-3 ${sectionClass}`}>
              <div className={compactGridClass}>
                <div>
                  <Label className={labelClass}>Transaction ID</Label>
                  <Input readOnly value={txnForm.transactionId || ''} className={`mt-1 h-9 ${inactiveFieldClass} text-sm`} />
                </div>
                <div>
                  <Label className={labelClass}>Token No</Label>
                  <Input readOnly value={txnForm.tokenNo ?? ''} className={`mt-1 h-9 ${inactiveFieldClass} text-sm`} />
                </div>
                <div>
                  <Label className={labelClass}>Date</Label>
                  <DatePicker
                    value={txnForm.date || ''}
                    onChange={(date) => setTxnForm((prev) => ({ ...prev, date }))}
                    className={`mt-1 h-9 text-sm ${datePickerClass}`}
                    iconClassName="text-blue-500"
                  />
                </div>
                <div>
                  <Label className={labelClass}>Time</Label>
                  <Input
                    type="time"
                    value={txnForm.time || ''}
                    onChange={(e) => setTxnForm((prev) => ({ ...prev, time: e.target.value }))}
                    className={`mt-1 h-9 ${timeFieldClass} text-sm`}
                  />
                </div>
                <div className="col-span-2">
                  <CityTypeahead
                    id="ledger-txn-center"
                    label="Center"
                    value={selectedCenter?.name || txnForm.center?.name || ''}
                    onChange={(_value, city) => {
                      setSelectedCenter(city || null);
                      setTxnForm((prev) => ({ ...prev, centerId: city?.id || '' }));
                    }}
                    placeholder="Search center..."
                    className={`h-9 ${centerFieldClass}`}
                    usePortal
                    dropdownZIndex={LEDGER_TYPEAHEAD_Z}
                  />
                </div>
              </div>

              <div className={compactGridClass}>
                <div>
                  <Label className={`${labelClass} text-red-800`}>Amount</Label>
                  <Input
                    type="number"
                    value={txnAmount || ''}
                    onChange={(e) => setTxnAmount(Number(e.target.value) || 0)}
                    className={`mt-1 h-9 ${creditFieldClass} text-sm font-bold`}
                    min="0"
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </div>
                <div>
                  <Label className={`${labelClass} text-red-800`}>Amount Type</Label>
                  <Input readOnly value="CREDIT" className={`mt-1 h-9 ${creditReadonlyClass} text-sm`} />
                </div>
                {!isInwardTxn ? (
                  <>
                    <div>
                      <Label className={`${labelClass} text-red-800`}>Commission</Label>
                      <Input
                        type="number"
                        value={txnForm.commission ?? ''}
                        readOnly={autoCommission}
                        onChange={(e) => {
                          setAutoCommission(false);
                          setTxnForm((prev) => ({ ...prev, commission: Number(e.target.value) || 0 }));
                        }}
                        className={`mt-1 h-9 text-sm ${autoCommission ? creditReadonlyClass : creditFieldClass}`}
                        min="0"
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </div>
                    <div>
                      <Label className={`${labelClass} text-red-800`}>Booking Comm.</Label>
                      <Input
                        type="number"
                        value={txnForm.bookingCommission ?? ''}
                        readOnly={autoCommission}
                        onChange={(e) => {
                          setAutoCommission(false);
                          setTxnForm((prev) => ({ ...prev, bookingCommission: Number(e.target.value) || 0 }));
                        }}
                        className={`mt-1 h-9 text-sm ${autoCommission ? creditReadonlyClass : creditFieldClass}`}
                        min="0"
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </div>
                    <div>
                      <Label className={`${labelClass} text-red-800`}>Center Comm.</Label>
                      <Input
                        type="number"
                        value={txnForm.centerCommission ?? ''}
                        readOnly={autoCommission}
                        onChange={(e) => {
                          setAutoCommission(false);
                          setTxnForm((prev) => ({ ...prev, centerCommission: Number(e.target.value) || 0 }));
                        }}
                        className={`mt-1 h-9 text-sm ${autoCommission ? creditReadonlyClass : creditFieldClass}`}
                        min="0"
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className={`${labelClass} text-red-800`}>Cutting Comm.</Label>
                      <Input
                        type="number"
                        value={txnForm.cuttingCommission ?? txnForm.bookingCommission ?? ''}
                        readOnly={autoCommission}
                        onChange={(e) => {
                          setAutoCommission(false);
                          setTxnForm((prev) => ({ ...prev, cuttingCommission: Number(e.target.value) || 0 }));
                        }}
                        className={`mt-1 h-9 text-sm ${autoCommission ? creditReadonlyClass : creditFieldClass}`}
                        min="0"
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </div>
                    <div>
                      <Label className={`${labelClass} text-red-800`}>Total Comm.</Label>
                      <Input
                        type="number"
                        value={txnForm.commission ?? ''}
                        readOnly={autoCommission}
                        onChange={(e) => {
                          setAutoCommission(false);
                          setTxnForm((prev) => ({ ...prev, commission: Number(e.target.value) || 0 }));
                        }}
                        className={`mt-1 h-9 text-sm ${autoCommission ? creditReadonlyClass : creditFieldClass}`}
                        min="0"
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </div>
                  </>
                )}
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-red-800">
                    <input
                      type="checkbox"
                      checked={autoCommission}
                      onChange={(e) => setAutoCommission(e.target.checked)}
                      className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                    />
                    Auto
                  </label>
                </div>
                <div className="col-span-2">
                  <Label className={labelClass}>Remark</Label>
                  <Input
                    value={txnForm.remark || ''}
                    onChange={(e) => setTxnForm((prev) => ({ ...prev, remark: e.target.value }))}
                    className={`mt-1 h-9 ${contactFieldClass} text-sm`}
                  />
                </div>
              </div>

              <div className={compactGridClass}>
                <div>
                  {receiverUsesClientPicker ? (
                    <ClientTypeahead
                      id="ledger-txn-receiver"
                      label="Receiver Name"
                      value={txnForm.receiverName || ''}
                      onChange={(value, client) => {
                        setTxnForm((prev) => ({
                          ...prev,
                          receiverName: client?.name || value,
                          receiverNumber: client?.mobileNumber || prev.receiverNumber,
                        }));
                        if (client) {
                          setSelectedReceiverClient({
                            id: client.id,
                            name: client.name,
                            mobileNumber: client.mobileNumber,
                          });
                        } else {
                          setSelectedReceiverClient(null);
                        }
                      }}
                      placeholder="Search receiver..."
                      className={`h-9 ${contactTypeaheadClass}`}
                      dropdownZIndex={LEDGER_TYPEAHEAD_Z}
                    />
                  ) : (
                    <>
                      <Label className={labelClass}>Receiver Name</Label>
                      <Input
                        value={txnForm.receiverName || ''}
                        onChange={(e) => setTxnForm((prev) => ({ ...prev, receiverName: e.target.value }))}
                        className={`mt-1 h-9 ${contactFieldClass} text-sm`}
                      />
                    </>
                  )}
                </div>
                <div>
                  <Label className={labelClass}>Receiver No.</Label>
                  <Input
                    value={txnForm.receiverNumber || ''}
                    onChange={(e) => setTxnForm((prev) => ({ ...prev, receiverNumber: e.target.value }))}
                    className={`mt-1 h-9 ${contactFieldClass} text-sm`}
                  />
                </div>
                <div>
                  {senderUsesClientPicker ? (
                    <ClientTypeahead
                      id="ledger-txn-sender"
                      label="Sender Name"
                      value={txnForm.senderName || ''}
                      onChange={(value, client) => {
                        setTxnForm((prev) => ({
                          ...prev,
                          senderName: client?.name || value,
                          senderNumber: client?.mobileNumber || prev.senderNumber,
                        }));
                        if (client) {
                          setSelectedSenderClient({
                            id: client.id,
                            name: client.name,
                            mobileNumber: client.mobileNumber,
                          });
                        } else {
                          setSelectedSenderClient(null);
                        }
                      }}
                      placeholder="Search sender..."
                      className={`h-9 ${contactTypeaheadClass}`}
                      dropdownZIndex={LEDGER_TYPEAHEAD_Z}
                    />
                  ) : (
                    <>
                      <Label className={labelClass}>Sender Name</Label>
                      <Input
                        value={txnForm.senderName || ''}
                        onChange={(e) => setTxnForm((prev) => ({ ...prev, senderName: e.target.value }))}
                        className={`mt-1 h-9 ${contactFieldClass} text-sm`}
                      />
                    </>
                  )}
                </div>
                <div>
                  <Label className={labelClass}>Sender No.</Label>
                  <Input
                    value={txnForm.senderNumber || ''}
                    onChange={(e) => setTxnForm((prev) => ({ ...prev, senderNumber: e.target.value }))}
                    className={`mt-1 h-9 ${contactFieldClass} text-sm`}
                  />
                </div>
              </div>
            </div>
          ) : entry.module === 'Accounting' ? (
            <div className={`${sectionClass} ${compactGridClass}`}>
              <div>
                <Label className={labelClass}>Date</Label>
                <DatePicker
                  value={accForm.date}
                  onChange={(date) => setAccForm((prev) => ({ ...prev, date }))}
                  className={`mt-1 text-sm ${datePickerClass}`}
                  iconClassName="text-blue-500"
                />
              </div>
              <div>
                <Label className={labelClass}>Time</Label>
                <Input
                  type="time"
                  value={accForm.time}
                  onChange={(e) => setAccForm((prev) => ({ ...prev, time: e.target.value }))}
                  className={`mt-1 ${timeFieldClass} text-sm`}
                />
              </div>
              <div>
                <Label className={labelClass}>Amount</Label>
                <Input
                  type="number"
                  value={accForm.amount}
                  onChange={(e) => setAccForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className={`mt-1 ${contactFieldClass} text-sm`}
                />
              </div>
              <div>
                <Label className={labelClass}>Amount Type</Label>
                <select
                  value={accForm.amountType}
                  onChange={(e) =>
                    setAccForm((prev) => ({
                      ...prev,
                      amountType: e.target.value as 'INCOME' | 'EXPENSE',
                      categoryId: '',
                    }))
                  }
                  className={`mt-1 ${selectFieldClass}`}
                >
                  <option value="INCOME">INCOME</option>
                  <option value="EXPENSE">EXPENSE</option>
                </select>
              </div>
              <div>
                <Label className={labelClass}>Category</Label>
                <select
                  value={accForm.categoryId}
                  onChange={(e) => setAccForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                  className={`mt-1 ${selectFieldClass}`}
                >
                  <option value="">Select Category</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className={labelClass}>Account</Label>
                <ClientTypeahead
                  id="ledger-acc-account"
                  label=""
                  value={accForm.account}
                  onChange={(value, client) =>
                    setAccForm((prev) => ({ ...prev, account: client?.name || value }))
                  }
                  placeholder="Search account..."
                  className={`mt-1 h-9 ${contactTypeaheadClass}`}
                  dropdownZIndex={LEDGER_TYPEAHEAD_Z}
                />
              </div>
              <div className="md:col-span-2">
                <Label className={labelClass}>Remark</Label>
                <Input
                  value={accForm.remark}
                  onChange={(e) => setAccForm((prev) => ({ ...prev, remark: e.target.value }))}
                  className={`mt-1 ${contactFieldClass} text-sm`}
                />
              </div>
            </div>
          ) : entry.module === 'Hawala' ? (
            <div className={`${sectionClass} ${compactGridClass}`}>
              <div>
                <Label className={labelClass}>Date</Label>
                <DatePicker
                  value={hawalaForm.date}
                  onChange={(date) => setHawalaForm((prev) => ({ ...prev, date }))}
                  className={`mt-1 text-sm ${datePickerClass}`}
                  iconClassName="text-blue-500"
                />
              </div>
              <div>
                <Label className={labelClass}>Time</Label>
                <Input
                  type="time"
                  value={hawalaForm.time}
                  onChange={(e) => setHawalaForm((prev) => ({ ...prev, time: e.target.value }))}
                  className={`mt-1 ${timeFieldClass} text-sm`}
                />
              </div>
              <div>
                <Label className={labelClass}>Amount</Label>
                <Input
                  type="number"
                  value={hawalaForm.amount}
                  onChange={(e) => setHawalaForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className={`mt-1 ${contactFieldClass} text-sm`}
                />
              </div>
              <div>
                <Label className={`${labelClass} text-emerald-800`}>Jama Party (Credit)</Label>
                <ClientTypeahead
                  id="ledger-hawala-a"
                  label=""
                  value={hawalaForm.partyA}
                  onChange={(value, client) =>
                    setHawalaForm((prev) => ({ ...prev, partyA: client?.name || value }))
                  }
                  placeholder="Party A"
                  className={`mt-1 h-9 ${contactTypeaheadClass}`}
                  dropdownZIndex={LEDGER_TYPEAHEAD_Z}
                />
              </div>
              <div>
                <Label className={`${labelClass} text-red-800`}>Udhar Party (Debit)</Label>
                <ClientTypeahead
                  id="ledger-hawala-b"
                  label=""
                  value={hawalaForm.partyB}
                  onChange={(value, client) =>
                    setHawalaForm((prev) => ({ ...prev, partyB: client?.name || value }))
                  }
                  placeholder="Party B"
                  className={`mt-1 h-9 ${contactTypeaheadClass}`}
                  dropdownZIndex={LEDGER_TYPEAHEAD_Z}
                />
              </div>
              <div className="md:col-span-2">
                <Label className={labelClass}>Remark</Label>
                <Input
                  value={hawalaForm.remark}
                  onChange={(e) => setHawalaForm((prev) => ({ ...prev, remark: e.target.value }))}
                  className={`mt-1 ${contactFieldClass} text-sm`}
                />
              </div>
            </div>
          ) : (
            <div className={`${sectionClass} ${compactGridClass}`}>
              <div>
                <Label className={labelClass}>Date</Label>
                <DatePicker
                  value={splForm.date}
                  onChange={(date) => setSplForm((prev) => ({ ...prev, date }))}
                  className={`mt-1 text-sm ${datePickerClass}`}
                  iconClassName="text-blue-500"
                />
              </div>
              <div>
                <Label className={labelClass}>Time</Label>
                <Input
                  type="time"
                  value={splForm.time}
                  onChange={(e) => setSplForm((prev) => ({ ...prev, time: e.target.value }))}
                  className={`mt-1 ${timeFieldClass} text-sm`}
                />
              </div>
              <div>
                <Label className={`${labelClass} text-red-800`}>Amount A</Label>
                <Input
                  type="number"
                  value={splForm.amountA}
                  onChange={(e) => setSplForm((prev) => ({ ...prev, amountA: e.target.value }))}
                  className={`mt-1 ${creditFieldClass} text-sm`}
                />
              </div>
              <div>
                <Label className={`${labelClass} text-red-800`}>Party A (Udhar)</Label>
                <ClientTypeahead
                  id="ledger-spl-a"
                  label=""
                  value={splForm.partyA}
                  onChange={(value, client) =>
                    setSplForm((prev) => ({ ...prev, partyA: client?.name || value }))
                  }
                  placeholder="Party A"
                  className={`mt-1 h-9 ${contactTypeaheadClass}`}
                  dropdownZIndex={LEDGER_TYPEAHEAD_Z}
                />
              </div>
              <div>
                <Label className={`${labelClass} text-emerald-800`}>Amount B</Label>
                <Input
                  type="number"
                  value={splForm.amountB}
                  onChange={(e) => setSplForm((prev) => ({ ...prev, amountB: e.target.value }))}
                  className={`mt-1 ${contactFieldClass} text-sm border-emerald-300/80 bg-emerald-50/75 text-emerald-950`}
                />
              </div>
              <div>
                <Label className={`${labelClass} text-emerald-800`}>Party B (Jama)</Label>
                <ClientTypeahead
                  id="ledger-spl-b"
                  label=""
                  value={splForm.partyB}
                  onChange={(value, client) =>
                    setSplForm((prev) => ({ ...prev, partyB: client?.name || value }))
                  }
                  placeholder="Party B"
                  className={`mt-1 h-9 ${contactTypeaheadClass}`}
                  dropdownZIndex={LEDGER_TYPEAHEAD_Z}
                />
              </div>
              <div>
                <Label className={amountCDelta >= 0 ? `${labelClass} text-emerald-800` : `${labelClass} text-red-800`}>
                  Amount C (A - B)
                </Label>
                <Input
                  type="number"
                  value={amountCDelta}
                  readOnly
                  className={`mt-1 ${inactiveFieldClass} text-sm`}
                />
              </div>
              <div>
                <Label className={amountCDelta >= 0 ? `${labelClass} text-emerald-800` : `${labelClass} text-red-800`}>
                  Party C (+/-)
                </Label>
                <ClientTypeahead
                  id="ledger-spl-c"
                  label=""
                  value={splForm.partyC}
                  onChange={(value, client) =>
                    setSplForm((prev) => ({ ...prev, partyC: client?.name || value }))
                  }
                  placeholder="Party C"
                  className={`mt-1 h-9 ${contactTypeaheadClass}`}
                  dropdownZIndex={LEDGER_TYPEAHEAD_Z}
                />
              </div>
              <div className="md:col-span-2">
                <Label className={labelClass}>Remark</Label>
                <Input
                  value={splForm.remark}
                  onChange={(e) => setSplForm((prev) => ({ ...prev, remark: e.target.value }))}
                  className={`mt-1 ${contactFieldClass} text-sm`}
                />
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 z-10 flex shrink-0 items-center justify-between gap-2 border-t border-gray-200 bg-white/95 px-5 py-3 backdrop-blur-sm">
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={saving || loading || deleting}
              className={
                confirmDelete
                  ? 'border-red-600 bg-red-600 text-white hover:bg-red-700 hover:text-white'
                  : 'border-red-300 text-red-700 hover:bg-red-50'
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? 'Deleting...' : confirmDelete ? 'Confirm Delete' : 'Delete Entry'}
            </Button>
            {confirmDelete && !deleting && (
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="ml-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmDelete(false);
                onClose();
              }}
              disabled={saving || deleting}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || loading || deleting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Update Entry'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
