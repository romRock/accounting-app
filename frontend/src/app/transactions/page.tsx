"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CityTypeahead } from "@/components/ui/typeahead";
import { ClientTypeahead, Client } from "@/components/ui/client-typeahead";
import { useAuthStore } from "@/store/index";
import { useBranchStore } from "@/store/branch-store";
import { getTransactionBranchHeaders } from "@/lib/branch-headers";
import { compareEntriesByTimeDesc } from "@/lib/entry-sort";
import { getStoredCommissions } from "@/lib/transaction-commission-display";
import { formatCurrency, formatDate } from "@/lib/utils";
import { RefreshCw, Trash2, Save } from "lucide-react";
import UpdatedEntryBadge from "@/components/reports/updated-entry-badge";
import { transactionApi, Transaction } from "@/lib/transactions";
import { getFetchDateRange, matchesIndianDateFilter } from "@/lib/date-filter";
import { DatePicker } from "@/components/ui/date-picker";
import {
  showSuccessToast,
  showUpdateToast,
  showDeleteToast,
  showErrorToast,
  Toaster,
} from "@/lib/toast";

// Modern transaction schema matching backend
const transactionSchema = z.object({
  id: z.string().optional(),
  transactionId: z.string().optional(),
  tokenNo: z.number().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  centerId: z.string().min(1, "Center is required"),
  amount: z.number().positive("Amount must be positive"),
  amountType: z.enum(["CASH", "CREDIT"]),
  commission: z.number().min(0, "Commission must be non-negative"),
  autoCommission: z.boolean(),
  bookingCommission: z.number().optional(),
  centerCommission: z.number().optional(),
  cuttingCommission: z.number().optional(), // For inward transactions
  receiverName: z.string().optional(),
  receiverNumber: z.string().optional(),
  senderName: z.string().optional(),
  senderNumber: z.string().optional(),
  receiverClientId: z.string().optional(),
  senderClientId: z.string().optional(),
  remark: z.string().optional(),
  status: z.boolean(),
  type: z.enum(["OUTWARD", "INWARD"]),
});

type TransactionForm = z.infer<typeof transactionSchema>;

const OUTWARD_MIN_COMMISSION = 50;

function calculateOutwardCommissionsFromAmount(amount: number) {
  const minCharge = OUTWARD_MIN_COMMISSION;
  let calculatedCommission = 0;

  if (amount <= 50000) {
    calculatedCommission = minCharge;
  } else if (amount <= 60000) {
    calculatedCommission = 60;
  } else if (amount <= 70000) {
    calculatedCommission = 70;
  } else if (amount <= 80000) {
    calculatedCommission = 80;
  } else if (amount <= 90000) {
    calculatedCommission = 90;
  } else if (amount <= 100000) {
    calculatedCommission = 100;
  } else {
    calculatedCommission = Math.ceil(amount / 10000) * 10;
  }

  const bookingCommission = Math.floor(calculatedCommission * 0.35);
  const centerCommission = calculatedCommission - bookingCommission;

  return { calculatedCommission, bookingCommission, centerCommission };
}

/**
 * Manual outward split (Auto off):
 * - Total below amount minimum → all to center
 * - Total at/above minimum → center = auto center for amount, remainder = booking (extra is ours)
 */
function splitManualOutwardCommission(amount: number, totalCommission: number) {
  const total = Math.max(0, totalCommission);
  if (amount <= 0 || total === 0) {
    return { bookingCommission: 0, centerCommission: 0 };
  }

  const { calculatedCommission, centerCommission: autoCenter } =
    calculateOutwardCommissionsFromAmount(amount);

  if (total < calculatedCommission) {
    return { bookingCommission: 0, centerCommission: total };
  }

  return {
    bookingCommission: Math.max(0, total - autoCenter),
    centerCommission: autoCenter,
  };
}

interface Center {
  id: string;
  name: string;
  code: string;
}

interface ClientData {
  id: string;
  name: string;
  mobileNumber?: string;
  city?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function TransactionsPage() {
  const router = useRouter();

  // Tab state for switching between outward and inward
  const [activeTab, setActiveTab] = useState<"outward" | "inward">("outward");
  const { user, isAuthenticated } = useAuthStore();
  const activeTransactionBranchId = useBranchStore(
    (state) => state.activeTransactionBranchId,
  );
  const setAssignedBranches = useBranchStore((state) => state.setAssignedBranches);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [selectedReceiverClient, setSelectedReceiverClient] =
    useState<ClientData | null>(null);
  const [selectedSenderClient, setSelectedSenderClient] =
    useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const centerInputRef = useRef<HTMLInputElement>(null);
  const cityTypeaheadRef = useRef<any>(null);
  const [filterByDate, setFilterByDate] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [cityResetKey, setCityResetKey] = useState("0");

  // Force form update when editingTransaction changes
  useEffect(() => {
    if (editingTransaction) {
      setValue("transactionId", editingTransaction.transactionId);
      setValue("tokenNo", editingTransaction.tokenNo);
      setValue(
        "date",
        new Date(editingTransaction.date).toISOString().split("T")[0],
      );
      setValue("time", new Date().toTimeString().slice(0, 5));
      setValue("centerId", editingTransaction.centerId);
      setValue("amount", editingTransaction.amount);
      setValue("amountType", editingTransaction.amountType as any);
      setValue("commission", editingTransaction.commission);
      setValue("bookingCommission", editingTransaction.bookingCommission);
      setValue("centerCommission", editingTransaction.centerCommission);
      setValue("receiverName", editingTransaction.receiverName);
      setValue("receiverNumber", editingTransaction.receiverNumber || "");
      setValue("senderName", editingTransaction.senderName);
      setValue("senderNumber", editingTransaction.senderNumber || "");
      setValue("remark", editingTransaction.remark || "");
      setValue("status", editingTransaction.status);
      setValue("autoCommission", false);

      if (editingTransaction.center) {
        setSelectedCity(editingTransaction.center);
      }

      setSelectedReceiverClient(null);
      setSelectedSenderClient(null);
      if (editingTransaction.amountType === "CREDIT") {
        if (
          editingTransaction.type === "OUTWARD" &&
          editingTransaction.senderClient
        ) {
          setSelectedSenderClient({
            id: editingTransaction.senderClient.id,
            name: editingTransaction.senderClient.name,
            mobileNumber: editingTransaction.senderClient.phone,
            city: editingTransaction.senderClient.city,
          });
        }
        if (
          editingTransaction.type === "INWARD" &&
          editingTransaction.receiverClient
        ) {
          setSelectedReceiverClient({
            id: editingTransaction.receiverClient.id,
            name: editingTransaction.receiverClient.name,
            mobileNumber: editingTransaction.receiverClient.phone,
            city: editingTransaction.receiverClient.city,
          });
        }
      }
    }
  }, [editingTransaction]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transactionId: "",
      tokenNo: 1,
      date: (() => {
        const today = new Date();
        return (
          today.getFullYear() +
          "-" +
          String(today.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(today.getDate()).padStart(2, "0")
        );
      })(),
      time: new Date().toTimeString().slice(0, 5),
      centerId: "",
      amount: 0,
      amountType: "CASH",
      commission: 0,
      autoCommission: true,
      receiverName: "",
      receiverNumber: "",
      senderName: "",
      senderNumber: "",
      remark: "",
      status: true,
      type: "OUTWARD",
    },
  });

