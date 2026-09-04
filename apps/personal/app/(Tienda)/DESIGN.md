---
name: Tienda Medalla de oro
description: Tienda pública de Joyería Miracles — catálogo de oro y plata para clientes finales, con envíos a todo México.
colors:
  gold-signal: "oklch(66.6% 0.179 58.318)"
  gold-signal-hover: "oklch(55.5% 0.163 48.998)"
  gold-accent: "oklch(76.9% 0.188 70.08)"
  gold-deep: "oklch(47.3% 0.137 46.201)"
  gold-wash: "oklch(96.2% 0.059 95.617)"
  neutral-canvas: "oklch(1 0 0)"
  neutral-ink: "oklch(0.145 0 0)"
  neutral-text-muted: "oklch(0.556 0 0)"
  neutral-border: "oklch(0.922 0 0)"
  alert: "oklch(0.577 0.245 27.325)"
typography:
  display:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 1.1
  title:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
  kicker:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.3em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 700
rounded:
  pill: "9999px"
  control: "8px"
  card: "12px"
  cardLarge: "16px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.gold-signal}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.gold-signal-hover}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
  badge-material:
    backgroundColor: "{colors.gold-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    typography: "{typography.label}"
  card-product:
    backgroundColor: "{colors.neutral-canvas}"
    rounded: "{rounded.card}"
  input:
    backgroundColor: "{colors.neutral-canvas}"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "0 12px"
---

# Design System: Tienda Medalla de oro

## Overview

**Creative North Star: "El Escaparate Cálido"**

Esta es la vitrina pública de Joyería Miracles — el único lugar de todo el proyecto donde el visitante no opera ni administra nada, solo mira, se enamora de una pieza y compra. El sistema es claro y luminoso por default (al revés del Portal Medalla de oro, que es oscuro y funcional), con un solo acento dorado que corre por toda la experiencia: insignias de material, textos de marca, y — a partir de esta revisión — los propios botones de compra, unificando lo que hoy está roto en dos idiomas visuales distintos (dorado decorativo + negro/blanco funcional).

El idioma visual más distintivo ya existente es el **overlay esmerilado** (`backdrop-blur` translúcido) sobre las fotos de producto y categoría — insignias de material/talla/figura flotando sobre la imagen, nombres de categoría sobre un listón de vidrio esmerilado. Ese lenguaje, junto con la tipografía en mayúsculas de trazo amplio (`tracking-widest`/`tracking-[0.3em]`) del hero, es lo que le da carácter de joyería fina sin caer en frío/inaccesible — se confirmó explícitamente esta sesión que el tono buscado es **cálido y confiable**, no minimalismo de lujo distante.

**Key Characteristics:**
- Claro por default, con soporte real de modo oscuro (no es un sistema oscuro-primero como el Portal).
- Un acento dorado único (familia `amber`, nunca `yellow`) que ahora cubre tanto lo decorativo como la acción de compra.
- El overlay esmerilado sobre fotografía es el patrón de firma — insignias y etiquetas de categoría flotan sobre la imagen, nunca a su lado en una barra separada.
- Sombra usada como señal de hover (plano en reposo → elevado al interactuar), nunca como decoración ambiental.

## Colors

Paleta cálida sobre fondo claro, con un único acento dorado consistente y un rojo reservado exclusivamente para acciones destructivas reales (quitar del carrito).

### Primary
- **Dorado señal** (oklch(66.6% 0.179 58.318), ≈ `#b45309`/amber-600): color de acción real — "Agregar al carrito", "Comprar", CTAs principales. Antes vivía solo en insignias y el blog; esta revisión lo convierte también en el color de compra, cerrando la inconsistencia más grande del sistema (los botones de acción usaban negro/blanco neutro sin relación con el resto de la marca).
- **Dorado señal (hover)** (oklch(55.5% 0.163 48.998), ≈ `#b45309`→`#9a3412`/amber-700): estado hover/activo de todo lo dorado-acción.
- **Dorado acento** (oklch(76.9% 0.188 70.08), ≈ `#f59e0b`/amber-500): usos decorativos más ligeros — enlaces, texto de precio secundario, íconos, kicker de categoría.
- **Dorado profundo** (oklch(47.3% 0.137 46.201), ≈ `#92400e`/amber-800): fondo de insignia de material ("Plata 925", "Oro 10k") — el uso semántico más antiguo y consistente del sistema, se mantiene tal cual.
- **Dorado lavado** (oklch(96.2% 0.059 95.617), ≈ `#fef3c7`/amber-100): fondos suaves — chips de categoría del blog, washes de sección, nunca para texto.

