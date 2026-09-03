---
name: Segundo Cerebro
description: Mapa-juego personal de Ricardo — vista aérea nocturna de sus tres mundos (personal, Medalla de oro, SDI Portal), cada edificio es un acceso directo real.
colors:
  void: "#0a0714"
  grid-line: "#150f24"
  path-thick: "#120c1f"
  path-line: "#1a1330"
  plaza-fill: "#0d0818"
  plaza-ring-outer: "#241a3d"
  plaza-ring-inner: "#1a1330"
  ambient-dot: "#3d2a63"
  lamp-glow: "#ffb877"
  player-cyan: "#00d4ff"
  panel-glass: "rgba(14,9,24,0.98)"
  panel-border: "rgba(167,139,250,0.16)"
  panel-backdrop: "rgba(10,7,20,0.68)"
  building-accent-default: "#a78bfa"
typography:
  hud-label:
    fontFamily: "monospace"
    fontSize: "8px"
    letterSpacing: "0.2em"
  building-label:
    fontFamily: "monospace"
    fontSize: "9px"
    letterSpacing: "1px"
  sector-label:
    fontFamily: "monospace"
    fontSize: "10px"
    letterSpacing: "3px"
  panel-title:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui"
    fontSize: "13px"
    fontWeight: 700
  panel-body:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui"
    fontSize: "0.875rem"
    fontWeight: 400
rounded:
  building: "8px"
  sector: "20px"
  panel: "16px"
spacing:
  sectorPadding: "40px"
components:
  building-box:
    backgroundColor: "{colors.building-accent-default}"
    rounded: "{rounded.building}"
  detail-panel:
    backgroundColor: "{colors.panel-glass}"
    rounded: "{rounded.panel}"
  hud-hint:
    backgroundColor: "{colors.void}"
    textColor: "{colors.player-cyan}"
    typography: "{typography.hud-label}"
---

# Design System: Segundo Cerebro

## Overview

**Creative North Star: "La Ciudad Nocturna"**

Un mapa urbano visto de madrugada: calles apenas visibles bajo una cuadrícula tenue, una plaza central con luz propia, y edificios que brillan cada uno con su propio color — como ventanas encendidas a distintas horas de la noche. El jugador es un punto cian que camina entre ellos. No es un tablero de control ni una app de productividad: es un lugar que se recorre, no una lista que se completa. Esto es exclusivamente de Ricardo — un mapa reflexivo de sus tres mundos (personal, Medalla de oro, SDI Portal), no una herramienta de trabajo compartida.

A diferencia de Portal Medalla de oro (un solo acento, todo plano, cero decoración), aquí la profundidad, el resplandor y el color por edificio son el punto — es la superficie donde el sistema tiene permiso de ser expresivo.

**Key Characteristics:**
- Oscuro, casi negro-violeta, con puntos de luz ambiental dispersos como estrellas.
- Cada edificio elige su propio color (el usuario lo define al crearlo) — no hay una paleta fija por categoría.
- Profundidad real: sombra, halo y vidrio esmerilado, donde el portal de negocio es deliberadamente plano.
- Tipografía monoespaciada para todo lo que pertenece al "mundo del juego" (HUD, etiquetas, prompts); tipografía normal solo para el contenido real dentro de los paneles.

## Colors

Paleta casi monocroma (negro-violeta) con puntos de acento: el cian del jugador, fijo e intransferible, y el color de cada edificio, que es dato del usuario, no un token fijo.

### Primary
- **Cian jugador** (`#00d4ff`): exclusivo del marcador del jugador y su prompt de interacción ("[ E ] ENTRAR"). Es el único color que nunca cambia y nunca se reutiliza en ningún edificio — así siempre se distingue "tú" de "el mundo".

### Secondary
- **Acento de edificio** (default `#a78bfa`, pero el usuario elige el hex real al crear cada identidad con un selector de color): cada edificio construye toda su propia variación (halo, relleno oscurecido, borde, insignia de ícono, franja inferior) a partir de este único valor. Ver "Named Rules" — es una receta, no una paleta cerrada.

### Neutral
- **Vacío** (`#0a0714`): fondo base de todo el mapa.
- **Cuadrícula** (`#150f24` @ 60%): líneas de referencia cada 48px, casi invisibles.
- **Camino** (`#120c1f` grueso / `#1a1330` fino): las dos avenidas que cruzan el mapa hacia la plaza central.
- **Plaza** (`#0d0818` relleno, anillos `#241a3d`/`#1a1330`): el punto de partida del jugador, marcado "🧠 SEGUNDO CEREBRO".
- **Puntas ambientales** (`#3d2a63`, alpha aleatorio 0.05–0.35): 480 puntos dispersos sobre toda el área explorable, puramente atmosféricos.
- **Luz de farola** (`#ffb877`): iluminación de calle a lo largo de las avenidas y de cada camino edificio→plaza. Cálida a propósito — contrasta con el mundo frío violeta/cian, y es la única luz que no pertenece a ningún edificio ni al jugador.