  const autoCommission = watch("autoCommission");
  const amount = watch("amount");
  const amountType = watch("amountType");
  const commission = watch("commission");
  const bookingCommission = watch("bookingCommission");
  const centerCommission = watch("centerCommission");

  const isCredit = amountType === "CREDIT";
  const receiverUsesClientPicker =
    (activeTab === "outward" && !isCredit) || (activeTab === "inward" && isCredit);
  const senderUsesClientPicker =
    (activeTab === "outward" && isCredit) || (activeTab === "inward" && !isCredit);

  const glassBase =
    "rounded-2xl backdrop-blur-md transition-all duration-200 shadow-[inset_0_2px_8px_rgba(15,23,42,0.07)]";
  const inactiveFieldClass = `${glassBase} bg-slate-100/80 border border-slate-200/90 text-slate-500 cursor-not-allowed`;
  const datePickerClass = `${glassBase} h-10 border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-slate-100/50 to-slate-100/70 text-slate-600 hover:from-blue-50 hover:via-blue-50/80 hover:to-slate-100/80 hover:text-slate-700 shadow-[inset_0_2px_8px_rgba(59,130,246,0.12)]`;
  const centerFieldClass = `${glassBase} !rounded-2xl !bg-blue-50/70 !border-blue-300/80 !text-blue-950 placeholder:!text-blue-400/80 focus:!ring-2 focus:!ring-blue-500/35 focus:!border-blue-500 shadow-[inset_0_2px_8px_rgba(59,130,246,0.1),0_0_16px_rgba(59,130,246,0.08)]`;
  const timeFieldClass = `${glassBase} bg-white/80 border border-slate-200/90 text-slate-800 focus:ring-2 focus:ring-slate-400/25 focus:border-slate-400`;
  const greenFieldClass = isCredit
    ? `${glassBase} bg-red-50/85 border border-red-300/80 text-red-900 placeholder:text-red-400 focus:ring-2 focus:ring-red-500/35 focus:border-red-500 shadow-[inset_0_2px_8px_rgba(239,68,68,0.12)]`
    : `${glassBase} bg-emerald-50/75 border border-emerald-300/80 text-emerald-950 placeholder:text-emerald-500/70 focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500 shadow-[inset_0_2px_8px_rgba(16,185,129,0.12)]`;
  const greenSelectClass = isCredit
    ? `${glassBase} border-red-300/80 focus:ring-2 focus:ring-red-500/35 focus:border-red-500 bg-red-50/85 text-red-900 font-semibold`
    : `${glassBase} border-emerald-300/80 focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500 bg-emerald-50/75 text-emerald-950 font-semibold`;
  const greenCommissionReadonlyClass = isCredit
    ? `${glassBase} bg-red-100/70 border border-red-200/80 text-red-700/80 cursor-not-allowed`
    : `${glassBase} bg-emerald-100/65 border border-emerald-200/80 text-emerald-700/80 cursor-not-allowed`;
  const contactFieldClass = `${glassBase} bg-white/95 border border-gray-200/90 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-orange-400/30 focus:border-orange-300 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)]`;
  const contactTypeaheadClass = `${glassBase} !rounded-2xl !bg-white/95 !border-gray-200/90 !text-gray-900 placeholder:!text-gray-500 focus:!ring-2 focus:!ring-orange-400/30 focus:!border-orange-300 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)]`;

