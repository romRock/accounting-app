export interface ClientRef {
  id: string;
  name: string;
}

export function isTransactionReceiver(txn: {
  receiverName?: string | null;
  receiverClientId?: string | null;
}, client: ClientRef): boolean {
  const clientName = client.name.toLowerCase();
  return (
    (txn.receiverName?.toLowerCase() || '') === clientName ||
    (!!client.id && txn.receiverClientId === client.id)
  );
}

export function isTransactionSender(txn: {
  senderName?: string | null;
  senderClientId?: string | null;
}, client: ClientRef): boolean {
  const clientName = client.name.toLowerCase();
  return (
    (txn.senderName?.toLowerCase() || '') === clientName ||
    (!!client.id && txn.senderClientId === client.id)
  );
}

export function transactionInvolvesClient(
  txn: {
    receiverName?: string | null;
    senderName?: string | null;
    receiverClientId?: string | null;
    senderClientId?: string | null;
  },
  client: ClientRef,
): boolean {
  return isTransactionReceiver(txn, client) || isTransactionSender(txn, client);
}

export function isPartyNameMatch(
  name: string | null | undefined,
  client: ClientRef,
): boolean {
  return (name?.toLowerCase() || '') === client.name.toLowerCase();
}

export function accountingEntryInvolvesClient(
  entry: { partyId?: string | null; party?: { name?: string | null } | null },
  client: ClientRef,
): boolean {
  return (
    (!!client.id && entry.partyId === client.id) ||
    isPartyNameMatch(entry.party?.name, client)
  );
}
