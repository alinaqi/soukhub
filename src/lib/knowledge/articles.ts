import type { KnowledgeArticle } from './types';

/**
 * Knowledge Center content. Authored in-repo so guides version with the
 * product; keep each article actionable and grounded in real console features.
 */
export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  // ── Getting started ────────────────────────────────────────────
  {
    slug: 'store-live-checklist',
    title: 'From zero to a live storefront',
    category: 'getting-started',
    summary: 'The five steps between signing up and your first live listing.',
    minutes: 4,
    body: `
Your storefront goes live the moment you publish your first listing — nothing else is required. Here is the exact path.

1. **Name your store** during onboarding. Your public address becomes soukhub.com/s/your-store — keep it short and memorable; you can refine it later in [Store settings](/settings/store).
2. **Add a product** from [Products](/products). Photos sell phones: shoot front, back, and screen-on against a plain background. Set an honest condition and a price (see the pricing guide for how to use market data).
3. **Publish it.** The first published listing automatically publishes your store. The "View listing" link on the product card takes you to what buyers see.
4. **Fill your Arabic fields.** Half your buyers browse in Arabic. Store name and bio in Arabic take two minutes in [Store settings](/settings/store) and make your storefront feel native rather than translated.
5. **Share the link.** Your storefront URL in a WhatsApp status or group is the fastest first traffic you will get. Every listing also carries an "Order on WhatsApp" button, so buyers can reach you the way they already shop.

> Aim for at least six published listings before promoting the store — a storefront with one item reads as abandoned, six reads as a shop.

## What buyers see

Every published listing gets a public page with your store name, price, condition, delivery and cash-on-delivery notes, web-review stars for the model, and similar devices. Buyers can order online (cash on delivery) or message you on WhatsApp — both land in your [Orders](/orders).
`,
  },
  {
    slug: 'console-tour',
    title: 'A tour of your seller console',
    category: 'getting-started',
    summary: 'What each section does and the daily loop that keeps orders moving.',
    minutes: 5,
    body: `
The console is organized around a daily loop: check orders, confirm with suppliers, pack, ship. Here is what lives where.

- **[Dashboard](/dashboard)** — the morning view: today's orders, supplier status, and anything needing attention.
- **[Orders](/orders)** — every order across every channel: SoukHub buy-online orders next to your Amazon, Cartlow, and Revibe imports, filterable by channel and status.
- **[Packing](/packing) and [Shipping](/shipping)** — checklists for the physical work: what arrived from suppliers, what is packed, what goes out and how.
- **[Products](/products) and [Inventory](/inventory)** — your catalog and stock levels, including "populate from orders" which builds your catalog automatically from order history.
- **[Suppliers](/suppliers)** — who supplies which brands, their delivery times, and the WhatsApp automation that messages them when orders arrive.
- **[Requests](/requests)** — buyer interest from the marketplace catalog and AI trade-in valuations (operator access).
- **[Analytics](/analytics)** — revenue, channels, and product performance.

## The AI assistant works here too

The search bar at the top doubles as an AI operator: ask it "which orders still need supplier confirmation?" or "route today's orders to suppliers" and it acts on your real data — the same operations you would do by hand, faster.

> Set a rhythm: console in the morning (confirm and route), packing after supplier deliveries, shipping before courier cut-offs. Sellers who batch these three sessions handle 3-4x the orders of sellers who react message by message.
`,
  },

  // ── Procurement ────────────────────────────────────────────────
  {
    slug: 'sourcing-uae',
    title: 'Sourcing phones and electronics in the UAE',
    category: 'procurement',
    summary: 'Where UAE sellers actually buy stock, and how to compare channels.',
    minutes: 7,
    body: `
There is no single best source — successful sellers combine three or four channels and let price, speed, and risk decide per product.

## The main channels

- **Authorized distributors** (e.g. major Dubai electronics distributors) — genuine stock with invoices and warranty. Best margins on volume; usually require a trade license and minimum order sizes. This is where "new, sealed" listings should come from.
- **Wholesale markets** — Deira and the computer/phone souks remain the physical hub for mixed and used stock. Inspect everything in person; prices move daily and negotiation is expected.
- **Supplier-on-demand** — the model SoukHub's supplier automation is built for: you list without holding stock, and when an order lands, your supplier confirms availability over WhatsApp and delivers to you the same day. Zero inventory risk, slightly lower margin.
- **Trade-ins and buy-backs** — your own customers are a source. SoukHub's [trade-in requests](/requests) hand you graded devices with an AI condition assessment and a suggested value — often the best-margin used stock you can get.
- **Corporate lot purchases** — companies refreshing fleets sell laptops and phones in lots. Great unit prices, but budget for grading, data-wiping, and the odd dead unit.

## Comparing offers

Always compare on **landed cost per sellable unit**, not sticker price: add delivery, your time, expected refurbishment, and a realistic dead-on-arrival rate. A "cheaper" lot with 10% DOA is often the expensive one.

> Check the market before you commit: search the model on [the marketplace](/search) — the catalog shows live Amazon.ae, Cartlow, and Revibe prices. If your landed cost is not at least 15-20% under the going used price, the deal doesn't clear a margin.

## Start relationships small

Give a new supplier a five-unit order before a fifty-unit one. Track their reliability in [Suppliers](/suppliers) — response time and delivery punctuality matter more than the last dirham of price.
`,
  },
  {
    slug: 'supplier-management',
    title: 'Setting up suppliers and WhatsApp automation',
    category: 'procurement',
    summary: 'Map brands to suppliers once; let the system message them per order.',
    minutes: 5,
    body: `
If you sell on-demand, the supplier loop is your production line. The console automates the repetitive part: telling suppliers what you need, and reading their answers.

## Set it up once

1. Add each supplier in [Suppliers](/suppliers) with their WhatsApp number and typical delivery times (e.g. 10 AM and 4 PM runs).
2. Map **brands to suppliers** — "Apple from Ali Electronics, Samsung from Mobile Hub". Orders route automatically based on these rules, with priority order for backups.
3. Connect WhatsApp in [Communications](/communications) — one QR scan links your number.

## What happens per order

When an order arrives, it routes to the right supplier and a structured WhatsApp message goes out: product, storage, color, condition, and a reply format ("YES / NO / alternative"). Multiple orders to the same supplier batch into one message. The AI reads their reply — English, Arabic, or mixed — and updates the order to confirmed, unavailable, or alternative-offered. Unclear replies are flagged for you instead of guessed at.

## When a supplier says no

The order shows as unavailable with clear next moves: try the backup supplier, offer the buyer an alternative, or cancel cleanly. Handle these the same day — an unavailable order that sits for two days usually becomes a cancellation and a disappointed buyer.

> Keep two suppliers per major brand. The day your primary runs dry is the day the backup relationship pays for every small order you gave it.
`,
  },
  {
    slug: 'grading-used-devices',
    title: 'Grading used devices honestly (and profitably)',
    category: 'procurement',
    summary: 'A practical grading rubric and why strict grading raises margins.',
    minutes: 6,
    body: `
Condition grades are a promise to the buyer. Strict grading feels like leaving money on the table; in practice it buys you reviews, repeat buyers, and fewer returns — which is where used-device margin actually lives.

## The rubric SoukHub uses

- **Excellent** — like new at arm's length: no visible scratches at 30cm, battery health 85%+, fully functional, ideally boxed.
- **Very good** — light signs of use: micro-scratches visible on close inspection, clean screen, battery 80%+.
- **Good** — clearly used: visible scratches on frame or back, screen intact, everything works.
- **Fair** — heavy wear: dents, deep scratches, possibly a replaced part; works reliably.
- **Poor / parts** — cracked or faulty. Don't list these as working devices; sell explicitly for parts or repair.

## The checklist per device

1. Screen: dead pixels, burn-in (grey background test), touch across the whole surface.
2. Battery health (iPhone: Settings → Battery). Under 80%, either replace it or price it into the grade.
3. Cameras front/back, focus, flashlight.
4. Speakers, mics, both during a real call.
5. Charging port and wireless charging where present.
6. **Activation locks removed** — iCloud/Google account signed out, factory reset done in front of the seller when buying in person.
7. IMEI check against blacklists.

> When a device sits between two grades, take the lower one. The AI trade-in assessor is calibrated the same strict way — so the valuations you see in [Requests](/requests) already reflect honest grades.
`,
  },

  // ── Orders & fulfilment ────────────────────────────────────────
  {
    slug: 'handling-orders',
    title: 'Handling orders across all your channels',
    category: 'orders',
    summary: 'One pipeline for SoukHub buy-online orders and marketplace imports.',
    minutes: 6,
    body: `
All orders flow through one pipeline in [Orders](/orders), whatever their source. The channel chips at the top show the mix: SoukHub's own marketplace next to Amazon, Cartlow, and Revibe.

## Where orders come from

- **SoukHub buy-online** — buyers order from your storefront with cash on delivery. These arrive instantly, marked with an SH- reference, with the buyer's WhatsApp number and delivery address attached.
- **WhatsApp orders** — buyers who tap "Order on WhatsApp" on your listing message you directly; log the sale when you confirm it.
- **Marketplace imports** — CSV exports from Amazon Seller Central, Cartlow, and Revibe via [Import](/import). Import at least daily; the parsers detect the format automatically.

## The status ladder

Pending → confirmed → processing → ready to ship → shipped → delivered. Two rules make it work:

1. **Confirm fast.** For SoukHub orders, message the buyer on WhatsApp within the hour — confirmation is the moment a COD buyer decides whether to trust you. For supplier-fulfilled items, confirmation follows the supplier's "YES".
2. **Never skip statuses.** Packing and shipping views build their checklists from status — an order that jumps from pending to shipped never appears on the packing list, and mistakes follow.

## Cash on delivery reality

COD means the sale completes at the door. Reconfirm the address before dispatch, hand the courier the exact amount to collect, and mark payment received when the cash comes back. A confirmed WhatsApp thread before dispatch cuts COD refusals dramatically.

> Watch the Requests inbox too: [catalog requests](/requests) are buyers asking you to source a specific market item — each one is an order you don't have to find demand for.
`,
  },
  {
    slug: 'packing-shipping',
    title: 'Packing and delivery that protect your margin',
    category: 'orders',
    summary: 'Same-day dispatch discipline, packaging that survives, courier maths.',
    minutes: 5,
    body: `
Fulfilment quality is invisible when it's right and expensive when it's wrong. The two failure points are damage in transit and slow dispatch.

## Packing

Work from the [Packing](/packing) checklist after each supplier delivery — check items off as they are boxed so nothing ships half-remembered.

- Phones: bubble wrap, then a box with 2cm of padding all around. The device must not move when shaken.
- Screens face inward, never against a box wall.
- Include what you promised — cable, box, receipt. Surprise extras (a screen protector) cost dirhams and earn reviews.
- Tape the box seam fully; loose flaps invite tampering claims on COD.

## Delivery options, honestly compared

- **Self-delivery** — best for Dubai-dense order books; you control the handover and collect COD yourself. Costs your time; batch by area.
- **Courier per-shipment** — city-to-city and overflow. Compare on collected-COD remittance time, not just the delivery fee — cash stuck at a courier for two weeks is margin you can't reinvest.
- **Marketplace pickups** — Cartlow and Revibe orders follow their own pickup flows; keep those packages separated on the shelf by marketplace, exactly as the [Shipping](/shipping) view groups them.

> Dispatch same-day for orders confirmed before mid-afternoon. "Ordered Monday, delivered Tuesday" is the single strongest driver of repeat COD buyers in the UAE.
`,
  },

  // ── Pricing & trade-ins ────────────────────────────────────────
  {
    slug: 'pricing-with-market-data',
    title: 'Pricing with live market data',
    category: 'pricing',
    summary: 'Use the built-in Amazon/Cartlow/Revibe catalog to price with evidence.',
    minutes: 5,
    body: `
Your marketplace has a built-in price radar: the catalog tracks live Amazon.ae, Cartlow, and Revibe listings with prices and condition grades. Use it before you set any price.

## The method

1. Search your exact model on [the marketplace](/search) — note the **new** price (usually Amazon) and the **graded used** prices (usually Cartlow/Revibe).
2. Position by condition: excellent at roughly 65-75% of new, very good around 55-65%, good near 45-55%. These bands track how UAE buyers actually discount for wear.
3. Undercut the *comparable grade*, not the headline. Beating a "very good" competitor by AED 30-50 wins the sale without giving away margin; beating the "new" price proves nothing.
4. Reprice weekly. Phone prices decay steadily and drop hard when a successor launches — a listing priced three weeks ago is quietly overpriced today.

## Let the assistant do the checking

Ask the console AI: "what's the market price for a Galaxy S23 Ultra in very good condition?" — it reads the same catalog and answers with live comparables.

> Price endings matter less than speed of adjustment. A fairly-priced listing today beats a perfectly-priced listing next week — used stock loses value while it waits.
`,
  },
  {
    slug: 'trade-ins-as-supply',
    title: 'Turning trade-ins into your best supply line',
    category: 'pricing',
    summary: 'How AI valuations work and how to convert them into stock.',
    minutes: 5,
    body: `
Trade-ins are the only sourcing channel where the stock comes to you. Buyers photograph their device on the [trade-in page](/trade-in); AI identifies it, grades the condition, and computes a value from live market comparables. Each request lands in your [Requests](/requests) inbox with the assessment attached.

## Reading a valuation

The AED figure is the *offer* value: median market price for the model, discounted by condition, with the platform margin already applied. It assumes the photos told the truth — the listed defects and confidence score tell you how much to trust it.

## Converting a request

1. Open the request and message the owner on WhatsApp (one tap from the inbox).
2. Confirm the essentials the photos can't show: battery health, activation lock removed, functional issues.
3. Meet, verify against the AI's defect list, and pay the confirmed value — or adjust openly if reality differs from the photos.
4. Refurbish lightly (clean, new protector), photograph well, and list. A trade-in acquired at the AI value and sold at the market's graded price typically clears the healthiest margin in your book.

## Offer exchanges, not just cash

The trade-in flow shows owners what they can exchange against from live listings with exact top-ups. An exchange is two transactions in one visit: you acquire their device below market *and* sell one of yours at full price.

> Respond to trade-in requests within hours. Someone who just valued their phone is actively shopping for its replacement — usually the same day.
`,
  },

  // ── Growth ─────────────────────────────────────────────────────
  {
    slug: 'winning-repeat-buyers',
    title: 'Reviews, trust, and repeat buyers',
    category: 'growth',
    summary: 'The compounding loop that separates stores from listings.',
    minutes: 5,
    body: `
One-off sales pay for stock; repeat buyers pay for your business. The loop is simple and compounds: honest grade → fast delivery → follow-up → repeat order.

## What actually builds trust

- **Grade strictly** (see the grading guide). An under-promised device that over-delivers earns the review that sells the next ten.
- **Fill Arabic fields everywhere** — store bio and listing titles. Buyers trust sellers who speak to them natively.
- **Answer WhatsApp fast.** The "Order on WhatsApp" button makes your response time part of the product.
- **Deliver when you said.** Repeat COD buyers remember reliability more than price.

## Use the CRM you already have

Every order builds a customer profile in [Customers](/customers) — order history, spend, favourite brands. Repeat customers are flagged automatically. Use [Communications](/communications) templates to say thank you after delivery, check in a week later, and announce stock that matches what they buy. A "the iPhone 14s you asked about are in" message to three past buyers outperforms any ad you can buy.

## Let the marketplace work for you

Your listings carry web-review stars, similar-device suggestions, and appear in the marketplace's search and Google-indexed pages — traffic you don't pay for. The more of your catalog is published (not sitting as drafts), the more surface area you have.

> Aim for the second order. Acquisition is expensive; a buyer who ordered twice has a habit.
`,
  },
];
