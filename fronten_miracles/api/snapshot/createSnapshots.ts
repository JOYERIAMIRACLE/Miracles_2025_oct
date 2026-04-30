import { SnapshotCuentaPayload, SnapshotCuentaType, SnapshotMesPayload, SnapshotMesType } from "@/types/snapshot"

export async function createSnapshotCuenta(payload: SnapshotCuentaPayload): Promise<SnapshotCuentaType> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/snapshot-cuentas`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al guardar snapshot de cuenta")
  }
  const json = await res.json()
  return json.data
}

export async function createSnapshotMes(payload: SnapshotMesPayload): Promise<SnapshotMesType> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/snapshot-mes-list`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al guardar snapshot del mes")
  }
  const json = await res.json()
  return json.data
}

export async function updateSnapshotMes(documentId: string, payload: Partial<SnapshotMesPayload>): Promise<SnapshotMesType> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/snapshot-mes-list/${documentId}`
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al actualizar snapshot")
  }
  const json = await res.json()
  return json.data
}

export async function updateSnapshotCuenta(documentId: string, payload: Partial<SnapshotCuentaPayload>): Promise<SnapshotCuentaType> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/snapshot-cuentas/${documentId}`
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al actualizar snapshot")
  }
  const json = await res.json()
  return json.data
}
