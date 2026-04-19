
# Vendel Bakes — Plan (updated)

Adding availability + lead time on top of the previously approved plan.

## New: Product availability
Each product has:
- **In stock / Out of stock** toggle (admin)
- **Lead time (days)** — how many days notice you need (default 3 for cakes, you can set per product, e.g. cookies = 1, custom cakes = 3)
- **Available days** — optional checkboxes (e.g. no Sundays)
- **Daily capacity** — optional max orders per day for that item (so you don't get over-booked)

Out-of-stock items show a "Currently unavailable" badge and the Add-to-Cart button is disabled.

## New: "When needed" delivery date picker
On the product page and at checkout:
- A **delivery date picker** appears for every order
- Earliest selectable date = `today + max(lead_time of all items in cart)`
- Days that exceed daily capacity or fall on unavailable days are **greyed out**
- Clear helper text: *"This cake needs 3 days notice — earliest available: Tue 22 Apr"*
- Selected date is saved on the order and shown to you in admin + on the customer tracking page

## Tracking integration
The order timeline now also shows:
- **Requested delivery date**
- Auto-reminder badge in admin 24h before (so you know to start baking)

## DB additions
- `products.lead_time_days` (int, default 3)
- `products.in_stock` (bool)
- `products.available_weekdays` (int[])
- `products.daily_capacity` (int, nullable)
- `orders.requested_delivery_date` (date)

## Build order (unchanged, with availability woven in)
1. Design system + Home + Mission + Story
2. Lovable Cloud (auth, DB with availability fields, storage, RLS)
3. Products + Shop (availability badges) + Cart
4. Checkout (Google Maps shipping + delivery date picker + manual payment)
5. Order tracking + Bykea booking helper
6. Reviews
7. Admin (manage stock, lead time, capacity) + mobile pass + end-to-end test
