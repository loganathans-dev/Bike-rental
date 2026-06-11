import crypto from 'crypto';
import { getRazorpayConfig } from '../config/razorpay.js';

function authHeader() {
  const { keyId, keySecret } = getRazorpayConfig();
  const token = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  return `Basic ${token}`;
}

export async function createRazorpayOrder({ amountInr, receipt, notes = {} }) {
  const amountPaise = Math.round(Number(amountInr) * 100);
  if (!amountPaise || amountPaise < 100) {
    throw new Error('Amount must be at least ₹1');
  }

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.description || 'Failed to create Razorpay order');
  }
  return data;
}

export function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const { keySecret } = getRazorpayConfig();
  const payload = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', keySecret).update(payload).digest('hex');
  return expected === signature;
}

export function getPublicKeyId() {
  return getRazorpayConfig().keyId;
}

export async function createRazorpayRefund({ paymentId, amountInr }) {
  const amountPaise = Math.round(Number(amountInr) * 100);
  if (!amountPaise || amountPaise < 100) {
    throw new Error('Refund amount must be at least ₹1');
  }

  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      amount: amountPaise,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.description || 'Failed to process Razorpay refund');
  }
  return data;
}