### Named Rules
**The Player-Is-Cyan Rule.** El cian (`#00d4ff`) pertenece exclusivamente al jugador. Ningún edificio, sector ni elemento de UI lo reutiliza — es la única forma de encontrar "dónde estoy" de un vistazo.

**The Building-Owns-Its-Color Rule.** Cada edificio recibe UN hex (elegido por el usuario), y todo su render se deriva matemáticamente de ese valor: relleno oscurecido (r×0.07, g×0.07, b×0.10), halo suave (dos anillos al 5% y 9%), borde (1.5px @ 65%), insignia de ícono (círculo @ 14% relleno + 35% borde), franja inferior (@ 16%). No hay una paleta fija de "categorías" — el color es una decisión del usuario al crear la identidad, no del sistema.

**The Warm Light Rule.** La luz de infraestructura (farolas) es cálida (`#ffb877`); todo lo demás en el mundo es frío (violeta/cian). Esa es la única señal de temperatura de color en todo el sistema — si algo nuevo necesita leerse como "iluminación de la ciudad" en vez de "un edificio" o "el jugador", usa este cálido, no un violeta más.

## Typography

**Game-world font:** monospace (genérica del sistema, sin carga de fuente personalizada) — HUD, etiquetas de edificio, nombres de sector, prompts de interacción. Todo en mayúsculas cuando es una etiqueta de sistema (sector, HUD), tal cual cuando es el nombre real de un edificio.
**Panel content font:** Geist Sans — el contenido real dentro de un panel de detalle (descripciones, texto de negocio) usa la tipografía normal del resto de la app, no monospace.

**Character:** Dos capas deliberadamente distintas: el "mundo del juego" (mapa + HUD) habla en monospace como una terminal; el contenido real que vive dentro de cada edificio habla en la tipografía normal de la app — la frontera entre "estás en el mapa" y "estás leyendo algo" es también una frontera tipográfica.

### Hierarchy
- **Sector label** (mono, 10px, letter-spacing 3px, mayúsculas, alpha 0.55): nombre del sector sobre su zona ("RICHIAVROD", "MEDALLITADEORO", "SDI-PORTAL").
- **Building label** (mono, 9px, letter-spacing 1px): nombre del edificio bajo su ícono.
- **HUD label** (mono, 8px, letter-spacing 0.2em, mayúsculas): eyebrow "ZONA ACTIVA" y equivalentes.
- **Panel title** (Geist Sans, 13px, 700): título del panel de detalle al entrar a un edificio.
- **Panel body** (Geist Sans, 0.875rem, 400): contenido real dentro del panel.

## Layout

Núcleo de 1600×900px (16:9, ajustado para llenar pantallas anchas al cargar sin letterboxing) rodeado de una franja explorable adicional simétrica (1200px horizontal, 675px vertical a cada lado) para navegar en modo aéreo con paneo real — el centro del núcleo (plaza, jugador, cruce de avenidas) sigue siendo el centro del mundo completo. Cuadrícula de referencia cada 48px, extendida a toda el área explorable. Dos avenidas cruzan de borde a borde hacia una plaza circular en el centro (radio 90px), con farolas a intervalos regulares (~190px) a lo largo de todo su recorrido. Los edificios se agrupan automáticamente en "sectores" — un contenedor rectangular calculado a partir de las posiciones reales de sus miembros más un margen (`sectorPadding: 40px`), no posiciones fijas de diseño; arrastrar un edificio o un sector entero reposiciona y recalcula todo en vivo, farolas de su camino incluidas.

## Elevation & Depth

Sistema con profundidad real — lo opuesto deliberado del portal de negocio. Cada edificio lleva sombra proyectada (negro @ 60%, offset +5/+5) y un halo de dos capas en su propio color de acento. El panel de detalle usa vidrio esmerilado real (`backdrop-filter: blur(24px)`) sobre un fondo casi opaco, con una sombra compuesta de dos capas: una sombra dura convencional y un resplandor ambiental violeta difuso.

### Shadow Vocabulary
- **Building shadow** (`fillStyle(0x000000, 0.6)`, offset +5px/+5px): base de cada caja-edificio, siempre presente.
- **Building halo** (2 anillos del color de acento @ 5% y 9%, 6px y 3px de grosor): el "brillo" alrededor de cada edificio.
- **Panel elevation** (`0 30px 80px -20px rgba(0,0,0,0.7), 0 0 60px -10px rgba(167,139,250,0.15)`): sombra dura + resplandor violeta ambiental, exclusiva del panel de detalle al entrar a un edificio.

