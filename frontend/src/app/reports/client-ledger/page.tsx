'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store';
import { transactionApi } from '@/lib/transactions';
import ClientLedgerView from '@/components/reports/client-ledger-view';
import AccountingLoader from '@/components/ui/accounting-loader';
import type { ClientLedgerClient } from '@/lib/client-ledger';

function hasCustomerReportPermission(): boolean {
  const { user } = useAuthStore.getState();
  if (!user?.role?.permissions) return false;
  try {
    const permissions =
      typeof user.role.permissions === 'string'
        ? JSON.parse(user.role.permissions)
        : user.role.permissions;
    return permissions?.reports?.report_6 === true;
  } catch {
    return false;
  }
}

function ClientLedgerPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  const [client, setClient] = useState<ClientLedgerClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!useAuthStore.getState().isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!hasCustomerReportPermission()) {
      router.replace('/dashboard');
      return;
    }
    if (!clientId) {
      setError('No client selected.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    transactionApi
      .getClients()
      .then((clients) => {
        if (cancelled) return;
        const match = clients.find((c) => c.id === clientId);
        if (!match) {
          setError('Client not found.');
          setClient(null);
        } else {
          setClient({
            id: match.id,
            name: match.name,
            knownNames: match.knownNames || [match.name],
            createdAt: match.createdAt,
            mobileNumber: match.mobileNumber,
          });
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load client.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <AccountingLoader message="Loading client ledger..." />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
        <p className="text-gray-700 mb-4">{error || 'Unable to open ledger.'}</p>
        <button
          type="button"
          onClick={() => window.close()}
          className="text-sm text-blue-600 hover:underline"
        >
          Close tab
        </button>
      </div>
    );
  }

  return <ClientLedgerView client={client} />;
}

export default function ClientLedgerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <AccountingLoader message="Loading client ledger..." />
        </div>
      }
    >
      <ClientLedgerPageContent />
    </Suspense>
  );
}
