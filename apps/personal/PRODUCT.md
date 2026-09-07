# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Ricardo (owner/operator)** — uses Personal (calendario, cuentas, presupuesto, tareas, vivienda, salud, alimentación, material digital) for his own life admin, and Segundo Cerebro as a personal, reflective overview of his three ongoing "worlds."
- **Joyería Miracles / Medalla de oro staff** — internal operators who run the jewelry business day to day through Portal Medalla de oro: CRM, ventas (pipeline/cotizaciones/pedidos), inventario, compras de materia prima, finanzas, campañas.
- **Public shoppers** — end customers browsing and buying oro/plata jewelry on the Tienda storefront, with shipping across México.
- **(Dormant/aspirational)** A "trabajo" ambito exists on the shared `Tarea` type (personal/trabajo/empresa) and is described in the app's own internal assistant prompt ("Trabajo: tareas, reuniones, proyectos, calendario, equipos, inventario, sitio web, tickets, campañas, pagos, tutoriales"), but has no live route in `apps/personal` today. Ricardo's actual day job (SDI Industrial) has its own separate, already-built portal (`sdi-portal`) — a different codebase entirely.

## Product Purpose

One Next.js monorepo app serving four connected but distinct purposes under one roof: (1) Ricardo's personal operating system for his own life admin, (2) the internal business-management portal for Joyería Miracles / Medalla de oro, covering the full lead-to-cash flow through finance, (3) the public storefront where that jewelry is actually sold, and (4) Segundo Cerebro — a personal, game-styled dashboard giving Ricardo a spatial, bird's-eye view across his ongoing worlds (his personal brand, the jewelry business, and his day job's portal).

## Positioning

Not a category product sold to strangers — custom-built internal tooling plus a storefront for one specific small jewelry business and its owner. There is no market position to defend; what matters is that it replaces what would otherwise be a patchwork of spreadsheets and generic SaaS with one connected system built exactly around how Medalla de oro and Ricardo actually work.

## Operating Context

- Portal Medalla de oro is used daily by internal staff to move a client from lead → cotización → pedido → entrega, track inventory and materia prima purchases, and reconcile finance — real money and real stock move through these screens, so corrections must reverse their side effects, never just edit a number.
- Segundo Cerebro is opened by Ricardo personally, not by staff — an orienting/reflective tool, not a work queue.
- Backed by Strapi 5 (Railway) + PostgreSQL; frontend on Cloudflare Pages; most write actions call the API directly, many endpoints intentionally public/unauthenticated for internal-tool convenience (established project convention, not an oversight).

## Capabilities and Constraints

- Portal Medalla de oro: CRM/pipeline (Lead → Oferta → Pedido → Entrega funnel on a single evolving `cliente` record — no separate Lead entity, unlike Salesforce/Odoo-style CRMs); cotizaciones → pedidos with real stock checks and full traceability; compras de materia prima with a reversible stock/finance lifecycle; tareas grouped by reorderable, renameable "procesos"; unified finanzas ledger.
- Segundo Cerebro: a Phaser-based interactive office/building map representing personal + business + day-job "sectors" (`richiavrod`, `medallitadeoro`, `sdi-portal`); mirrors the real portal's sidebar structure so each accessible room deep-links out to the actual page.
- Undecided: whether the dormant "trabajo" ambito gets built out inside `apps/personal` or stays exclusive to the separate `sdi-portal` codebase.

## Brand Commitments

- Internal/portal name: **"Medalla de oro"** — deliberately renamed from "Medallitadeoro" in the portal's own UI and URL slug. The public storefront's real name and domain (medallitadeoro.com / medallitadeoro.com.mx) stay untouched and out of scope for this rename.
- Single-accent design system across the whole app: violet is the one decorative accent; red/emerald/amber are reserved for real semantic states (alert/success/warning) only, never used decoratively by category.
- Real logo asset (`identidad-empresa.logo`): a white "M" mark with a bright green chevron accent, transparent PNG. Confirmed this session as the authoritative brand color reference (green + white/black) — overrides the separately stored `colores` text field ("negro, azul marino, rosa oscuro"), which is stale.
- Portal Medalla de oro design priority: **functional, fast to operate**, over ornamental — matches how it has been built so far (dense tables, single accent, minimal decoration). Segundo Cerebro is explicitly allowed to be more expressive/bold; it is not held to the same restraint.

## Evidence on Hand

- Real logo: `identidad-empresa.logo` (hosted on Cloudinary), currently used on the login screen and portal header.
- Real public domain/site: medallitadeoro.com / medallitadeoro.com.mx (Tienda storefront, and the office-map link in Portal Medalla de oro) — explicitly out of scope for any portal/Segundo Cerebro rebrand work.
- No DESIGN.md exists yet for any surface. Portal Medalla de oro's actual token and pattern conventions (violet accent, Tailwind v4, dark theme via next-themes) live only in code today — a `/impeccable document` pass would need to read the code to produce one.

## Product Principles

1. One accent, semantic color only for real states — never decorative-by-category.
2. Real data over invented structure — new organizing mechanisms (procesos de tareas, categorías de recursos) start as free text mirrored from actual usage; formal management (ordering, renaming) gets added later, never invented ahead of real data.
3. Internal tools stay lean and fast over polished — Portal Medalla de oro optimizes for staff completing tasks, not impressing outsiders.
4. Segundo Cerebro can be expressive and bold in ways the business portal deliberately is not — it is Ricardo's own reflective tool, not a shared work surface.
5. Never silently lose or desync data — schema changes are additive; correcting an already-processed record (editing/deleting a received compra, a paid pedido) must reverse its side effects (stock, ledger) rather than leave them stale.
