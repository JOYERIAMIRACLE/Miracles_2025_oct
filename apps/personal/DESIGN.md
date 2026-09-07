---
name: Portal Medalla de oro
description: Internal operations console for Joyería Miracles — CRM, ventas, inventario, compras y finanzas en un solo lugar.
colors:
  violet-signal: "oklch(54.1% 0.281 293.009)"
  violet-signal-hover: "oklch(60.6% 0.25 292.717)"
  violet-signal-text: "oklch(70.2% 0.183 293.541)"
  neutral-canvas: "oklch(12.9% 0.042 264.695)"
  neutral-surface: "oklch(20.8% 0.042 265.755)"
  neutral-border: "oklch(27.9% 0.041 260.031)"
  neutral-text-muted: "oklch(55.4% 0.046 257.417)"
  neutral-text-faint: "oklch(70.4% 0.04 256.788)"
  alert: "oklch(63.7% 0.237 25.331)"
  alert-text: "oklch(70.4% 0.191 22.216)"
  success: "oklch(69.6% 0.17 162.48)"
  success-text: "oklch(76.5% 0.177 163.223)"
  warning: "oklch(76.9% 0.188 70.08)"
typography:
  display:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 700
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.violet-signal}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.violet-signal-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-text-muted}"
    rounded: "{rounded.sm}"
    padding: "6px"
  badge-status:
    rounded: "{rounded.full}"
    padding: "2px 8px"
    typography: "{typography.label}"
  card:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.lg}"
  input:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "#f1f5f9"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 12px"
---

# Design System: Portal Medalla de oro

## Overview

**Creative North Star: "El Panel de Control"**

Este no es un producto que se vende a nadie — es la cabina de quienes operan Joyería Miracles todos los días: mover un cliente de lead a pedido, registrar una compra de materia prima, cerrar el mes en finanzas. Cada pantalla existe para que ese trabajo se haga rápido y sin errores, no para impresionar. La densidad de información es una elección deliberada, no un descuido: se prioriza ver todo de un vistazo sobre respirar visualmente, aunque con margen suficiente para que sesiones largas no fatiguen.

