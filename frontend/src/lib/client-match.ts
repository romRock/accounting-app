export interface ClientRef {
  id: string;
  name: string;
  knownNames?: string[];
  /** When set, name-based matches only apply to entries from this branch. */
  branchId?: string | null;
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

/** Name matches must not cross branches when both sides have a branchId. */
function branchAllowsNameMatch(
  entryBranchId: string | null | undefined,
  client: ClientRef,
): boolean {
  if (!client.branchId) return true;
  if (!entryBranchId) return false;
  return entryBranchId === client.branchId;
}

export function isTransactionReceiver(
  txn: {
    receiverName?: string | null;
    receiverClientId?: string | null;
    branchId?: string | null;
  },
  client: ClientRef,
): boolean {
  if (client.id && txn.receiverClientId === client.id) return true;
  if (!branchAllowsNameMatch(txn.branchId, client)) return false;
  return nameMatchesClient(txn.receiverName, client);
}

export function isTransactionSender(
  txn: {
    senderName?: string | null;
    senderClientId?: string | null;
    branchId?: string | null;
  },
  client: ClientRef,
): boolean {
  if (client.id && txn.senderClientId === client.id) return true;
  if (!branchAllowsNameMatch(txn.branchId, client)) return false;
  return nameMatchesClient(txn.senderName, client);
}

export function transactionInvolvesClient(
  txn: {
    receiverName?: string | null;
    senderName?: string | null;
    receiverClientId?: string | null;
    senderClientId?: string | null;
    branchId?: string | null;
  },
  client: ClientRef,
): boolean {
  return isTransactionReceiver(txn, client) || isTransactionSender(txn, client);
}

export function isPartyNameMatch(
  name: string | null | undefined,
  client: ClientRef,
  entryBranchId?: string | null,
): boolean {
  if (!branchAllowsNameMatch(entryBranchId, client)) return false;
  return nameMatchesClient(name, client);
}

export function accountingEntryInvolvesClient(
  entry: {
    partyId?: string | null;
    party?: { name?: string | null } | null;
    branchId?: string | null;
  },
  client: ClientRef,
): boolean {
  if (client.id && entry.partyId === client.id) return true;
  if (!branchAllowsNameMatch(entry.branchId, client)) return false;
  return nameMatchesClient(entry.party?.name, client);
}
