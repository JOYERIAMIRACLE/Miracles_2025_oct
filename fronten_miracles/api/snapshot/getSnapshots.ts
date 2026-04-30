import { useEffect, useState } from "react"
import { SnapshotCuentaType, SnapshotMesType } from "@/types/snapshot"

export function useGetSnapshotsCuenta() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/snapshot-cuentas?pagination[pageSize]=500&sort=mes:desc`
  const [snapshots, setSnapshots] = useState<SnapshotCuentaType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(url)
        const json = await res.json()
        setSnapshots(json.data ?? [])
      } catch (err: any) { setError(err.message) }
      finally { setLoading(false) }
    })()
  }, [url])

  return { snapshots, setSnapshots, loading, error }
}

export function useGetSnapshotsMes() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/snapshot-mes-list?pagination[pageSize]=200&sort=mes:desc`
  const [snapshots, setSnapshots] = useState<SnapshotMesType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(url)
        const json = await res.json()
        setSnapshots(json.data ?? [])
      } catch (err: any) { setError(err.message) }
      finally { setLoading(false) }
    })()
  }, [url])

  return { snapshots, setSnapshots, loading, error }
}
