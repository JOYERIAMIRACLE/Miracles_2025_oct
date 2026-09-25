import { CategoriaPayload, CategoriaType } from "@/types/categoria"
import { authFetch } from "@/lib/auth"

export async function createCategoria(payload: CategoriaPayload): Promise<CategoriaType> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categorias`
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message ?? "Error al crear categoría")
  }
  const json = await res.json()
  return json.data
}
