import Commission from '../models/Commission.js';

export function getCommissionPercentage() {
  const pct = Number(process.env.COMMISSION_PERCENTAGE ?? 10);
  return Number.isFinite(pct) && pct >= 0 && pct <= 100 ? pct : 10;
}

export function splitPaymentAmount(totalAmount) {
  const commissionPercentage = getCommissionPercentage();
  const adminAmount = Math.round((totalAmount * commissionPercentage) / 100);
  const shopAmount = totalAmount - adminAmount;
  return { commissionPercentage, adminAmount, shopAmount };
}

export async function recordCommission({ booking, payment }) {
  const { commissionPercentage, adminAmount, shopAmount } = splitPaymentAmount(payment.amount);
  return Commission.create({
    booking_id: booking._id,
    payment_id: payment._id,
    shop_id: booking.shop_id,
    total_amount: payment.amount,
    shop_amount: shopAmount,
    admin_amount: adminAmount,
    commission_percentage: commissionPercentage,
  });
}
