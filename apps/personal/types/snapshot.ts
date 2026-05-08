// ─── Snapshots de cierre mensual ──────────────────────────────────────────────

export type SnapshotCuentaType = {
  id:               number
  documentId:       string
  mes:              string  // YYYY-MM
  cuentaDocId:      string
  cuentaNombre:     string
  cuentaTipo:       string | null
  cuentaProposito:  string | null
  saldoSistema:     number
  saldoBanco:       number | null
  createdAt?:       string
}

export type SnapshotCuentaPayload = Omit<SnapshotCuentaType, "id" | "documentId" | "createdAt">

export type SnapshotMesType = {
  id:                   number
  documentId:           string
  mes:                  string  // YYYY-MM
  ingresoReal:          number
  gastoReal:            number
  flujoNeto:            number
  ahorroReal:           number
  ahorroAcumulado:      number
  liquidezTotal:        number
  operativaSaldo:       number
  apartadosSaldo:       number
  deudaTotal:           number
  necesidadesReal:      number
  prescindiblesReal:    number
  ingresoPresupuestado: number
  egresoPresupuestado:  number
  createdAt?:           string
}

export type SnapshotMesPayload = Omit<SnapshotMesType, "id" | "documentId" | "createdAt">
