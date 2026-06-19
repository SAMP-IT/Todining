# ToDining — Remotion Explainer Storyboard

A ~90-second animated explainer for **ToDining**, the Smart Restaurant Management SaaS Platform.
Built in Remotion (React), 1920×1080, 30fps. The sequence runs: brand hook → the problem →
the ToDining solution & 30-second journey → the full customer mobile journey → the live
kitchen & waiter boards → the owner/admin suite → multi-restaurant SaaS → tech stack + CTA.

Brand palette used for `accent`: ember/terracotta `#d9521f`, sage `#7c9473`, gold `#c89b3c`,
cream `#f7f1e6`. Display font Fraunces, body Plus Jakarta Sans. Narration is paced for ~14
characters/second so each line comfortably fits its scene duration.

```json
[
  {
    "id": "intro-brand",
    "durationInSeconds": 4,
    "kind": "intro",
    "heading": "ToDining",
    "subhead": "Scan. Order. Dine.",
    "captions": ["Modern dining OS"],
    "narration": "Meet ToDining — one smart platform that runs your entire restaurant.",
    "screenshot": null,
    "accent": "#d9521f"
  },
  {
    "id": "the-problem",
    "durationInSeconds": 5,
    "kind": "statement",
    "heading": "Dining is broken",
    "subhead": "Long waits, lost orders, frazzled staff, paper bills.",
    "captions": ["Waiting to order", "Missed tickets", "Slow checkout"],
    "narration": "Diners wait too long, kitchens lose tickets, and staff drown in chaos. There's a better way.",
    "screenshot": null,
    "accent": "#7c9473"
  },
  {
    "id": "solution-overview",
    "durationInSeconds": 6,
    "kind": "statement",
    "heading": "One platform. Every role.",
    "subhead": "Customer, waiter, kitchen, manager and owner — in sync.",
    "captions": ["Real-time", "Mobile-first", "Multi-restaurant"],
    "narration": "ToDining connects every role on one real-time system, so an order placed at the table reaches the kitchen instantly.",
    "screenshot": "landing.png",
    "accent": "#d9521f"
  },
  {
    "id": "customer-qr-menu",
    "durationInSeconds": 6,
    "kind": "phone",
    "heading": "Scan to order",
    "subhead": "QR opens the menu, the table is detected — no login.",
    "captions": ["Scan QR", "Table auto-detected", "No app needed"],
    "narration": "Guests scan the table QR and the menu opens instantly — no app, no login, the table's already known.",
    "screenshot": "mobile-menu.png",
    "accent": "#d9521f"
  },
  {
    "id": "customer-menu-browse",
    "durationInSeconds": 5,
    "kind": "phone",
    "heading": "A menu that sells",
    "subhead": "Photos, categories and live availability.",
    "captions": ["Starters to combos", "Real photos", "Live availability"],
    "narration": "A beautiful digital menu with photos, clear categories and live availability for every dish.",
    "screenshot": "mobile-menu.png",
    "accent": "#c89b3c"
  },
  {
    "id": "customer-upsell",
    "durationInSeconds": 6,
    "kind": "phone",
    "heading": "Smarter baskets",
    "subhead": "AI upsell suggests the perfect add-on.",
    "captions": ["Add fries for ₹99?", "AI suggestions", "Bigger tickets"],
    "narration": "As they add to cart, AI upselling suggests the perfect extra — like fries for ninety-nine — lifting every check.",
    "screenshot": "mobile-cart-upsell.png",
    "accent": "#d9521f"
  },
  {
    "id": "customer-track",
    "durationInSeconds": 6,
    "kind": "phone",
    "heading": "Track in real time",
    "subhead": "Pending, preparing, ready, served — live.",
    "captions": ["Live timeline", "Preparing → ready", "Zero guessing"],
    "narration": "Once ordered, guests watch a live timeline as their food moves from preparing to ready to served.",
    "screenshot": "mobile-track.png",
    "accent": "#7c9473"
  },
  {
    "id": "customer-service-call",
    "durationInSeconds": 5,
    "kind": "phone",
    "heading": "Help, one tap away",
    "subhead": "Call waiter, water, bill or assistance.",
    "captions": ["Call waiter", "Water · Bill", "Instant ping"],
    "narration": "Need something? One tap calls the waiter, water, the bill or assistance — straight to staff.",
    "screenshot": "mobile-help.png",
    "accent": "#c89b3c"
  },
  {
    "id": "customer-bill-feedback",
    "durationInSeconds": 5,
    "kind": "phone",
    "heading": "Pay and rate",
    "subhead": "Itemized bill with tax, then quick feedback.",
    "captions": ["Auto bill", "Tax + service", "Rate the meal"],
    "narration": "An itemized bill with tax and service charge wraps up the meal, then guests rate the food and service in seconds.",
    "screenshot": "mobile-bill.png",
    "accent": "#d9521f"
  },
  {
    "id": "kitchen-board",
    "durationInSeconds": 5,
    "kind": "dashboard",
    "heading": "The live kitchen",
    "subhead": "Tickets appear instantly; chefs advance each order.",
    "captions": ["Instant tickets", "Tap to advance", "No paper"],
    "narration": "In the kitchen, orders appear the moment they're placed, and chefs advance each ticket with a single tap.",
    "screenshot": "kitchen.png",
    "accent": "#7c9473"
  },
  {
    "id": "waiter-board",
    "durationInSeconds": 5,
    "kind": "dashboard",
    "heading": "The waiter board",
    "subhead": "New and ready orders, active tables, service calls.",
    "captions": ["Ready to serve", "Active tables", "Service requests"],
    "narration": "Waiters see new and ready orders, active tables and every service request on one focused board.",
    "screenshot": "waiter.png",
    "accent": "#c89b3c"
  },
  {
    "id": "admin-orders-tables",
    "durationInSeconds": 5,
    "kind": "dashboard",
    "heading": "Command every order",
    "subhead": "Live table status with built-in QR generation.",
    "captions": ["Order control", "Green · yellow · red", "QR per table"],
    "narration": "Managers command every order, watch live table status in color, and generate a QR code for each table in a click.",
    "screenshot": "admin-tables.png",
    "accent": "#d9521f"
  },
  {
    "id": "admin-menu-reservations",
    "durationInSeconds": 6,
    "kind": "dashboard",
    "heading": "Menu & reservations",
    "subhead": "Edit dishes; approve, reschedule or complete bookings.",
    "captions": ["Edit menu live", "Approve bookings", "Reschedule fast"],
    "narration": "Update the menu in real time, and manage reservations — approve, reschedule, complete or cancel — all in one place.",
    "screenshot": "admin-reservations.png",
    "accent": "#7c9473"
  },
  {
    "id": "admin-inventory-billing",
    "durationInSeconds": 6,
    "kind": "dashboard",
    "heading": "Stock & billing, automated",
    "subhead": "Auto-deduct inventory; bills print, save PDF, archive.",
    "captions": ["Auto-deduct stock", "Low-stock alerts", "Print + PDF"],
    "narration": "Inventory deducts itself on every order with low-stock alerts, while bills print, export to PDF and store in history.",
    "screenshot": "admin-inventory.png",
    "accent": "#c89b3c"
  },
  {
    "id": "admin-feedback-whatsapp",
    "durationInSeconds": 5,
    "kind": "dashboard",
    "heading": "Feedback & WhatsApp",
    "subhead": "See every rating; confirm bookings on WhatsApp.",
    "captions": ["All ratings", "WhatsApp confirms", "Reminders + promos"],
    "narration": "Read every rating to keep improving, and send WhatsApp confirmations, reminders and promos automatically.",
    "screenshot": "admin-notifications.png",
    "accent": "#d9521f"
  },
  {
    "id": "admin-analytics",
    "durationInSeconds": 5,
    "kind": "dashboard",
    "heading": "Know your numbers",
    "subhead": "Revenue, top dishes, peak hours and ratings.",
    "captions": ["Daily revenue", "Top foods", "Peak hours"],
    "narration": "And the analytics dashboard turns it all into insight — revenue trends, top dishes, peak hours and ratings at a glance.",
    "screenshot": "admin-analytics.png",
    "accent": "#7c9473"
  },
  {
    "id": "multi-restaurant",
    "durationInSeconds": 5,
    "kind": "dashboard",
    "heading": "Built for many",
    "subhead": "Every restaurant gets isolated menus, orders and data.",
    "captions": ["One login", "Isolated data", "Scale to chains"],
    "narration": "Run one venue or a whole chain — each restaurant gets fully isolated menus, orders, staff and data.",
    "screenshot": "admin-restaurants.png",
    "accent": "#c89b3c"
  },
  {
    "id": "outro-cta",
    "durationInSeconds": 5,
    "kind": "outro",
    "heading": "Scan. Order. Dine.",
    "subhead": "Powered by React, Supabase and Vercel.",
    "captions": ["Go live today", "todining.app"],
    "narration": "ToDining — built on React and Supabase. Scan, order, dine. Start serving smarter today.",
    "screenshot": "landing.png",
    "accent": "#d9521f"
  }
]
```

**Total runtime: 4+5+6+6+5+6+6+5+5+5+5+5+6+6+5+5+5+5 = 95s**
