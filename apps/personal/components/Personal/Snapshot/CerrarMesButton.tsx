"use client"

import { useState } from "react"
import { Archive, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CuentaType } from "@/types/cuenta"
import { createSnapshotCuenta, createSnapshotMes, updateSnapshotMes, updateSnapshotCuenta } from "@/api/snapshot/createSnapshots"
import { SnapshotMesPayload } from "@/types/snapshot"

type Props = {
  mes: string  // YYYY-MM
  cuentas: CuentaType[]
  metricas: Omit<SnapshotMesPayload, "mes">
  // Para detectar si ya hay snapshot del mes y los documentIds existentes
  snapshotMesExistente?: { documentId: string } | null
  snapshotsCuentaExistentes?: { documentId: string; cuentaDocId: string }[]
  onDone?: () => void
}

const saldoDe = (c: CuentaType) => c.saldoActual ?? 0

export function CerrarMesButton({ mes, cuentas, metricas, snapshotMesExistente, snapshotsCuentaExistentes = [], onDone }: Props) {
  const [guardando, setGuardando] = useState(false)
  const yaCerrado = !!snapshotMesExistente

  const cerrarMes = async () => {
    const accion = yaCerrado ? "actualizar" : "guardar"
    if (!confirm(`¿${accion === "actualizar" ? "Actualizar" : "Cerrar"} snapshot del mes ${mes}?\nSe guardarán saldos de ${cuentas.length} cuentas y métricas del Dashboard.`)) return

    setGuardando(true)
    try {
      // 1. Snapshot de métricas del mes
      if (snapshotMesExistente) {
        await updateSnapshotMes(snapshotMesExistente.documentId, { mes, ...metricas })
      } else {
        await createSnapshotMes({ mes, ...metricas })
      }

      // 2. Snapshot de cada cuenta
      const cuentasActivas = cuentas.filter(c => c.activa)
      const existentesPorDoc = new Map(snapshotsCuentaExistentes.map(s => [s.cuentaDocId, s.documentId]))

      for (const c of cuentasActivas) {
        const payload = {
          mes,
          cuentaDocId:     c.documentId,
          cuentaNombre:    c.nombre,
          cuentaTipo:      c.tipo ?? null,
          cuentaProposito: c.proposito ?? null,
          saldoSistema:    saldoDe(c),
          saldoBanco:      c.saldoBanco ?? null,
        }
        const existeId = existentesPorDoc.get(c.documentId)
        if (existeId) {
          await updateSnapshotCuenta(existeId, payload)
        } else {
          await createSnapshotCuenta(payload)
        }
      }

      toast.success(`Mes ${mes} ${yaCerrado ? "actualizado" : "archivado"}`)
      onDone?.()
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar snapshot")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Button onClick={cerrarMes} size="sm" variant={yaCerrado ? "outline" : "default"} disabled={guardando}>
      {guardando ? <Loader2 size={14} className="mr-1 animate-spin" /> : yaCerrado ? <Check size={14} className="mr-1" /> : <Archive size={14} className="mr-1" />}
      {guardando ? "Guardando..." : yaCerrado ? "Actualizar snapshot" : "Cerrar mes"}
    </Button>
  )
}
