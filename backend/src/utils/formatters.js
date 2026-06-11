export function formatBike(bike, shop) {
  const images = (bike.images || []).filter(Boolean);
  return {
    id: bike._id.toString(),
    shopId: bike.shop_id?.toString?.() || bike.shop_id,
    name: bike.bike_name,
    brand: bike.brand,
    vehicleNumber: bike.vehicle_number,
    category: bike.category,
    fuelType: bike.fuel_type,
    mileage: bike.mileage,
    pricePerHour: bike.price_per_hour,
    pricePerDay: bike.price_per_day,
    securityDeposit: bike.security_deposit,
    chassisNumber: bike.chassis_number,
    engineNumber: bike.engine_number,
    rcNumber: bike.rc_number,
    insurancePolicyNumber: bike.insurance_policy_number || '',
    insuranceExpiryDate: bike.insurance_expiry_date ? new Date(bike.insurance_expiry_date).toISOString().split('T')[0] : '',
    rcDocument: bike.rc_book_upload || '',
    insuranceDocument: bike.insurance_document_upload || '',
    description: bike.description,
    isAvailable: bike.availability_status,
    verificationStatus: bike.verification_status,
    image: images[0] || null,
    images,
    rating: bike.rating ?? 4.5,
    location: shop?.city || '',
    shopLat: shop?.location_coordinates?.lat || null,
    shopLng: shop?.location_coordinates?.lng || null,
  };
}

