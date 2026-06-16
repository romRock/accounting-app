/** Read commission fields exactly as stored on the transaction (display only). */
export function getStoredCommissions(transaction: {
  commission?: number | null;
  bookingCommission?: number | null;
  centerCommission?: number | null;
}) {
  const bookingCommission = Number(transaction.bookingCommission) || 0;
  const centerCommission = Number(transaction.centerCommission) || 0;
  const explicitTotal = Number(transaction.commission) || 0;
  const commission =
    explicitTotal > 0 ? explicitTotal : bookingCommission + centerCommission;

  return {
    commission,
    bookingCommission,
    centerCommission,
  };
}
