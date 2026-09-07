---
score: 21
max_score: 40
p0_count: 1
p1_count: 1
p2_count: 2
p3_count: 1
target: components/Empresa/PortalMDO
target_identity: "file:C:\\Users\\RicardoRodriguezAvil\\Desktop\\Miracles\\apps\\personal\\components\\Empresa\\PortalMDO (Portal Medalla de oro)"
timestamp: 2026-09-03T04-09-09Z
slug: components-empresa-portalmdo-portal-medalla-de-oro
---
# Critique — Portal Medalla de oro (components/Empresa/PortalMDO + Ventas)

Provenance: Assessment A (design review) and Assessment B (detector + browser evidence) ran as two isolated, parallel sub-agents against `apps/personal/components/Empresa/PortalMDO` and its rendered CRM (`apps/personal/components/Empresa/Ventas`), synthesized against `apps/personal/PRODUCT.md` and `apps/personal/DESIGN.md`. Mode: Operate. Detector: 180 findings in PortalMDO, 120 in Ventas (`detect.mjs --json`). Browser evidence: dev server reachable at localhost:3001, login screen screenshotted; authenticated views not reachable (no credentials used, by design).

## Design Health Score — 21/40

| # | Heuristic | Score | Finding |
|---|---|---|---|
| 1 | Visibility of system status | 2/4 | `DashboardCard.tsx` shows "● En vivo" next to "Datos de ejemplo" on the same card; `CampanasPlannerView.tsx`'s monthly objetivo silently saves to `localStorage` with no "this is device-only" signal |
| 2 | Match system ↔ real world | 3/4 | Funnel/folio vocabulary matches how staff talk; but `GestionAvisosModal`'s 6-color picker doesn't match `HeroCarusel`'s 2-color render |
| 3 | User control and freedom | 2/4 | No undo after any delete anywhere; `MerchView.tsx` deletes on one click, zero confirmation — the only such case in the app |
| 4 | Consistency and standards | 1/4 | Ventas (Pipeline/Leads/Cotizaciones/Pedidos/Contactos/Historial) is 100% hardcoded dark (`grep -c "dark:"` = 0 across all 9 files) inside an app whose shell defaults to `system` theme; 3 different delete-confirmation patterns for the same action across the same feature area |
| 5 | Error prevention | 1/4 | `PedidosView.tsx` deletes a pedido with a bare Strapi DELETE — no restock, no `venta-lineas` cleanup, no `transacciones` cleanup — behind a 2-click inline confirm, contradicting PRODUCT.md's own Principle #5 |
| 6 | Recognition rather than recall | 3/4 | Persistent breadcrumbs, `ListToolbar` keeps active filters visible as labeled pills |
| 7 | Flexibility and efficiency | 2/4 | Command-style header search is a real power-user win; but a fully-built `HistorialPipelineView.tsx` (year selector, conversion funnel, drill-down) is wired to a route the portal's own Ventas tabs never link to |
| 8 | Aesthetic / minimalist design | 3/4 | Disciplined density and badge recipe exactly as documented; docked for native `confirm()`/`alert()` breaking the custom-modal language at the highest-stakes moments |
| 9 | Error recovery | 2/4 | Broad `try/catch` → `toast.error()` coverage, but generic messages ("Error al guardar") with no retry path; a multi-line `PedidosView` save has no rollback if line 3 of 5 fails |
| 10 | Help and documentation | 2/4 | Good specific inline microcopy at the one poka-yoke that needs it (`PipelineView.tsx`'s "para que stock y finanzas se actualicen solos"); no persistent help surface, notification bell is permanently empty |

## Design Specificity Verdict

Not a generic admin template. The funnel (`Lead → Oferta → Pedido → Entrega`), the stock-aware cotización→pedido gate, the auto-numbered folios in mono, and `CampanasPlannerView`'s Monday-aligned week math (with a code comment explaining why naive `day/7` math breaks) are all evidence of a system built around this specific jewelry business's actual workflow, not scaffolded from a template. It loses that specificity in two places: `SeccionMision.tsx` (10+ "Pendiente de definir" placeholder tabs) and the openly-fake `DashboardCard`/`HistorialCambiosCard` widgets on the home screen.

## Overall Impression

The business logic is the strongest part of this app — the funnel poka-yoke and stock-aware conversion gate solve real problems most teams would just leave as tribal knowledge. The visual system (violet-only accent, badge recipe, flat-at-rest) is followed with real discipline everywhere it's been applied. But the app is currently two products stitched together: a light/dark-aware PortalMDO shell wrapped around a Ventas/CRM module that is permanently dark regardless of the toggle, with three competing delete-confirmation idioms and — most seriously — a delete path on paid orders that doesn't reverse the stock/payment side effects it created. None of this is a redesign problem; it's a handful of specific, fixable gaps in an otherwise well-built system.

## What's Working

1. **The funnel poka-yoke** (`PipelineView.tsx handleDragEnd`, `NuevoPedidoGateModal`) — you cannot drag a cliente into "Pedido" without a real linked sale, and every drag action has a full keyboard-operable button fallback, without anyone having had to think about accessibility explicitly.
2. **The Estado Pill badge recipe** — 15% bg / 30–45% border / solid text, applied consistently system-wide exactly as DESIGN.md specifies. It's the one place the app "feels like it has color" while staying disciplined everywhere else.
3. **CampanasPlannerView's calendar math** — correctly handles a month with a 5th Monday and a campaign dated the 1st whose Monday falls in the prior month, with an explicit comment on why the naive approach was wrong. Real craftsmanship, easy to have skipped.

## Priority Issues

**P0 — Deleting a pedido doesn't reverse its side effects.**
`PedidosView.tsx handleDelete` calls a bare `DELETE` (`api/ventaEmpresa/getVentas.ts`) with no stock restock, no `venta-lineas` cleanup, and no `transacciones` cleanup, behind a 2-click inline confirm with no mention of consequences. A staff member can delete a Pagado pedido with real payments recorded and stock already decremented, leaving orphaned transactions and wrong stock counts — the exact failure PRODUCT.md's Principle #5 says must never happen.
Fix: block hard-delete once `estado !== "Cotizado"` or once payments are linked; route those cases through a "Cancelar" action that explicitly reverses stock/transacciones, with a confirm that states what will be reversed.
Suggested command: `/impeccable harden components/Empresa/Ventas/PedidosView.tsx`

**P1 — Ventas/CRM ignores the app's own theme toggle.**
Confirmed by detector evidence: `grep -c "dark:"` = 0 across all 9 files in `components/Empresa/Ventas`, while `app/layout.tsx` defaults to `system` theme and `PortalMDOHeader.tsx` ships a theme toggle that silently does nothing once inside Ventas. This is the literal out-of-box experience for any staff member on a light-mode OS opening the module they use most.
Fix: either add `dark:` variants to Ventas so it honors the same toggle as the rest of the app, or commit to dark-only for Ventas and remove the now-misleading toggle from that context.
Suggested command: `/impeccable harden components/Empresa/Ventas`

**P2 — Three delete-confirmation patterns for the same action.**
Native `confirm()` (17 occurrences across 14 files), a styled inline "¿Eliminar? Sí/No" row (`PedidosView.tsx`, `CotizacionesView.tsx`), and no confirmation at all (`MerchView.tsx`) — three idioms for conceptually identical actions in one feature area, with the ungoverned case (`MerchView`) the likeliest place for a real slip.
Fix: standardize on the inline row-confirm pattern already proven in `PedidosView`/`CotizacionesView`; replace every native `confirm()` and the `MerchView` gap with it.
Suggested command: `/impeccable harden components/Empresa`

**P2 — Working analytics aren't reachable from the portal that's supposed to contain them.**
`HistorialPipelineView.tsx` (708 lines: year selector, conversion funnel, monthly evolution, drill-down) is wired only into `app/(AdminEmpresaMiracles)/gestion-empresa/ventas/historial/page.tsx`, a separate route tree `SeccionVentas.tsx`'s own tabs (Pipeline/Leads/Cotizaciones/Pedidos) never link to.
Fix: add a "Métricas"/"Historial" tab to `SeccionVentas.tsx` pointing at the existing component — a routing fix, not new development.
Suggested command: `/impeccable layout components/Empresa/Ventas/SeccionVentas.tsx`

**P3 — The announcement color picker doesn't reflect what actually renders.**
`GestionAvisosModal.tsx` offers 6 real color swatches; `HeroCarusel.tsx`'s render maps collapse everything except red back to violet. Whoever manages comunicados picks a color expecting it to show and it silently doesn't.
Suggested command: `/impeccable clarify components/Empresa/PortalMDO/HeroCarusel.tsx`

## Persona Red Flags

**Alex (Impatient Power User):** `PedidosView`/`CotizacionesView` force a "1 row per client" drill-down as the *only* top-level view — there's no flat, sortable, all-pedidos table, so scanning every "Enviado" order across all clients means opening clients one at a time. The stock-insufficient gate also breaks into a native `confirm()` styled like a browser alert mid-flow, a jarring context switch for someone moving fast.

**Sam (Accessibility-Dependent User):** 48 occurrences of `opacity-0 group-hover:opacity-100` on row-action buttons across 31 files, with zero `group-focus`/`focus-within:opacity` anywhere in the same tree — a keyboard-only user tabbing to edit/delete controls lands on something invisible. Form labels throughout every Ventas modal are plain `<label>` text with no `htmlFor`/`id` pairing to their `<input>` — visual proximity only, no programmatic association for screen readers.

## Minor Observations

- `IndicadoresView.tsx` (1,080 lines of built-out marketing metrics) isn't imported anywhere else in the app — dead code or a lost integration.
- `NotasMejora.tsx` (dev-mode feedback pins) uses orange as its entire visual language — a 4th color outside DESIGN.md's documented palette, likely intentional as "a different mode" but undocumented.
- `MerchView.tsx` codes "stock bajo" as violet in its table and amber in its own chart a few hundred lines later — two colorings for one state in a single file.
- Detector confirms 233 combined font-size hits (8/9/10/12/13px) across both folders that don't match any of DESIGN.md's documented type-ramp steps (24-28/14/11px) — none individually look wrong, but the pattern is systemic rather than incidental.
- Detector's `side-tab` and most `gray-on-color` findings (21 hits) are very likely false positives: `side-tab` matches DESIGN.md's own documented nav treatment, and `gray-on-color` mostly flags Tailwind ternary/hover branches that never co-render at runtime — a detector limitation worth knowing about, not a real design defect list.

## Questions to Consider

1. Given deleting a Pagado pedido currently has zero guardrail, should hard-delete even be reachable once a pedido leaves "Cotizado" — or should every processed order route through a "Cancelar" action that owns its own stock/transacciones reversal?
2. Was Ventas' permanent dark theme ever a deliberate choice, or did the CRM get built before the light/dark system existed? That decides whether the fix is "add dark: variants" or "commit to dark and drop the misleading toggle."
3. `HistorialPipelineView.tsx` already answers "how is the funnel performing this year" in real depth — worth wiring as a fifth Ventas tab, or is it intentionally kept separate for a reason not visible in the code?
