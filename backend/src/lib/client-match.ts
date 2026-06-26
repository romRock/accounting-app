export interface ClientRef {
  id: string;
  name: string;
  knownNames?: string[];
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function getClientAliases(client: ClientRef): Set<string> {
  const aliases = new Set<string>([
    normalizeName(client.name),
    ...(client.knownNames || []).map(normalizeName),
  ]);
  aliases.delete('');
  return aliases;
}

function nameMatchesClient(
  name: string | null | undefined,
  client: ClientRef,
): boolean {
  const normalized = normalizeName(name || '');
  if (!normalized) return false;
  return getClientAliases(client).has(normalized);
}

export function isTransactionReceiver(
  txn: {
    receiverName?: string | null;
    receiverClientId?: string | null;
  },
  client: ClientRef,
): boolean {
  return (
    (!!client.id && txn.receiverClientId === client.id) ||
    nameMatchesClient(txn.receiverName, client)
  );
}

export function isTransactionSender(
  txn: {
    senderName?: string | null;
    senderClientId?: string | null;
  },
  client: ClientRef,
): boolean {
  return (
    (!!client.id && txn.senderClientId === client.id) ||
    nameMatchesClient(txn.senderName, client)
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
  return nameMatchesClient(name, client);
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
