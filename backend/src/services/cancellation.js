const PICKED_UP_STATUSES = new Set(['on_the_way', 'delivered', 'completed']);

export function isBikePickedUp(booking) {
  return PICKED_UP_STATUSES.has(booking.status);
}

export function calculateRefundAmount(booking, paidAmount) {
  if (isBikePickedUp(booking)) {
    return { refundAmount: 0, refundPercentage: 0, reason: 'bike_picked_up' };
  }

  // Use booking.total_price directly to ensure we don't accidentally use paidAmount which might include delivery charges
  const baseAmount = booking ? (booking.total_price || booking.totalPrice || paidAmount) : paidAmount;

  // The user requested to always reduce 5% from the booking total for refunds
  return {
    refundAmount: Math.round(baseAmount * 0.95),
    refundPercentage: 95,
    reason: 'cancelled_by_user',
  };
}
