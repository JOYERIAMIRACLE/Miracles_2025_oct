# Medición de la Tienda: cómo etiquetar tus enlaces

La Tienda mide de dónde llega cada visita y cada lead, sin cookies de terceros. Para que
Instagram, Facebook y WhatsApp se distingan entre sí, **cada enlace que pongas fuera del sitio
lleva etiquetas UTM**. Sin ellas, esas visitas caen en "directo" y no se sabe qué funcionó.

## Reglas

- Todo en minúsculas, sin espacios, sin acentos.
- `utm_source`: dónde pusiste el enlace. `utm_medium`: en qué formato. `utm_campaign`: para qué.
- `utm_campaign` siempre como `aaaa-mm_tema`, por ejemplo `2026-10_dia-de-muertos`.
- **Nunca** pongas UTM en enlaces dentro del propio sitio (menús, botones): ensucia los datos.

| utm_source | utm_medium |
|---|---|
| `instagram`, `facebook`, `whatsapp`, `google`, `blog`, `email`, `qr` | `bio`, `post`, `story`, `reel`, `dm`, `status`, `newsletter`, `offline` |

## Enlaces listos para copiar

| Dónde | Enlace |
|---|---|
| Bio de Instagram | `https://medalladeoro.com.mx/?utm_source=instagram&utm_medium=bio&utm_campaign=perfil` |
| Publicación de Instagram | `https://medalladeoro.com.mx/tienda?utm_source=instagram&utm_medium=post&utm_campaign=2026-10_tema` |
| Historia de Instagram | `https://medalladeoro.com.mx/tienda?utm_source=instagram&utm_medium=story&utm_campaign=2026-10_tema` |
| Publicación de Facebook | `https://medalladeoro.com.mx/tienda?utm_source=facebook&utm_medium=post&utm_campaign=2026-10_tema` |
| Estado de WhatsApp | `https://medalladeoro.com.mx/tienda?utm_source=whatsapp&utm_medium=status&utm_campaign=2026-10_tema` |
| Mensaje directo de WhatsApp | `https://medalladeoro.com.mx/producto/SLUG?utm_source=whatsapp&utm_medium=dm&utm_campaign=cotizacion` |
| QR impreso (tarjeta, empaque) | `https://medalladeoro.com.mx/?utm_source=qr&utm_medium=offline&utm_campaign=tarjeta` |

Cambia `2026-10_tema` por el mes y el tema de la campaña. Al abrir el enlace, el sitio guarda el
origen y quita las etiquetas de la barra de direcciones.

## Qué se mide

Solo cinco eventos, anónimos: `page_viewed`, `cart_item_added`, `cart_checkout_started`,
`contact_clicked` (WhatsApp, teléfono o correo) y `search_performed`. Cuando alguien deja sus
datos, el lead guarda el **primer origen** y el **último origen**, y lo que la persona
respondió en "¿Cómo nos conociste?".

No se mide con la señal "No rastrear" del navegador, con la sesión del Portal abierta, ni con
el botón de exclusión del aviso de privacidad.

## Cómo leerlo en el Portal

En Ventas, la pestaña **Tráfico** muestra visitantes, fuentes, páginas y productos más vistos,
campañas y búsquedas, y el embudo visita → producto → carrito → cotización. Tres cuidados:

- "Directo" no es una fuente: es lo que no se pudo identificar. Si es la mayoría, faltan UTM.
- Los bloqueadores de anuncios ocultan parte de las visitas. Compara con Cloudflare Web
  Analytics (dashboard de Cloudflare) y no sumes las dos cifras.
- El origen declarado en "¿Cómo nos conociste?" cubre lo que ninguna herramienta ve, como las
  recomendaciones de boca en boca. Léelo junto al origen medido.