### Named Rules
**The Ambient Glow Rule.** A diferencia del portal (plano por default), aquí la profundidad y el resplandor son la norma, no la excepción — todo objeto interactivo (edificio, panel) lleva su propio halo.

## Shapes

Esquinas redondeadas consistentes: 8px en edificios, 20px en el contenedor de sector, 16px en el panel de detalle. Los sectores nunca llevan sombra propia, solo relleno tenue (@ 3.5%) y borde (@ 22%) del color heredado de su primer edificio miembro.

## Components

### Building Box (componente distintivo/de firma)
El componente más característico del sistema — una caja arrastrable que representa una identidad real (una sección de la app real a la que da acceso). Receta completa, en orden de dibujado: sombra → halo (2 anillos) → relleno oscurecido del acento → "degradado falso" (acento @ 5% en la mitad superior) → borde + línea de acento superior → insignia circular del ícono → franja inferior. Estado "placeholder" (identidad sin contenido propio todavía): mismo esqueleto pero solo contorno @ 25% y contenido @ 35–45% de opacidad — visualmente "a medio construir" a propósito.

### Sector Container
Rectángulo invisible-hasta-que-se-nota que agrupa edificios por sector: relleno @ 3.5%, borde @ 22%, ambos en el color del primer edificio del grupo. Arrastrable como grupo completo. Su tamaño se recalcula, nunca es fijo.

### Player Marker
Rectángulo cian 10×14px con un halo rectangular de 22×26px @ 8% de opacidad. Único objeto del mapa con movimiento continuo (WASD/flechas) y colisión con los límites del mundo.

### Street Lamp
Poste (línea vertical `#1a1330`) + foco (círculo pequeño @ 90% opacidad) + charco de luz en dos capas concéntricas en el piso (34px @ 4.5% y 18px @ 8%), todo en `#ffb877`. Respira suave (alpha 70%→100%, ciclo aleatorio 1.3–2.2s) para sentirse viva, no estática. Se reparte a lo largo de las avenidas principales (fijas) y de cada camino edificio→plaza (se recalcula junto con el camino cada vez que un edificio o sector se mueve). Importante: se dibuja DESPUÉS del fondo — cualquier capa nueva con profundidad negativa queda tapada por el relleno opaco del fondo, ver nota en el código.

### Detail Panel (drawer)
Modal centrado con vidrio esmerilado: fondo `rgba(14,9,24,0.98)`, borde `rgba(167,139,250,0.16)`, blur de fondo 24px, sombra compuesta (dura + resplandor violeta). Header con eyebrow "ZONA ACTIVA" + título + hint "ESC para cerrar" + botón cerrar fantasma. El fondo detrás del panel (backdrop) es `rgba(10,7,20,0.68)` con blur 3px.

### HUD Hints
Texto flotante monospace sobre fondo `#0a0714` semitransparente (`cc` = ~80% alpha), siempre en la esquina inferior — controles (WASD, zoom) y el prompt "[ E ] ENTRAR" que parpadea sobre el jugador cuando está cerca de un edificio.

## Do's and Don'ts

### Do:
- **Do** dejar que cada edificio defina su propio color — no hay paleta de categoría que respetar.
- **Do** derivar sombra/halo/relleno/borde matemáticamente del color de acento del edificio (ver The Building-Owns-Its-Color Rule) en vez de inventar valores sueltos.
- **Do** usar monospace para todo lo que es "del mapa" (HUD, etiquetas, sectores) y Geist Sans para el contenido real dentro de un panel.
- **Do** dar profundidad real (sombra, halo, vidrio esmerilado) — es lo opuesto intencional del portal de negocio.
- **Do** usar el cálido `#ffb877` para cualquier cosa que sea "iluminación de la ciudad" (farolas y lo que se le parezca) — nunca violeta, ver The Warm Light Rule.
- **Do** crear cualquier capa nueva sobre el fondo (`bgGfx`) DESPUÉS de él, o con profundidad ≥ 0 explícita — una profundidad negativa la esconde debajo del relleno opaco.

### Don't:
- **Don't** reutilizar el cian (`#00d4ff`) en nada que no sea el jugador.
- **Don't** copiar la regla de "un solo acento" del portal aquí — son sistemas hermanos, no el mismo sistema.
- **Don't** fijar el color de un sector aparte del edificio que lo origina — el sector siempre hereda, nunca define.
- **Don't** aplanar el panel de detalle quitándole el vidrio esmerilado o el resplandor — esa profundidad es la firma visual de esta superficie.