### Neutral
- **Lienzo** (oklch(1 0 0), blanco puro): fondo de página — la identidad es clara por default, no oscura.
- **Tinta** (oklch(0.145 0 0), ≈ `#0a0a0a`): texto principal, headings.
- **Texto tenue** (oklch(0.556 0 0), ≈ `#8c8c8c`): texto secundario, metadatos, descripciones.
- **Borde** (oklch(0.922 0 0), ≈ `#e5e5e5`): la única forma de separación entre superficies en reposo — 1px, bajo contraste.

### Semantic
- **Alerta** (oklch(0.577 0.245 27.325), ≈ `#dc2626`): exclusivamente para quitar del carrito/favoritos y estados de error real — nunca decorativo.

### Named Rules
**The Amber-Only Rule.** El dorado del sistema es siempre la escala `amber` de Tailwind — nunca `yellow`. Antes de esta revisión coexistían ambas (el CTA del hero usaba `yellow-600`) para lo que visualmente es el mismo color; queda unificado en `amber` en todo el sistema.

**The Gold-Buys Rule.** El dorado ya no es solo decorativo: es el color de cualquier acción que mueve al visitante hacia la compra (agregar al carrito, proceder al pago, "comprar ahora"). Un botón dorado siempre significa "esto me acerca a comprar."

**The Frosted Label Rule.** Cualquier etiqueta que viva sobre una fotografía (material, talla, nombre de categoría) usa un fondo translúcido con `backdrop-blur`, nunca un fondo sólido opaco — es lo que distingue visualmente a esta tienda de un catálogo genérico.

## Typography

**Display/Body Font:** Geist Sans (con `ui-sans-serif, system-ui` de respaldo) — la misma familia que el resto del monorepo; la Tienda no carga hoy una tipografía editorial distinta pese a ser la cara pública de la marca (ver "Qué falta" en el reporte de auditoría — es una oportunidad real, no algo que este documento deba inventar como si ya existiera).
**Mono Font:** Geist Mono — reservado para SKU y el contador de fotos del visor de imágenes.

**Character:** Funcional y legible, con un solo momento de carácter propio: el tratamiento en mayúsculas de trazo muy amplio (`letter-spacing: 0.3em`) del hero y los kickers de sección, que es lo que hoy le da a la tienda su único acento editorial/"boutique" real.

### Hierarchy
- **Display** (800, clamp 2.25rem–3.75rem, 1.1): H1 del hero de home y de categoría.
- **Title** (700, 1.5rem, 1.25): nombre de producto en la página de detalle, títulos de sección.
- **Body** (400, 0.875rem, 1.6): descripciones de producto, párrafos de blog.
- **Label** (500, 0.75rem, 1.2): texto de insignias, filtros.
- **Kicker** (600, 0.6875rem, mayúsculas, letter-spacing 0.3em): "JOYERÍA MIRACLES" sobre el hero, kickers de categoría — el momento tipográfico de firma del sistema.
- **Mono** (700, 0.6875rem): SKU bajo el nombre del producto, contador de fotos en el visor.

### Named Rules
**The One Loud Moment Rule.** El tracking amplio en mayúsculas (kicker) se usa exactamente para anunciar una sección o marca — nunca para párrafos ni para más de una línea. Es un acento tipográfico puntual, no un estilo de párrafo.

## Layout

Contenedor principal `max-w-6xl` centrado (`mx-auto`) en casi toda la tienda — categoría, detalle de producto, blog, carrito, favoritos. El pivote responsive real está dividido en dos capas: el contenido reflows en `sm:` (grids de 1→2→3 columnas), mientras la navegación colapsa a menú móvil en `md:`. El home es la única sección de ancho completo (`min-h-screen`, sin contenedor) para el hero fotográfico.

### Named Rules
**The Two-Breakpoint Rule.** El layout de contenido pivota en `sm:`; la visibilidad de navegación pivota en `md:`. Son decisiones intencionales distintas, no un descuido — no fusionar ambos pivotes al construir una sección nueva.

## Elevation & Depth

Sistema plano en reposo: tarjetas de producto, blog y carrito no llevan sombra al cargar. La sombra aparece exclusivamente como respuesta a interacción — `hover:shadow-md`/`hover:shadow-lg` en tarjetas, nunca como decoración ambiental de una superficie estática. Los overlays reales (visor de imagen a pantalla completa, menú móvil) sí llevan sombra/scrim propio por ser elementos flotantes.