  const handleAmountTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    register("amountType").onChange(e);
    const newType = e.target.value;
    if (newType === "CREDIT") {
      if (activeTab === "outward") {
        setSelectedReceiverClient(null);
      } else {
        setSelectedSenderClient(null);
      }
    } else {
      setSelectedReceiverClient(null);
      setSelectedSenderClient(null);
    }
    clearErrors(["senderName", "receiverName"]);
  };

  const applyManualOutwardSplit = (
    totalCommission: number,
    amountValue = amount,
  ) => {
    const { bookingCommission: booking, centerCommission: center } =
      splitManualOutwardCommission(amountValue || 0, totalCommission);
    setValue("bookingCommission", booking);
    setValue("centerCommission", center);
  };

  const handleManualOutwardCommissionChange = (total: number) => {
    const safeTotal = Math.max(0, total);
    setValue("commission", safeTotal);
    applyManualOutwardSplit(safeTotal);
  };

  const handleManualOutwardBookingChange = (booking: number) => {
    const total = Math.max(0, commission || 0);
    const safeBooking = Math.max(0, Math.min(booking, total));
    setValue("bookingCommission", safeBooking);
    setValue("centerCommission", Math.max(0, total - safeBooking));
  };

  const handleManualOutwardCenterChange = (center: number) => {
    const total = Math.max(0, commission || 0);
    const safeCenter = Math.max(0, Math.min(center, total));
    setValue("centerCommission", safeCenter);
    setValue("bookingCommission", Math.max(0, total - safeCenter));
  };

  // Fetch next transaction IDs from backend
  const fetchNextIds = async (date: string, transactionType?: string) => {
    try {
      const { accessToken } = useAuthStore.getState();
      const type = transactionType || activeTab.toUpperCase();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/transactions/next-ids?date=${date}&type=${type}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            ...getTransactionBranchHeaders(),
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
      }
    } catch (error) {}
    return { nextTransactionId: "PM2_001", nextTokenNo: 1 };
  };

  // Set current date and fetch next transaction IDs on mount and when editing changes or tab changes
  useEffect(() => {
    if (!editingTransaction) {
      // Get current date in local timezone (Indian time)
      const today = new Date();
      const currentDate = today.toLocaleDateString("en-CA"); // Fix timezone issue

      // Set current date in form
      setValue("date", currentDate);
      // Fetch next IDs
      fetchNextIds(currentDate, activeTab.toUpperCase()).then(
        ({ nextTransactionId, nextTokenNo }) => {
          setValue("transactionId", nextTransactionId);
          setValue("tokenNo", nextTokenNo);
        },
      );
    }
  }, [editingTransaction, setValue, activeTab]);

  // Commission calculation for preview (backend is source of truth)
  useEffect(() => {
    if (autoCommission && amount > 0) {
      if (activeTab === "outward") {
        const { calculatedCommission, bookingCommission, centerCommission } =
          calculateOutwardCommissionsFromAmount(amount);

        setValue("commission", calculatedCommission);
        setValue("bookingCommission", bookingCommission);
        setValue("centerCommission", centerCommission);
      } else {
        // INWARD commission calculation (cutting)
        const minCharge = 50;
        let calculatedCommission = 0;

        if (amount <= 50000) {
          // 0 to 50,000: Fixed minimum charge of 50
          calculatedCommission = minCharge;
        } else if (amount > 50000 && amount <= 60000) {
          // 50,001 to 60,000: Calculate on 60,000 base
          calculatedCommission = 60;
        } else if (amount > 60000 && amount <= 70000) {
          // 60,001 to 70,000: Calculate on 70,000 base
          calculatedCommission = 70;
        } else if (amount > 70000 && amount <= 80000) {
          // 70,001 to 80,000: Calculate on 80,000 base
          calculatedCommission = 80;
        } else if (amount > 80000 && amount <= 90000) {
          // 80,001 to 90,000: Calculate on 90,000 base
          calculatedCommission = 90;
        } else if (amount > 90000 && amount <= 100000) {
          // 90,001 to 100,000: Calculate on 100,000 base
          calculatedCommission = 100;
        } else {
          // For any amount above 100,000, round up to next 10,000 and use as commission base
          // Example: 110,000 → 110, 115,000 → 120, 1,510,000 → 1,510
          calculatedCommission = Math.ceil(amount / 10000) * 10;
        }

        // Our commission (cutting commission) is 35% of total commission for inward
        // Use Math.floor to apply rounding to center side
        const cuttingCommission = Math.floor(calculatedCommission * 0.35);

        setValue("cuttingCommission", cuttingCommission);
        setValue("commission", calculatedCommission); // Total commission
      }
    } else if (amount === 0) {
      // Reset commissions when amount is 0
      if (activeTab === "outward") {
        setValue("commission", 0);
        setValue("bookingCommission", 0);
        setValue("centerCommission", 0);
      } else {
        setValue("cuttingCommission", 0);
        setValue("commission", 0);
      }
    }
  }, [amount, autoCommission, setValue, activeTab]);

  // Manual outward: center = auto minimum for amount; extra → booking; below minimum → all center
  useEffect(() => {
    if (!autoCommission && activeTab === "outward" && amount > 0) {
      const { bookingCommission: booking, centerCommission: center } =
        splitManualOutwardCommission(amount, commission || 0);
      setValue("bookingCommission", booking);
      setValue("centerCommission", center);
    }
  }, [amount, commission, autoCommission, activeTab, setValue]);

  // Update time continuously every second
  useEffect(() => {
    const updateTime = () => {
      if (!editingTransaction) {
        const currentTime = new Date().toTimeString().slice(0, 5);
        setValue("time", currentTime);
      }
    };

    // Update immediately and then every second
    updateTime();
    const interval = setInterval(updateTime, 1000); // Update every 1 second

    return () => clearInterval(interval);
  }, [editingTransaction, setValue]);

  useEffect(() => {
    if (!user) return;

    const fromUser =
      user.branches ?? (user.branch ? [user.branch] : []);
    if (fromUser.length > 0) {
      setAssignedBranches(fromUser);
    }
  }, [user, setAssignedBranches]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { dateFrom, dateTo } = getFetchDateRange(
        filterByDate,
        dateFilter,
        isSelectingRange,
        startDate,
        endDate,
      );
      const data = await transactionApi.getTransactions({
        page: currentPage,
        limit: 1000,
        type: activeTab.toUpperCase(),
        dateFrom,
        dateTo,
      });
      setTransactions(data.transactions);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Fetch data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    fetchTransactions();
  }, [
    isAuthenticated,
    router,
    activeTab,
    filterByDate,
    dateFilter,
    startDate,
    endDate,
    isSelectingRange,
    activeTransactionBranchId,
  ]);

  useEffect(() => {
    const handleBranchChange = () => {
      if (!editingTransaction) {
        const today = new Date().toLocaleDateString("en-CA");
        fetchNextIds(today, activeTab.toUpperCase()).then(
          ({ nextTransactionId, nextTokenNo }) => {
            setValue("transactionId", nextTransactionId);
            setValue("tokenNo", nextTokenNo);
          },
        );
      }
      fetchTransactions();
    };

    window.addEventListener("setTransactionBranch", handleBranchChange as EventListener);
    return () => {
      window.removeEventListener("setTransactionBranch", handleBranchChange as EventListener);
    };
  }, [activeTab, editingTransaction, setValue]);

  const onSubmit = async (data: TransactionForm) => {
    if (data.amountType === "CREDIT") {
      if (activeTab === "outward" && !selectedSenderClient) {
        setError("senderName", {
          type: "manual",
          message: "Please select a client for sender",
        });
        return;
      }
      if (activeTab === "inward" && !selectedReceiverClient) {
        setError("receiverName", {
          type: "manual",
          message: "Please select a client for receiver",
        });
        return;
      }
    }

    try {
      setSubmitting(true);

      const transactionData: any = {
        ...data,
        type: activeTab.toUpperCase(),
        statusTime: new Date().toISOString(),
      };

      if (selectedSenderClient?.id) {
        transactionData.senderClientId = selectedSenderClient.id;
      }
      if (selectedReceiverClient?.id) {
        transactionData.receiverClientId = selectedReceiverClient.id;
      }

      // For inward transactions, map cuttingCommission to bookingCommission
      if (activeTab === "inward") {
        transactionData.bookingCommission = data.cuttingCommission || 0;
        transactionData.centerCommission = 0; // No center commission for inward
      }

      if (editingTransaction) {
        // Update existing transaction
        const updatedTransaction = await transactionApi.updateTransaction(
          editingTransaction.id,
          transactionData,
        );
        // Refetch transactions to get complete data with relationships
        await fetchTransactions();
        setEditingTransaction(null);
        showUpdateToast("Transaction updated successfully");
      } else {
        // Create new transaction
        const createdTransaction =
          await transactionApi.createTransaction(transactionData);
        // Refetch transactions to get complete data with relationships
        await fetchTransactions();
        showSuccessToast("Transaction added successfully");

        // Set commission values from backend response
        if (createdTransaction.commission !== undefined) {
          if (activeTab === "outward") {
            setValue("commission", createdTransaction.commission);
            setValue(
              "bookingCommission",
              createdTransaction.bookingCommission || 0,
            );
            setValue(
              "centerCommission",
              createdTransaction.centerCommission || 0,
            );
          } else {
            // For inward, bookingCommission contains the cutting commission (35% of total)
            setValue(
              "cuttingCommission",
              createdTransaction.bookingCommission || 0,
            );
            setValue("commission", createdTransaction.commission || 0); // Total commission
          }
        }
      }

      reset();
      // Get current date in local timezone (Indian time)
      const today = new Date();
      const currentDate =
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(today.getDate()).padStart(2, "0");
      fetchNextIds(currentDate, activeTab.toUpperCase()).then(
        ({ nextTransactionId, nextTokenNo }) => {
          setValue("transactionId", nextTransactionId);
          setValue("tokenNo", nextTokenNo);
        },
      );
      setValue("date", currentDate);
      setValue("time", new Date().toTimeString().slice(0, 5));
      setValue("autoCommission", true);

      // Focus on center input (keyboard-friendly)
      setTimeout(() => centerInputRef.current?.focus(), 100);
    } catch (err: any) {
      showErrorToast("Failed to save transaction. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    reset();
    // Get current date in local timezone (Indian time)
    const today = new Date();
    const currentDate = today.toLocaleDateString("en-CA"); // Fix timezone issue
    fetchNextIds(currentDate, activeTab.toUpperCase()).then(
      ({ nextTransactionId, nextTokenNo }) => {
        setValue("transactionId", nextTransactionId);
        setValue("tokenNo", nextTokenNo);
      },
    );
    setValue("date", currentDate);
    setValue("time", new Date().toTimeString().slice(0, 5));
    setValue("autoCommission", true);
    setValue("centerId", ""); // Force clear city input
    setEditingTransaction(null);
    setSelectedCity(null); // Clear city selection
    setSelectedReceiverClient(null); // Clear receiver client
    setSelectedSenderClient(null); // Clear sender client
    setCityResetKey(Date.now().toString()); // Trigger city typeahead reset

    setTimeout(() => centerInputRef.current?.focus(), 100);
  };

  const handleDelete = async () => {
    if (editingTransaction) {
      try {
        await transactionApi.deleteTransaction(editingTransaction.id);
        // Refetch transactions to get complete data with relationships
        await fetchTransactions();
        handleClear();
        showDeleteToast("Transaction deleted successfully");
      } catch (err: any) {
        showErrorToast("Failed to delete transaction. Please try again.");
      }
    }
  };

  // Handle row click to edit transaction
  const handleRowClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setActiveTab(transaction.type.toLowerCase() as "outward" | "inward");
    setValue("transactionId", transaction.transactionId);
    setValue("tokenNo", transaction.tokenNo);
    setValue("date", new Date(transaction.date).toISOString().split("T")[0]);
    setValue("time", new Date().toTimeString().slice(0, 5)); // Show current time when editing
    setValue("centerId", transaction.centerId);
    setValue("amount", transaction.amount);
    setValue("amountType", transaction.amountType as any);
    setValue("commission", transaction.commission);
    if (transaction.type === "INWARD") {
      setValue("cuttingCommission", transaction.bookingCommission || 0);
    } else {
      setValue("bookingCommission", transaction.bookingCommission);
      setValue("centerCommission", transaction.centerCommission);
    }
    setValue("receiverName", transaction.receiverName);
    setValue("receiverNumber", transaction.receiverNumber || "");
    setValue("senderName", transaction.senderName);
    setValue("senderNumber", transaction.senderNumber || "");
    setValue("remark", transaction.remark || "");
    setValue("status", transaction.status);
    setValue("autoCommission", false);

    // Set selectedCity for editing
    if (transaction.center) {
      setSelectedCity(transaction.center);
    }

    setSelectedReceiverClient(null);
    setSelectedSenderClient(null);
    if (transaction.amountType === "CREDIT") {
      if (transaction.type === "OUTWARD" && transaction.senderClient) {
        setSelectedSenderClient({
          id: transaction.senderClient.id,
          name: transaction.senderClient.name,
          mobileNumber: transaction.senderClient.phone,
          city: transaction.senderClient.city,
        });
      }
      if (transaction.type === "INWARD" && transaction.receiverClient) {
        setSelectedReceiverClient({
          id: transaction.receiverClient.id,
          name: transaction.receiverClient.name,
          mobileNumber: transaction.receiverClient.phone,
          city: transaction.receiverClient.city,
        });
      }
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === "" ||
      transaction.receiverName.toLowerCase().includes(searchLower) ||
      transaction.senderName.toLowerCase().includes(searchLower) ||
      transaction.transactionId.toLowerCase().includes(searchLower) ||
      transaction.tokenNo.toString().includes(searchLower) ||
      transaction.amount.toString().includes(searchLower) ||
      transaction.commission?.toString().includes(searchLower) ||
      transaction.receiverNumber?.toLowerCase().includes(searchLower) ||
      transaction.senderNumber?.toLowerCase().includes(searchLower) ||
      transaction.center?.name?.toLowerCase().includes(searchLower) ||
      transaction.amountType?.toLowerCase().includes(searchLower) ||
      transaction.date?.includes(searchLower) ||
      transaction.time?.includes(searchLower) ||
      transaction.remark?.toLowerCase().includes(searchLower);

    const matchesDate = matchesIndianDateFilter(
      transaction.date,
      filterByDate,
      dateFilter,
      isSelectingRange,
      startDate,
      endDate
    );

    return matchesSearch && matchesDate;
  });

  const sortedFilteredTransactions = useMemo(
    () => [...filteredTransactions].sort(compareEntriesByTimeDesc),
    [filteredTransactions],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        handleDelete();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingTransaction]);

  // Listen for tab changes from header
  useEffect(() => {
    const handleTabChange = (e: CustomEvent) => {
      setActiveTab(e.detail);
    };

    window.addEventListener(
      "setTransactionTab",
      handleTabChange as EventListener,
    );
    return () =>
      window.removeEventListener(
        "setTransactionTab",
        handleTabChange as EventListener,
      );
  }, []);

  // Show error toast for validation errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      showErrorToast(
        firstError?.message || "Please fill in all required fields",
      );
    }
  }, [errors]);

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white min-h-screen w-full">
        <div className="pt-16 space-y-4 sm:space-y-6">
          {/* Transaction Form */}
          <Card className="shadow-lg border-orange-200/40 bg-gradient-to-br from-white via-orange-50/95 to-orange-100/80 backdrop-blur-md relative z-10">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">
                {editingTransaction
                  ? "Edit Transaction"
                  : `${activeTab === "outward" ? "Outward" : "Inward"} Booking`}
              </CardTitle>
              <CardDescription className="text-gray-600">
                Enter {activeTab === "outward" ? "outward" : "inward"}{" "}
                transaction details below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Section 1: General Information */}
                <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    General Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                    <div>
                      <Label
                        htmlFor="transactionId"
                        className="text-sm font-medium text-slate-500"
                      >
                        Transaction ID
                      </Label>
                      <Input
                        id="transactionId"
                        {...register("transactionId")}
                        readOnly
                        className={`mt-1 ${inactiveFieldClass} text-sm`}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="tokenNo"
                        className="text-sm font-medium text-slate-500"
                      >
                        Token No
                      </Label>
                      <Input
                        id="tokenNo"
                        {...register("tokenNo")}
                        readOnly
                        className={`mt-1 ${inactiveFieldClass} text-sm`}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="date"
                        className="text-sm font-medium text-slate-500"
                      >
                        Date
                      </Label>
                      <DatePicker
                        id="date"
                        value={watch("date") || ""}
                        onChange={(newDate) => {
                          setValue("date", newDate);
                          if (!editingTransaction) {
                            fetchNextIds(newDate, activeTab.toUpperCase()).then(
                              ({ nextTokenNo }) => {
                                setValue("tokenNo", nextTokenNo);
                              },
                            );
                          }
                        }}
                        className={`mt-1 text-sm font-medium ${datePickerClass}`}
                        iconClassName="text-blue-500 drop-shadow-sm"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="time"
                        className="text-sm font-medium text-gray-700"
                      >
                        Time
                      </Label>
                      <Input
                        id="time"
                        type="time"
                        value={
                          editingTransaction
                            ? new Date().toTimeString().slice(0, 5)
                            : watch("time")
                        }
                        onChange={(e) => setValue("time", e.target.value)}
                        autoComplete="off"
                        className={`mt-1 ${timeFieldClass} text-sm`}
                      />
                    </div>

                    <div>
                      <CityTypeahead
                        id="centerId"
                        label="Center"
                        value={selectedCity?.name || watch("centerId") || ""}
                        onChange={(value, city) => {
                          setValue("centerId", city?.id || value);
                          setSelectedCity(city);
                        }}
                        placeholder="Search city..."
                        resetKey={cityResetKey}
                        inputRef={centerInputRef}
                        className={`h-10 ${centerFieldClass}`}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <Label
                        htmlFor="amount"
                        className="text-sm font-medium text-emerald-800"
                      >
                        Amount
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder=""
                        value={watch("amount") || ""}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setValue("amount", value);
                        }}
                        autoComplete="off"
                        min="0"
                        onWheel={(e) => e.currentTarget.blur()}
                        className={`mt-1 ${greenFieldClass} font-bold text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        ref={firstInputRef}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="amountType"
                        className="text-sm font-medium text-emerald-800"
                      >
                        Amount Type
                      </Label>
                      <select
                        id="amountType"
                        {...register("amountType")}
                        onChange={handleAmountTypeChange}
                        className={`mt-1 w-full h-10 text-sm ${greenSelectClass}`}
                      >
                        <option value="CASH">CASH</option>
                        <option value="CREDIT">CREDIT</option>
                      </select>
                    </div>

                    {activeTab === "outward" ? (
                      <div>
                        <Label
                          htmlFor="commission"
                          className="text-sm font-medium text-emerald-800"
                        >
                          Commission
                        </Label>
                        <Input
                          id="commission"
                          type="number"
                          step="0.01"
                          placeholder=""
                          value={commission || 0}
                          onChange={(e) => {
                            const value = Number(e.target.value) || 0;
                            if (autoCommission) {
                              setValue("commission", value);
                            } else {
                              handleManualOutwardCommissionChange(value);
                            }
                          }}
                          readOnly={autoCommission}
                          autoComplete="off"
                          min="0"
                          onWheel={(e) => e.currentTarget.blur()}
                          className={`mt-1 font-bold text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            autoCommission
                              ? greenCommissionReadonlyClass
                              : greenFieldClass
                          }`}
                        />
                      </div>
                    ) : (
                      <div>
                        <Label
                          htmlFor="cuttingCommission"
                          className="text-sm font-medium text-emerald-800"
                        >
                          Cutting Commission
                        </Label>
                        <Input
                          id="cuttingCommission"
                          type="number"
                          step="0.01"
                          placeholder=""
                          value={watch("cuttingCommission") || 0}
                          onChange={(e) =>
                            setValue(
                              "cuttingCommission",
                              Number(e.target.value),
                            )
                          }
                          readOnly={autoCommission}
                          autoComplete="off"
                          min="0"
                          onWheel={(e) => e.currentTarget.blur()}
                          className={`mt-1 font-bold text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            autoCommission
                              ? greenCommissionReadonlyClass
                              : greenFieldClass
                          }`}
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2 pt-6">
                      <input
                        type="checkbox"
                        id="autoCommission"
                        checked={watch("autoCommission")}
                        onChange={(e) =>
                          setValue("autoCommission", e.target.checked)
                        }
                        className={`h-4 w-4 rounded ${
                          isCredit
                            ? "text-red-600 focus:ring-red-500 border-red-300"
                            : "text-emerald-600 focus:ring-emerald-500 border-emerald-300"
                        }`}
                      />
                      <Label
                        htmlFor="autoCommission"
                        className="text-sm font-medium text-emerald-800"
                      >
                        Auto
                      </Label>
                    </div>
                  </div>

                  {activeTab === "outward" ? (
                    <div className="space-y-2 mt-3">
                      {!autoCommission && (
                        <p className="text-xs text-emerald-700/80">
                          Manual: Below amount minimum → all to center. At/above
                          minimum → center fixed, extra is booking. You can
                          still edit any box.
                        </p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label className="text-sm font-medium text-emerald-800">
                            Booking Commission
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={bookingCommission || 0}
                            readOnly={autoCommission}
                            onChange={(e) =>
                              handleManualOutwardBookingChange(
                                Number(e.target.value) || 0,
                              )
                            }
                            onWheel={(e) => e.currentTarget.blur()}
                            className={`mt-1 font-medium text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              autoCommission
                                ? greenCommissionReadonlyClass
                                : greenFieldClass
                            }`}
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-emerald-800">
                            Center Commission
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={centerCommission || 0}
                            readOnly={autoCommission}
                            onChange={(e) =>
                              handleManualOutwardCenterChange(
                                Number(e.target.value) || 0,
                              )
                            }
                            onWheel={(e) => e.currentTarget.blur()}
                            className={`mt-1 font-medium text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              autoCommission
                                ? greenCommissionReadonlyClass
                                : greenFieldClass
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                  </div>
                </div>

                {/* Section 2: Contact Information */}
                <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Contact Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="relative" style={{ zIndex: 101 }}>
                      {receiverUsesClientPicker ? (
                        <>
                          <ClientTypeahead
                            id="receiverName"
                            label="Receiver Name"
                            value={watch("receiverName") || ""}
                            onChange={(value: string, client?: Client) => {
                              setValue("receiverName", value);
                              if (client) {
                                setSelectedReceiverClient(client);
                                clearErrors("receiverName");
                                if (client.mobileNumber) {
                                  setValue(
                                    "receiverNumber",
                                    client.mobileNumber,
                                  );
                                }
                              } else {
                                setSelectedReceiverClient(null);
                              }
                            }}
                            placeholder="Search receiver client..."
                            className={`h-10 ${contactTypeaheadClass}`}
                          />
                          {errors.receiverName && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.receiverName.message}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <Label
                            htmlFor="receiverName"
                            className="text-sm font-medium text-gray-700"
                          >
                            Receiver Name
                          </Label>
                          <Input
                            id="receiverName"
                            placeholder="Enter receiver name"
                            {...register("receiverName")}
                            autoComplete="off"
                            className={`mt-1 ${contactFieldClass} text-sm`}
                          />
                        </>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="receiverNumber"
                        className="text-sm font-medium text-gray-700"
                      >
                        Receiver Number
                      </Label>
                      <Input
                        id="receiverNumber"
                        placeholder="Enter receiver number"
                        {...register("receiverNumber")}
                        autoComplete="off"
                        className={`mt-1 ${contactFieldClass} text-sm`}
                      />
                    </div>

                    <div className="relative" style={{ zIndex: 99 }}>
                      {senderUsesClientPicker ? (
                        <>
                          <ClientTypeahead
                            id="senderName"
                            label="Sender Name"
                            value={watch("senderName") || ""}
                            onChange={(value: string, client?: Client) => {
                              setValue("senderName", value);
                              if (client) {
                                setSelectedSenderClient(client);
                                clearErrors("senderName");
                                if (client.mobileNumber) {
                                  setValue("senderNumber", client.mobileNumber);
                                }
                              } else {
                                setSelectedSenderClient(null);
                              }
                            }}
                            placeholder="Search sender client..."
                            className={`h-10 ${contactTypeaheadClass}`}
                          />
                          {errors.senderName && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.senderName.message}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <Label
                            htmlFor="senderName"
                            className="text-sm font-medium text-gray-700"
                          >
                            Sender Name
                          </Label>
                          <Input
                            id="senderName"
                            placeholder="Enter sender name"
                            {...register("senderName")}
                            autoComplete="off"
                            className={`mt-1 ${contactFieldClass} text-sm`}
                          />
                        </>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="senderNumber"
                        className="text-sm font-medium text-gray-700"
                      >
                        Sender Number
                      </Label>
                      <Input
                        id="senderNumber"
                        placeholder="Enter sender number"
                        {...register("senderNumber")}
                        autoComplete="off"
                        className={`mt-1 ${contactFieldClass} text-sm`}
                      />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="remark"
                      className="text-sm font-medium text-gray-700"
                    >
                      Remark
                    </Label>
                    <Input
                      id="remark"
                      placeholder="Enter any remarks"
                      {...register("remark")}
                      autoComplete="off"
                      className={`mt-1 ${contactFieldClass} text-sm`}
                    />
                  </div>
                </div>

                {/* Section 3: Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0 pt-4 border-t">
                  <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 w-full sm:w-auto">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {submitting
                        ? "Saving..."
                        : editingTransaction
                          ? "Update"
                          : "Save"}
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClear}
                      className="bg-red-600 hover:bg-red-700 text-white border-red-600 w-full sm:w-auto"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Clear
                    </Button>

                    {editingTransaction && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 w-full sm:w-auto"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Section 4: Recent Transactions */}
          <Card className="shadow-lg border-orange-200/40 bg-gradient-to-br from-white via-orange-50/95 to-orange-100/80 backdrop-blur-md relative z-10">
            <CardHeader className="pb-4">
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Recent Transactions
                  </CardTitle>
                </div>

                <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
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
                          const currentDate =
                            today.getFullYear() +
                            "-" +
                            String(today.getMonth() + 1).padStart(2, "0") +
                            "-" +
                            String(today.getDate()).padStart(2, "0");
                          setDateFilter(currentDate);
                          setStartDate("");
                          setEndDate("");
                          setIsSelectingRange(false);
                        } else {
                          // Reset all date states when disabling filter
                          setDateFilter("");
                          setStartDate("");
                          setEndDate("");
                          setIsSelectingRange(false);
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label
                      htmlFor="filterByDate"
                      className="text-sm font-medium text-gray-700"
                    >
                      By Date
                    </Label>
                    {filterByDate && (
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setStartDate("");
                              setEndDate("");
                              setDateFilter("");
                              setIsSelectingRange(false);
                            }}
                            className={`px-3 py-1 text-xs rounded ${
                              !isSelectingRange && !dateFilter
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            Single Date
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setStartDate("");
                              setEndDate("");
                              setDateFilter("");
                              setIsSelectingRange(true);
                            }}
                            className={`px-3 py-1 text-xs rounded ${
                              isSelectingRange
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-white w-48 lg:w-64 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-sm placeholder:text-gray-600"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {sortedFilteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No transactions found</p>
                </div>
              ) : (
                <>
                  {/* Tablet Table - All Columns */}
                  <div className="hidden md:block lg:hidden">
                    <div className="w-full overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 text-white">
                            <th className="px-4 py-3 text-left text-sm font-bold">
                              Token
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-bold">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-bold">
                              Time
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-bold">
                              Center
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-bold">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-bold">
                              Amount Type
                            </th>
                            {activeTab === "outward" ? (
                              <>
                                <th className="px-4 py-3 text-left text-sm font-bold">
                                  Booking Comm
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-bold">
                                  Center Comm
                                </th>
                              </>
                            ) : (
                              <th className="px-4 py-3 text-left text-sm font-bold">
                                Cutting Comm
                              </th>
                            )}
                            <th className="px-4 py-3 text-left text-sm font-bold">
                              Receiver Name
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-bold">
                              Sender Name
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-bold">
                              Remark
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-bold">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedFilteredTransactions.map((transaction, index) => {
                            const stored = getStoredCommissions(transaction);
                            return (
                            <tr
                              key={transaction.id}
                              onClick={() => handleRowClick(transaction)}
                              className={`border-b cursor-pointer transition-colors ${
                                index % 2 === 0
                                  ? "bg-white/90 hover:bg-orange-50/70"
                                  : "bg-orange-50/45 hover:bg-orange-100/55"
                              }`}
                            >
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <span className="inline-flex items-center">
                                  {transaction.tokenNo}
                                  <UpdatedEntryBadge
                                    createdAt={transaction.createdAt}
                                    updatedAt={transaction.updatedAt}
                                  />
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {new Date(transaction.date).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "2-digit",
                                  },
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {new Date(transaction.time).toLocaleTimeString(
                                  "en-GB",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                  },
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {transaction.center?.name}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                                {formatCurrency(transaction.amount)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {transaction.amountType}
                              </td>
                              {activeTab === "outward" ? (
                                <>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {formatCurrency(stored.bookingCommission)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {formatCurrency(stored.centerCommission)}
                                  </td>
                                </>
                              ) : (

                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {formatCurrency(stored.bookingCommission)}
                                  </td>

                              )}
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {transaction.receiverName}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {transaction.senderName}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {transaction.remark || "-"}
                              </td>
                              <td className="px-4 py-3 text-center text-sm">
                                <div className="flex justify-center space-x-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRowClick(transaction);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                    title="Edit"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingTransaction(transaction);
                                      handleDelete();
                                    }}
                                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                    title="Delete"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Desktop Table - All Columns */}
                  <div className="hidden lg:block">
                    <div className="w-full overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 text-white">
                            <th className="px-4 py-3 text-left text-sm font-bold">
                              Token
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-bold">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-bold">
                              Time
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-bold">
                              Center
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-bold">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-bold">
                              Amount Type
                            </th>
                            {activeTab === "outward" ? (
                              <>
                                <th className="px-4 py-3 text-left text-sm font-bold">
                                  Booking Comm
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-bold">
                                  Center Comm
                                </th>
                              </>
                            ) : (
                              <th className="px-4 py-3 text-left text-sm font-bold">
                                Cutting Comm
                              </th>
                            )}
                            <th className="px-4 py-3 text-left text-sm font-bold">
                              Receiver Name
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-bold">
                              Sender Name
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-bold">
                              Remark
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-bold">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedFilteredTransactions.map((transaction, index) => {
                            const stored = getStoredCommissions(transaction);
                            return (
                            <tr
                              key={transaction.id}
                              onClick={() => handleRowClick(transaction)}
                              className={`border-b cursor-pointer transition-colors ${
                                index % 2 === 0
                                  ? "bg-white/90 hover:bg-orange-50/70"
                                  : "bg-orange-50/45 hover:bg-orange-100/55"
                              }`}
                            >
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <span className="inline-flex items-center">
                                  {transaction.tokenNo}
                                  <UpdatedEntryBadge
                                    createdAt={transaction.createdAt}
                                    updatedAt={transaction.updatedAt}
                                  />
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {new Date(transaction.date).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "2-digit",
                                  },
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {new Date(transaction.time).toLocaleTimeString(
                                  "en-GB",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                  },
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {transaction.center?.name}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                                {formatCurrency(transaction.amount)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {transaction.amountType}
                              </td>
                              {activeTab === "outward" ? (
                                <>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {formatCurrency(stored.bookingCommission)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {formatCurrency(stored.centerCommission)}
                                  </td>
                                </>
                              ) : (
                               
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {formatCurrency(stored.bookingCommission)}
                                  </td>
                               
                              )}
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {transaction.receiverName}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {transaction.senderName}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {transaction.remark || "-"}
                              </td>
                              <td className="px-4 py-3 text-center text-sm">
                                <div className="flex justify-center space-x-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRowClick(transaction);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                                    title="Edit"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingTransaction(transaction);
                                      handleDelete();
                                    }}
                                    className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                                    title="Delete"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-3">
                    {sortedFilteredTransactions.map((transaction) => {
                      const stored = getStoredCommissions(transaction);
                      return (
                      <div
                        key={transaction.id}
                        onClick={() => handleRowClick(transaction)}
                        className="bg-gradient-to-br from-white to-orange-50/80 border border-orange-200/60 rounded-lg p-4 hover:bg-orange-50/90 cursor-pointer transition-colors duration-150"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              Token: {transaction.tokenNo}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-blue-600 text-sm">
                              {formatCurrency(transaction.amount)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                          <div>
                            <span className="font-medium">Date:</span>{" "}
                            {new Date(transaction.date).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                              },
                            )}
                          </div>
                          <div>
                            <span className="font-medium">Time:</span>{" "}
                            {new Date(transaction.time).toLocaleTimeString(
                              "en-GB",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              },
                            )}
                          </div>
                          <div>
                            <span className="font-medium">Center:</span>{" "}
                            {transaction.center?.name}
                          </div>
                          {activeTab === "outward" ? (
                            <>
                              <div>
                                <span className="font-medium">Booking:</span>{" "}
                                {formatCurrency(stored.bookingCommission)}
                              </div>
                              <div>
                                <span className="font-medium">Center:</span>{" "}
                                {formatCurrency(stored.centerCommission)}
                              </div>
                            </>
                          ) : (
                              <div>
                                <span className="font-medium">Cutting:</span>{" "}
                                {formatCurrency(stored.bookingCommission)}
                              </div>
                          )}
                        </div>

                        <div className="border-t pt-2">
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div>
                              <span className="font-medium">Receiver:</span>{" "}
                              {transaction.receiverName}
                            </div>
                            <div>
                              <span className="font-medium">Sender:</span>{" "}
                              {transaction.senderName}
                            </div>
                          </div>
                          {transaction.remark && (
                            <div className="mt-2 text-xs text-gray-600">
                              <span className="font-medium">Remark:</span>{" "}
                              {transaction.remark}
                            </div>
                          )}

                          {/* Actions for mobile */}
                          <div className="border-t pt-3 mt-3 flex justify-end space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(transaction);
                              }}
                              className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded text-xs font-medium hover:bg-blue-50 border border-blue-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTransaction(transaction);
                                handleDelete();
                              }}
                              className="text-red-600 hover:text-red-800 px-3 py-1 rounded text-xs font-medium hover:bg-red-50 border border-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster />
    </>
  );
}
