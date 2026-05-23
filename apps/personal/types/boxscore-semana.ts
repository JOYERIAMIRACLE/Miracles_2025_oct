export type BoxscoreType = {
  id:                   number
  documentId:           string
  semana:               number
  mes:                  string
  anio:                 number
  tasaApertura:         number
  tasaClics:            number
  tasaRechazos:         number
  traficoDirectoCorp:   number
  traficoDirectoStore:  number
  impresionesCorp:      number
  impresionesStore:     number
  traficoOrganicoCorp:  number
  traficoOrganicoStore: number
  impresionesSEM:       number
  traficoPagaSEM:       number
  clicsSEM:             number
  conversionesSEM:      number
  impresionesCYA:       number
  clicsCYA:             number
  conversionesCYA:      number
  impresionesIC:        number
  clicsIC:              number
  conversionesIC:       number
  traficoGeneral:       number
  createdAt?:           string
  updatedAt?:           string
}

export type BoxscorePayload = Omit<BoxscoreType, "id" | "documentId" | "createdAt" | "updatedAt">
