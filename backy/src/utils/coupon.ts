import crypto from 'node:crypto';

export function generateCouponCode(prefix = 'COUPON', length = 6): string {
  const randomStr = crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
  return `${prefix}-${randomStr}`;
}