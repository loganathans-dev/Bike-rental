export function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[data-razorpay-checkout]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpayCheckout = 'true';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
    document.body.appendChild(script);
  });
}

export function openRazorpayCheckout({ order, onSuccess, onDismiss }) {
  const options = {
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    name: 'Bike Rental',
    description: 'Bike booking payment',
    order_id: order.orderId,
    prefill: {
      name: order.customer?.name || '',
      email: order.customer?.email || '',
    },
    theme: { color: '#2563eb' },
    handler(response) {
      onSuccess(response);
    },
    modal: {
      ondismiss: onDismiss,
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', (response) => {
    onDismiss(response?.error?.description || 'Payment failed');
  });
  rzp.open();
}
