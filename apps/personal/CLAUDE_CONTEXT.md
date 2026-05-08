# Contexto del proyecto — Joyería Miracles

## Stack
- **Frontend:** Next.js 15.5 + React 19 + TypeScript + Tailwind v4 + shadcn/ui + Zustand + Sonner
- **Backend:** Strapi 5 con SQLite en desarrollo / PostgreSQL en producción
- **Variable principal:** `NEXT_PUBLIC_BACKEND_URL=http://localhost:1337`

---

## Estructura de carpetas

```
fronten_miracles/
  app/
    (auth)/            → login, register — layout limpio sin navbar
    (Tienda)/          → tienda pública — layout con navbar y footer
    (admin)/           → panel privado — layout con sidebar
    api/               → Route Handlers de Next.js
  components/
    ui/                → shadcn/ui — NO editar
    shared/            → Navbar, Footer, ThemeProvider, SkeletonSchema
    auth/              → AuthInitializer
    products/          → ProductCard1, ProductGrid
    filters/           → FiltersControlsCategory
  hooks/               → stores Zustand y hooks de lógica (sin fetch a Strapi)
  api/                 → hooks que hacen fetch a Strapi
  lib/                 → funciones puras: utils.ts, strapi.ts, formatPrice.ts
  types/               → interfaces TypeScript: product.ts, response.ts
  middleware.ts        → protege rutas con JWT cookie
```

---

## Tipos principales

```ts
// types/product.ts
export type ProductType = {
  id: number
  documentId: string
  nombreProducto: string
  slug: string
  descripcion: string
  activo: boolean
  isFeatured: boolean
  materialProducto: string
  costo: number
  estiloProducto: string
  imagenes: ImageType[]
  categoria: CategoriaType
}

export type ImageType = {
  id: number
  url: string
  alternativeText: string | null
}

export type CategoriaType = {
  slug: string
  nombreCategoria: string
}
```

---

## Stores Zustand

Todos siguen la estructura: `Tipos → Store → Selectores`

| Archivo | Propósito | localStorage key |
|---|---|---|
| `hooks/useAuthStore.ts` | JWT + usuario | `auth-storage` |
| `hooks/useCart.ts` | Carrito | `cart-storage` |
| `hooks/useFavorites.ts` | Favoritos | `favorite-storage` |

- Todos usan `persist` + `createJSONStorage(() => localStorage)`
- Todos usan `partialize` para no persistir `isLoading` ni `error`
- `useAuthStore` guarda cookie adicional para `middleware.ts` porque el middleware corre en Edge Runtime y no puede leer localStorage

---

## Convenciones de código

### Comentarios
```ts
// ─── Separador de sección ─────────────────────────────────────────────────────
// Usar en: hooks, stores, lib/ — archivos con múltiples bloques

// EN MAYÚSCULAS — describe qué hace el bloque
// Usar en: páginas y componentes con lógica de negocio

// ⚠ NO CAMBIAR EL NOMBRE — rompe localStorage de usuarios existentes
// Usar en: restricciones importantes

// TODO(2025-07): descripción del pendiente
// Usar en: pendientes — siempre con fecha
```

### Console.log
```ts
// Solo en desarrollo — nunca sueltos en producción
if (process.env.NODE_ENV === "development") {
  console.log("label:", variable)
}
```

### Interfaces y tipos
- Sin punto y coma al final de propiedades
- Sin comas al final de métodos en interfaces
- Extensión `.ts` si no tiene JSX, `.tsx` si tiene JSX

---

## Convenciones de nombres

| Tipo | Convención | Ejemplo |
|---|---|---|
| Componentes | PascalCase | `ProductCard1.tsx` |
| Hooks y stores | camelCase con prefijo `use` | `useCart.ts` |
| lib/ y types/ | camelCase singular | `formatPrice.ts`, `product.ts` |
| Páginas Next.js | minúscula fija | `page.tsx`, `layout.tsx` |
| Función del componente | PascalCase | `export default function Page()` |

---

## Orden dentro de una página

```tsx
// 1. HOOKS
const params = useParams()
const { result, loading, error } = useGetProductBySlug(slug)

// 2. LOGS DE DESARROLLO
if (process.env.NODE_ENV === "development") {
  console.log("result:", result)
}

// 3. GUARDS — siempre en este orden
if (loading) return <SkeletonProduct />
if (error) return <p>Error al cargar</p>
if (!result) return <SkeletonProduct />

// 4. RETURN PRINCIPAL
return ( ... )
```

---

## Imágenes — next/image

- Usar `fill` + `aspect-square` + `object-cover` en carousel
- `priority` solo en la primera imagen (`index === 0`)
- `sizes="(max-width: 640px) 100vw, 50vw"` en páginas de detalle
- Dominio de Strapi configurado en `next.config.ts`
- `alt` usa `imagen.alternativeText ?? imagen.url`

---

## Auth

- JWT de Strapi — sin NextAuth
- Flujo: Strapi devuelve JWT → se guarda en localStorage via Zustand persist → se guarda también en cookie para middleware
- Errores de Strapi traducidos al español en `STRAPI_ERRORS` dentro de `useAuthStore.ts`
- Rutas protegidas en `middleware.ts` leyendo cookie `jwt`

---

## Backend Strapi 5

- CORS configurado en `config/middlewares.js` — acepta `http://localhost:3000`
- Plugin `users-permissions` activo para auth
- Campos del modelo de producto: `nombreProducto`, `slug`, `descripcion`, `activo`, `isFeatured`, `materialProducto`, `costo`, `estiloProducto`, `imagenes`, `categoria`
- Campo de precio: `costo` (tipo number)
- Campo de categoría: `categoria.nombreCategoria` y `categoria.slug`