### Shadow Vocabulary
- **Hover de tarjeta** (`shadow-md`/`shadow-lg` según el componente): la única señal de que una tarjeta es interactiva, además del cursor.
- **Scrim de overlay** (`bg-black/90` en el visor de imagen, `bg-black/45`–`bg-black/70` en los heroes fotográficos): oscurece la foto de fondo para que el contenido en primer plano sea legible.

### Named Rules
**The Hover-Elevates Rule.** Ninguna tarjeta tiene sombra en reposo. Si algo tiene sombra sin que el usuario esté interactuando con ella, es un overlay flotante (modal, menú), no una tarjeta de contenido.

## Shapes

Radios por rol, no por tamaño: **píldora** (`rounded-full`) para cualquier insignia o control circular (material, talla, botones de icono); **control** (8px) para botones rectangulares e inputs; **tarjeta** (12px) para imágenes de producto en grid; **tarjeta grande** (16px) para tarjetas de blog y el carrito. Hoy estos dos últimos se mezclan sin regla clara (`rounded-xl` y `rounded-2xl` conviven para el mismo rol de "tarjeta") — este documento fija la distinción hacia adelante: 12px para tarjetas densas (grid de producto), 16px para tarjetas espaciosas (blog, línea de carrito).

## Components

### Buttons
- **Shape:** `rounded-lg` (8px).
- **Primary (acción de compra):** fondo `gold-signal`, texto blanco, `font-semibold`, altura `h-9`–`h-10`. Antes usaba el negro/blanco neutro de shadcn — se corrige aquí.
- **Outline (acción secundaria):** transparente, borde `neutral-border`, texto `neutral-ink` — "Más información", filtros.
- **Hover:** fondo pasa a `gold-signal-hover`, sin cambio de forma.

### Product Card (componente distintivo)
La tarjeta de producto es el componente más importante de toda la tienda — existen hoy dos variantes que deben unificarse hacia la más reciente y pulida (`product-card1.tsx`): insignias esmeriladas flotando sobre la imagen (material dorado profundo arriba-izquierda, talla neutra arriba-derecha), fila de acciones (expandir/agregar) revelada solo al hover en la parte inferior, SKU en mono bajo el nombre, precio centrado en negrita. Sin sombra en reposo, `hover:shadow-md`.

### Badges (Material / Talla / Figura)
- **Style:** `rounded-full`, fondo translúcido con `backdrop-blur` cuando vive sobre una foto, texto blanco, `text-xs`.
- **Color:** material = `gold-deep` (siempre); talla/figura = neutro (nunca dorado — el dorado se reserva para material y para acción de compra, no se reparte entre todas las etiquetas).

### Cards / Containers
- **Corner Style:** 12px (grid denso) / 16px (blog, carrito).
- **Background:** `neutral-canvas` (blanco).
- **Shadow Strategy:** ninguna en reposo (ver Elevation).
- **Border:** 1px `neutral-border` donde aplica (tarjeta de blog, línea de carrito).

### Navigation
- **Style:** dos modos — transparente con texto blanco forzado sobre el hero de home; sólido (`bg-background/95` + `backdrop-blur-sm`) y pegajoso (`sticky top-0`) en el resto de la tienda. Menú móvil debe reflejar exactamente las mismas categorías y enlaces que el menú de escritorio — hoy no lo hace (ver auditoría).

### Image Lightbox (componente de referencia)
El visor de imagen a pantalla completa (`carrusel-producto.tsx`) es el componente técnicamente más completo del sistema: portal a `document.body` para quedar siempre por encima de la navegación, scrim `bg-black/90`, navegación por teclado, controles circulares translúcidos. Es el estándar a seguir para cualquier overlay nuevo (menú, modal de confirmación, etc.).

## Do's and Don'ts

### Do:
- **Do** usar dorado (`amber`) tanto para lo decorativo como para cualquier botón que mueva hacia la compra.
- **Do** usar el overlay esmerilado (`backdrop-blur` translúcido) para cualquier etiqueta sobre fotografía.
- **Do** dejar las tarjetas planas en reposo, con sombra solo al hover.
- **Do** usar el tracking amplio en mayúsculas únicamente para kickers/anuncios de sección, nunca para párrafos.

### Don't:
- **Don't** usar `yellow-*` para nada relacionado con la marca — siempre `amber-*`.
- **Don't** usar negro/blanco neutro para botones de acción de compra — eso es exactamente lo que este documento corrige.
- **Don't** repartir el dorado entre insignias que no son material (talla, figura) — esas se quedan neutras para que el dorado siga significando "esto es material" o "esto es una acción."
- **Don't** dejar un placeholder (`bg-slate-800` sin variante de modo claro, `href="#"`, texto de depuración visible) como si fuera contenido terminado — la tienda es la cara pública del negocio.
