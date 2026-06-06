export type TipoServicio = "lavado" | "aceite" | "afinación" | "llantas" | "frenos" | "verificación" | "gasolina" | "seguro" | "otro"

export type Vehiculo = {
  id:          number
  documentId:  string
  nombre:      string
  marca:       string | null
  modelo:      string | null
  año:         number | null
  placas:      string | null
  color:       string | null
  kmActuales:  number
  notas:       string | null
}

export type VehiculoPayload = Omit<Vehiculo, "id" | "documentId">

export type ServicioVehiculo = {
  id:                  number
  documentId:          string
  vehiculoDocumentId:  string
  tipo:                TipoServicio
  fecha:               string
  costo:               number | null
  km:                  number | null
  notas:               string | null
  proximaFecha:        string | null
  proximoKm:           number | null
}

export type ServicioVehiculoPayload = Omit<ServicioVehiculo, "id" | "documentId">

export const TIPOS_SERVICIO: TipoServicio[] = ["lavado", "aceite", "afinación", "llantas", "frenos", "verificación", "gasolina", "seguro", "otro"]

export const SERVICIO_LABEL: Record<TipoServicio, string> = {
  lavado:        "Lavado",
  aceite:        "Cambio de aceite",
  afinación:     "Afinación",
  llantas:       "Llantas",
  frenos:        "Frenos",
  verificación:  "Verificación",
  gasolina:      "Gasolina",
  seguro:        "Seguro",
  otro:          "Otro",
}

export const SERVICIO_COLOR: Record<TipoServicio, string> = {
  lavado:       "bg-blue-500/10 text-blue-400 border-blue-500/20",
  aceite:       "bg-amber-500/10 text-amber-400 border-amber-500/20",
  afinación:    "bg-orange-500/10 text-orange-400 border-orange-500/20",
  llantas:      "bg-slate-500/10 text-slate-400 border-slate-500/20",
  frenos:       "bg-red-500/10 text-red-400 border-red-500/20",
  verificación: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  gasolina:     "bg-green-500/10 text-green-400 border-green-500/20",
  seguro:       "bg-teal-500/10 text-teal-400 border-teal-500/20",
  otro:         "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
}