export function formatShop(shop) {
  return {
    id: shop._id.toString(),
    consultancyId: shop.consultancy_id?.toString?.() || shop.consultancy_id,
    name: shop.shop_name,
    owner: shop.owner_name,
    location: [shop.city, shop.state].filter(Boolean).join(', ') || shop.address,
    city: shop.city,
    state: shop.state,
    date: shop.created_at
      ? new Date(shop.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '',
    status: shop.status,
    shopName: shop.shop_name,
    ownerName: shop.owner_name,
    contactNumber: shop.contact_number,
    email: shop.email,
    gstNumber: shop.gst_number,
    address: shop.address,
    pincode: shop.pincode,
    openingTime: shop.opening_time,
    closingTime: shop.closing_time,
    workingDays: shop.working_days,
    minimumAge: String(shop.min_age ?? 18),
    licenseRequired: shop.license_required ? 'Yes' : 'No',
    securityDepositRules: shop.security_deposit_rules,
    cancellationPolicy: shop.cancellation_policy,
    lateReturnCharges: shop.late_return_charges,
    shopLogo: shop.shop_logo || '',
    shopBanner: shop.shop_banner || '',
    shopFrontImage: shop.shop_front_image || '',
    accountHolderName: shop.bank?.account_holder_name || '',
    accountNumber: shop.bank?.account_number || '',
    ifscCode: shop.bank?.ifsc_code || '',
    bankName: shop.bank?.bank_name || '',
    locationLat: shop.location_coordinates?.lat || null,
    locationLng: shop.location_coordinates?.lng || null,
  };
}

export function formatBooking(booking, bike, shop) {
  const images = (bike?.images || []).filter(Boolean);
  return {
    id: booking._id.toString(),
    bikeId: booking.bike_id?.toString?.(),
    shopId: booking.shop_id?.toString?.(),
    customerId: booking.customer_id?.toString?.(),
    bikeName: bike?.bike_name || 'Bike',
    brand: bike?.brand || '',
    location: shop?.city || booking.pickup_location || '',
    startDate: booking.start_datetime,
    endDate: booking.end_datetime,
    totalAmount: booking.total_price,
    status: booking.status === 'booked' ? 'upcoming' : booking.status,
    image: images[0] || null,
    pickupLocation: booking.pickup_location,
    customerName: booking.customer_name || '',
    customerMobile: booking.customer_mobile || '',
    vehicleNumber: bike?.vehicle_number || '',
    is_delivery_requested: booking.is_delivery_requested || false,
    delivery_address: booking.delivery_address || '',
    delivery_charge: booking.delivery_charge || 0,
    delivery_staff_id: booking.delivery_staff_id?.toString?.() || null,
    pickup_requested: booking.pickup_requested || false,
    shopLat: shop?.location_coordinates?.lat || null,
    shopLng: shop?.location_coordinates?.lng || null,
    customerLat: booking.customer_coordinates?.lat || null,
    customerLng: booking.customer_coordinates?.lng || null,
  };
}

export function formatPayment(payment, customer, shopName = '') {
  return {
    id: payment._id.toString(),
    bookingId: payment.booking_id?.toString?.(),
    customer: customer?.full_name || customer?.email || 'Customer',
    shopName: shopName || 'Unknown Shop',
    amount: payment.amount,
    method: payment.payment_method,
    status: payment.payment_status,
    date: payment.paid_at
      ? new Date(payment.paid_at).toISOString().slice(0, 10)
      : '',
    transactionId: payment.transaction_id,
  };
}

export function parseDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  const time = timeStr || '00:00';
  const dt = new Date(`${dateStr}T${time}:00`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function formatStaff(staff) {
  return {
    id: staff._id.toString(),
    staffId: staff._id.toString(),
    shopId: staff.shop_id?.toString?.() || staff.shop_id,
    name: staff.name,
    role: staff.role,
    phone: staff.phone,
    email: staff.email || '',
    status: staff.status,
    createdAt: staff.created_at,
    updatedAt: staff.updated_at,
  };
}

export function formatDelivery(delivery, staff) {
  return {
    id: delivery._id.toString(),
    deliveryId: delivery._id.toString(),
    bookingId: delivery.booking_id?.toString?.() || delivery.booking_id,
    deliveryAddress: delivery.delivery_address,
    deliveryCharge: delivery.delivery_charge,
    deliveryStatus: delivery.delivery_status,
    assignedStaff: delivery.assigned_staff?.toString?.() || null,
    assignedStaffName: staff?.name || null,
    createdAt: delivery.created_at,
    updatedAt: delivery.updated_at,
  };
}

export function formatInspection(inspection) {
  return {
    id: inspection._id.toString(),
    inspectionId: inspection._id.toString(),
    bookingId: inspection.booking_id?.toString?.() || inspection.booking_id,
    beforePhotos: inspection.before_photos || [],
    afterPhotos: inspection.after_photos || [],
    damageNotes: inspection.damage_notes || '',
    damageAmount: inspection.damage_amount || 0,
    status: inspection.status,
    createdAt: inspection.created_at,
    updatedAt: inspection.updated_at,
  };
}

export function formatReview(review, customer) {
  return {
    id: review._id.toString(),
    reviewId: review._id.toString(),
    customerId: review.customer_id?.toString?.() || review.customer_id,
    bookingId: review.booking_id?.toString?.() || review.booking_id,
    bikeId: review.bike_id?.toString?.() || review.bike_id,
    rating: review.rating,
    comment: review.comment || '',
    customerName: customer?.full_name || customer?.email || 'Customer',
    createdAt: review.created_at,
  };
}

export function formatCommission(commission) {
  return {
    id: commission._id.toString(),
    commissionId: commission._id.toString(),
    bookingId: commission.booking_id?.toString?.() || commission.booking_id,
    paymentId: commission.payment_id?.toString?.() || null,
    shopId: commission.shop_id?.toString?.() || null,
    totalAmount: commission.total_amount,
    shopAmount: commission.shop_amount,
    adminAmount: commission.admin_amount,
    commissionPercentage: commission.commission_percentage,
    createdAt: commission.created_at,
  };
}

export function formatExtension(extension) {
  return {
    id: extension._id.toString(),
    extensionId: extension._id.toString(),
    bookingId: extension.booking_id?.toString?.() || extension.booking_id,
    oldEndTime: extension.old_end_time,
    newEndTime: extension.new_end_time,
    extraAmount: extension.extra_amount,
    status: extension.status,
    createdAt: extension.created_at,
  };
}

export function formatRefund(refund) {
  return {
    id: refund._id.toString(),
    refundId: refund._id.toString(),
    bookingId: refund.booking_id?.toString?.() || refund.booking_id,
    customerId: refund.customer_id?.toString?.() || refund.customer_id,
    refundAmount: refund.refund_amount,
    refundPercentage: refund.refund_percentage,
    refundStatus: refund.refund_status,
    customerReason: refund.customer_reason || '',
    refundMethod: refund.refund_method || '',
    refundDetails: refund.refund_details || {},
    reason: refund.reason,
    adminCommission: refund.admin_commission || 0,
    customerPayout: refund.customer_payout || 0,
    processedAt: refund.processed_at,
    createdAt: refund.created_at,
  };
}

export function calculateTotalPrice(bike, start, end, rentalType = 'daily') {
  const ms = end - start;
  if (ms <= 0) return 0;

  const hours = Math.ceil(ms / (1000 * 60 * 60));
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));

  if (rentalType === 'hourly') {
    return hours * (bike.price_per_hour || 0);
  } else {
    // daily
    return days * (bike.price_per_day || bike.price_per_hour * 24);
  }
}
