// ─── Tipos de Cliente ─────────────────────────────────────────────────────────
// Refleja exactamente el schema de Strapi v5:
// backend-store-miracles/src/api/cliente/content-types/cliente/schema.json

export type SegmentoCliente = "Pareja" | "Matrimonio" | "Familiar" | "Personalizado"
export type FunnelCliente   = "Lead" | "Prospecto" | "Negociacion" | "Primera compra" | "Recompra"
export type EstadoCliente   = "Activo" | "Inactivo "

// ─── Entidad principal ────────────────────────────────────────────────────────

export type ClienteType = {
  id:             number
  documentId:     string          // Strapi v5 — usar este para PUT/DELETE
  nombre:         string
  email:          string | null
  telefono:       string | null
  direccion:      string | null
  segmento:       SegmentoCliente | null
  Funnel:         FunnelCliente   | null   // ⚠ Capital F — así está en el schema de Strapi
  canalContacto:  string | null
  origenContacto: string | null
  Estado:         EstadoCliente   | null   // ⚠ Capital E — así está en el schema de Strapi
}

// ─── Payload para crear / editar ──────────────────────────────────────────────
// Strapi espera los campos dentro de { data: {...} }

export type ClientePayload = Omit<ClienteType, "id" | "documentId">
