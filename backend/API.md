# Bike Rental API Documentation

Base URL: `http://localhost:5001/api` (or your `PORT`)

Auth header for protected routes:

```
Authorization: Bearer <jwt_token>
```

Roles: `customer`, `consultancy`, `admin`

---

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Customer or partner signup |
| POST | `/auth/login` | No | Login (`role`: `admin` \| `consultancy` \| customer) |
| GET | `/auth/me` | Yes | Current user |

---

## Deliveries

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/deliveries` | consultancy, admin | Create delivery for booking |
| GET | `/deliveries` | customer, consultancy, admin | List deliveries (scoped by role) |
| GET | `/deliveries/:id` | customer, consultancy, admin | Get delivery |
| PUT | `/deliveries/:id` | consultancy, admin | Update status / assign staff |
| DELETE | `/deliveries/:id` | consultancy, admin | Delete delivery |

**Auto-create:** Delivery record is created when a booking requests delivery, and again after payment if missing.

**Statuses:** `pending`, `assigned`, `in_transit`, `delivered`, `cancelled`

---

## Damage Inspection

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/inspection/before` | consultancy, admin | Upload pre-ride photos |
| POST | `/inspection/after` | consultancy, admin | Upload post-ride photos + damage report |
| GET | `/inspection/:bookingId` | customer, consultancy, admin | Get inspection for booking |

**Body (before):** `{ bookingId, beforePhotos: [url|base64], damageNotes? }`

**Body (after):** `{ bookingId, afterPhotos: [url|base64], damageNotes?, damageAmount? }`

---

## Reviews & Ratings

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/reviews` | customer | Review completed booking |
| GET | `/reviews` | Yes | List recent reviews |
| GET | `/reviews/bike/:bikeId` | No | Reviews + average rating for bike |
| DELETE | `/reviews/:id` | admin | Delete review |

**Rules:** Only `completed` bookings; one review per customer per booking; bike average rating auto-updated.

---

## Staff

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/staff` | consultancy, admin | List staff (shop-scoped or all for admin) |
| POST | `/staff` | consultancy | Add staff |
| PUT | `/staff/:id` | consultancy | Update staff |
| DELETE | `/staff/:id` | consultancy | Delete staff |

**Roles:** `Manager`, `Delivery Boy`, `Accountant`

---

## Revenue Dashboard

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/dashboard/daily` | admin, consultancy | Today's revenue, bookings, bikes |
| GET | `/dashboard/weekly` | admin, consultancy | Last 7 days |
| GET | `/dashboard/monthly` | admin, consultancy | Current month |
| GET | `/dashboard/top-bikes` | admin, consultancy | Top 10 bikes by revenue (month) |

Returns: `revenueSummary`, `bookingSummary`, `bikeStatistics`

---

## Commissions

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/commissions` | admin, consultancy | List commission splits |
| GET | `/commissions/:id` | admin, consultancy | Get commission record |

**Auto-create:** On successful Razorpay payment. Split uses `COMMISSION_PERCENTAGE` (default 10%).

---

## Rental Extensions

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/extensions` | customer, consultancy, admin | Extend booking end time |
| GET | `/extensions` | customer, consultancy, admin | List extensions |
| PUT | `/extensions/:id` | consultancy, admin | Update extension status |

**Body:** `{ bookingId, newEndTime: ISO date string }`

---

## Cancellation & Refunds

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/cancel-booking` | customer, admin | Cancel booking + calculate refund |
| GET | `/refunds/:id` | customer, admin | Get refund details |

**Refund rules:**

| Condition | Refund |
|-----------|--------|
| Bike picked up (`on_the_way`, `delivered`, `completed`) | 0% |
| Cancel > 24h before start | 100% |
| Cancel > 12h before start | 50% |
| Otherwise | 0% |

---

## Audit Logs

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/admin/audit-logs` | admin | Last 100 audit events |

---

## Existing Core APIs

- `/bikes` — bike CRUD & verification
- `/shops` — shop registration & approval
- `/bookings` — create/list/update status, assign staff, request pickup
- `/payments/razorpay/order` & `/payments/razorpay/verify`
- `/admin/stats` — admin dashboard counters

---

## File uploads

Photos/documents are sent as **HTTPS URLs** or **base64 data URLs** in JSON (`beforePhotos`, `afterPhotos`, bike `images`). Max 10 photos per request; validated server-side.
