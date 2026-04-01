import { CategoriaPresupuesto } from "@/types/partida-presupuesto"

export type TipoRegistro = "ingreso_variable" | "gasto_extra" | "ahorro_real"

export type RegistroMensualType = {
  id:          number
  documentId:  string
  descripcion: string
  tipo:        TipoRegistro         | null
  monto:       number
  mes:         number               | null  // 1-12
  anio:        number               | null
  categoria:   CategoriaPresupuesto | null
  notas:       string               | null
}

export type RegistroMensualPayload = Omit<RegistroMensualType, "id" | "documentId">
