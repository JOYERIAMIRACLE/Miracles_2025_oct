const BASE    = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const headers = { "Content-Type": "application/json" }

export async function createCategoriaPago(nombre: string) {
  const res = await fetch(`${BASE}/api/categoria-pagos`, {
    method: "POST",
    headers,
    body: JSON.stringify({ data: { nombre } }),
  })
  return res.json()
}

export async function updateCategoriaPago(documentId: string, nombre: string) {
  const res = await fetch(`${BASE}/api/categoria-pagos/${documentId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ data: { nombre } }),
  })
  return res.json()
}

export async function deleteCategoriaPago(documentId: string) {
  await fetch(`${BASE}/api/categoria-pagos/${documentId}`, { method: "DELETE" })
}
