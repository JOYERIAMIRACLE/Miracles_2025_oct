export const MESES_MKT = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
] as const
export type MesEcosistema = typeof MESES_MKT[number]

export type EcosistemaType = {
  id:               number
  documentId:       string
  mes:              MesEcosistema
  anio:             number
  canal:            string | null
  impresiones:      number
  visitas:          number
  clics:            number
  leads:            number
  contactosNuevos:  number
  compras:          number
  montoCompras:     number
  notas:            string | null
  createdAt?:       string
  updatedAt?:       string
}

export type EcosistemaPayload = Omit<EcosistemaType, "id" | "documentId" | "createdAt" | "updatedAt">
