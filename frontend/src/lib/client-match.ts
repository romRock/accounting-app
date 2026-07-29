export interface ClientRef {
  id: string;
  name: string;
  knownNames?: string[];
  /** When set, name-based matches only apply to entries from this branch. */
  branchId?: string | null;
}

/** Options for branch-aware name matching. */
export interface ClientMatchOptions {
  /**
   * When true, null entry.branchId is treated as in-scope for this client.
   * Use only when the API response was already branch-scoped (branch users).
   * Super Admin unscoped fetches must keep this false.
   */
  treatNullEntryBranchAsMatch?: boolean;
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
  options?: ClientMatchOptions,
): boolean {
  if (!client.branchId) return true;
  if (!entryBranchId) {
    return options?.treatNullEntryBranchAsMatch === true;
  }
  return entryBranchId === client.branchId;
}

/** ID link is authoritative, but never attribute another branch's stamped row to this client. */
function idMatchAllowsBranch(
  entryBranchId: string | null | undefined,
  client: ClientRef,
): boolean {
  if (!client.branchId) return true;
  if (entryBranchId == null || entryBranchId === '') return true;
  return entryBranchId === client.branchId;
}

export function isTransactionReceiver(
  txn: {
    receiverName?: string | null;
    receiverClientId?: string | null;
    branchId?: string | null;
  },
  client: ClientRef,
  options?: ClientMatchOptions,
): boolean {
  if (client.id && txn.receiverClientId === client.id) {
    return idMatchAllowsBranch(txn.branchId, client);
  }
  if (!branchAllowsNameMatch(txn.branchId, client, options)) return false;
  return nameMatchesClient(txn.receiverName, client);
}

export function isTransactionSender(
  txn: {
    senderName?: string | null;
    senderClientId?: string | null;
    branchId?: string | null;
  },
  client: ClientRef,
  options?: ClientMatchOptions,
): boolean {
  if (client.id && txn.senderClientId === client.id) {
    return idMatchAllowsBranch(txn.branchId, client);
  }
  if (!branchAllowsNameMatch(txn.branchId, client, options)) return false;
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
  options?: ClientMatchOptions,
): boolean {
  return (
    isTransactionReceiver(txn, client, options) ||
    isTransactionSender(txn, client, options)
  );
}

export function isPartyNameMatch(
  name: string | null | undefined,
  client: ClientRef,
  entryBranchId?: string | null,
  options?: ClientMatchOptions,
): boolean {
  if (!branchAllowsNameMatch(entryBranchId, client, options)) return false;
  return nameMatchesClient(name, client);
}

export function accountingEntryInvolvesClient(
  entry: {
    partyId?: string | null;
    party?: { name?: string | null } | null;
    branchId?: string | null;
  },
  client: ClientRef,
  options?: ClientMatchOptions,
): boolean {
  if (client.id && entry.partyId === client.id) {
    return idMatchAllowsBranch(entry.branchId, client);
  }
  if (!branchAllowsNameMatch(entry.branchId, client, options)) return false;
  return nameMatchesClient(entry.party?.name, client);
}