El sistema tiene un solo acento de color (violeta) que marca "esto es interactivo o está activo". Todo lo demás — rojo, esmeralda, ámbar — está reservado para estados reales del negocio (alertas, éxito, advertencias), nunca para decorar por categoría. El logo real de la marca (una "M" blanca con un acento verde brillante, #7fea5c) vive en el header y el login, pero deliberadamente **no** entra al sistema de color de la interfaz — se evaluó y se descartó explícitamente esta sesión para no complicar la legibilidad ("tutifruti").

**Key Characteristics:**
- Denso pero con aire: tablas compactas y texto pequeño, con espaciado suficiente entre bloques para no fatigar.
- Un acento, cero decoración por categoría.
- Silencioso y funcional: los componentes existen porque hacen algo, no para verse bien.
- Oscuro por default (slate-950/900), con soporte de tema claro donde aplica.

## Colors

Paleta de alto contraste sobre fondo oscuro, con un único acento saturado y colores semánticos reservados para estados reales.

### Primary
- **Violeta señal** (oklch(54.1% 0.281 293.009), ≈ `#7c3aed`): el único acento decorativo del sistema. Botones primarios, estados activos de navegación, anillos de foco, indicadores "esto está seleccionado/es interactivo". Se usa deliberadamente poco — su escasez es la señal.
- **Violeta señal (hover)** (oklch(60.6% 0.25 292.717), ≈ `#8b5cf6`): estado hover de todo lo violeta.
- **Violeta señal (texto/ícono)** (oklch(70.2% 0.183 293.541), ≈ `#a78bfa`): versión más clara para texto/íconos sobre fondo oscuro, cuando el fill sólido sería demasiado peso.

### Neutral
- **Lienzo** (oklch(12.9% 0.042 264.695), ≈ `#020617`): fondo de página (slate-950).
- **Superficie** (oklch(20.8% 0.042 265.755), ≈ `#0f172a`): cards, tablas, inputs, modales (slate-900).
- **Borde** (oklch(27.9% 0.041 260.031), ≈ `#1e293b`): la única forma de separación visual entre superficies — nunca sombra (slate-800).
- **Texto tenue** (oklch(55.4% 0.046 257.417), ≈ `#64748b`): labels, metadatos, texto secundario (slate-500).
- **Texto muy tenue** (oklch(70.4% 0.04 256.788), ≈ `#94a3b8`): texto terciario, placeholders (slate-400).

### Named Rules
**The Single Accent Rule.** El violeta es el único color decorativo del sistema. Ningún departamento, proceso, categoría o entidad tiene "su color" — eso se hace con texto, íconos o posición, nunca con una paleta arcoíris.

**The Logo-Only Green Rule.** El verde real de la marca (#7fea5c) existe exclusivamente dentro del logotipo renderizado (header, login). Nunca se usa como color de fondo, botón, badge o acento en la interfaz — decisión explícita para no romper la legibilidad de un solo acento.

## Typography

**Display/Body Font:** Geist Sans (con `ui-sans-serif, system-ui` de respaldo)
**Mono Font:** Geist Mono — reservado para folios, SKUs y montos donde la alineación de dígitos importa (`PED-001`, `COT-001`, cantidades tabulares).

**Character:** Neutral y funcional — la tipografía no carga personalidad propia; la jerarquía se construye con tamaño, peso y espaciado, no con cambios de familia.

### Hierarchy
- **Display** (700, 1.5rem–1.75rem, 1.2): títulos de página ("Tareas", "Cotizaciones", "Compras").
- **Title** (600, 0.875rem, 1.3): encabezados de card, nombre de cliente/producto en filas.
- **Body** (400, 0.875rem, 1.4): contenido general de tabla, texto de formularios.
- **Label** (600, 0.6875rem, mayúsculas, letter-spacing 0.05em): encabezados de columna de tabla, badges de estado, metadatos ("PROCESO", "TOTAL", "ESTADO").
- **Mono** (700, 0.6875rem): folios y SKUs (`PED-001`, `O10-ANI-LIS-T6`).

### Named Rules
**The Label-Is-Loud Rule.** El texto más pequeño del sistema (labels en mayúsculas) es también el que más peso de fuente lleva (600–700) — compensa el tamaño diminuto sin subir el tamaño real, manteniendo la densidad.

## Layout

Sidebar fijo (grupos colapsables) + contenido principal con padding `p-4`–`p-6`. Tarjetas KPI en grid de 2–6 columnas (`grid-cols-2 md:grid-cols-6`) que colapsan en móvil. Ritmo vertical con `space-y-2` a `space-y-5` entre bloques — más aire entre secciones grandes, más compacto dentro de una tabla. Breakpoint principal en `md`/`lg` (los layouts de dos columnas — ej. login — pasan de apilado a lado a lado ahí).

## Elevation & Depth

Sistema plano por default: las superficies no llevan sombra en reposo, la separación se logra con `border` de 1px de bajo contraste (`neutral-border` sobre `neutral-canvas`/`neutral-surface`). La sombra se reserva como señal estructural exclusiva de elementos flotantes — modales y overlays — nunca como decoración ambiental.

### Shadow Vocabulary
- **Overlay** (`box-shadow: shadow-2xl`, con `shadow-black/40` en fondos oscuros): modales, popovers, cualquier superficie "sobre todo lo demás".

### Named Rules
**The Flat-At-Rest Rule.** Ninguna superficie en su estado normal lleva sombra. Si algo tiene sombra, es porque está flotando sobre el resto de la interfaz (modal, dropdown), no porque se quiso dar "profundidad".

## Shapes

Esquinas consistentes por rol, no por tamaño de elemento: `rounded-lg` (8px) para controles interactivos (botones, inputs), `rounded-xl` (12px) para contenedores (cards, tablas, modales), `rounded-full` para píldoras de estado y avatares. Sin bordes gruesos ni biselados — siempre 1px, siempre `neutral-border`.

## Components

### Buttons
- **Shape:** `rounded-lg` (8px).
- **Primary:** fondo `violet-signal`, texto blanco, `font-medium`/`font-semibold`, altura `h-8`–`h-10`, padding horizontal `px-3`–`px-4`.
- **Hover:** fondo pasa a `violet-signal-hover`, sin cambio de forma ni sombra.
- **Ghost/Icon:** sin fondo ni borde en reposo; hover añade `bg-neutral-surface` + texto pasa de tenue a claro. Usado para acciones secundarias (editar, eliminar) en filas de tabla.

### Badges (Estado)
- **Style:** `rounded-full`, borde 1px, fondo al 15% de opacidad del color semántico, borde al 30–45%, texto sólido del mismo color. Ejemplo: estado "Rechazada" = fondo rojo/15, borde rojo/30, texto rojo sólido.
- **State:** el color viene siempre de un estado real (Pagado, Convertida, Rechazada, Cancelado) — nunca de una categoría arbitraria (proceso, departamento, tipo de producto).

### Cards / Containers
- **Corner Style:** `rounded-xl` (12px).
- **Background:** `neutral-surface` sobre `neutral-canvas`.
- **Shadow Strategy:** ninguna (ver Elevation).
- **Border:** 1px `neutral-border`.
- **Internal Padding:** `p-4`–`p-6`.

### Inputs / Fields
- **Style:** `rounded-lg`, borde `neutral-border`, fondo `neutral-surface`, altura `h-9`–`h-10`.
- **Focus:** anillo violeta a 50% opacidad + borde violeta a 50% opacidad (`focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50`) — el único momento en que un input "se enciende" es al recibir foco.

### Navigation (Sidebar)
- **Style:** grupos colapsables por sección (Operación, Recursos, Servicios y apps). Item activo: fondo `violet-signal` al 10–15%, texto violeta, barra vertical de 2px violeta al borde derecho. Item inactivo: texto tenue, hover sube a texto claro + fondo de superficie sutil.

### Estado Pill (componente distintivo)
El indicador de estado (badge redondeado semántico) es el componente más repetido y reconocible del sistema — aparece en cotizaciones, pedidos, compras, envíos, tareas. Su receta de color (15% fondo / 30–45% borde / texto sólido) es consistente en todas partes, y es la única razón por la que el sistema "se siente" a color pese a ser mayormente monocromo.

## Do's and Don'ts

### Do:
- **Do** usar violeta como único acento decorativo — botones, foco, estado activo.
- **Do** reservar rojo/esmeralda/ámbar exclusivamente para estados reales del negocio (alerta, éxito, advertencia).
- **Do** usar la receta de badge (15% fondo / 30–45% borde / texto sólido) para cualquier indicador de estado nuevo.
- **Do** usar `font-mono` para folios, SKUs y cualquier dato donde la alineación de dígitos importe.
- **Do** separar superficies con borde de 1px, nunca con sombra.

### Don't:
- **Don't** dar un color propio a un departamento, proceso o categoría — eso se resuelve con texto/posición, no con paleta.
- **Don't** introducir el verde del logo (#7fea5c) como color de UI — se evaluó y se descartó explícitamente; vive solo en el logotipo renderizado.
- **Don't** agregar sombra a una superficie en reposo — solo a elementos flotantes (modal, dropdown).
- **Don't** mezclar familias tipográficas — Geist Sans para todo excepto folios/SKUs/montos en Geist Mono.
