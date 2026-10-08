import type { ClienteEmpresa } from "@/types/clienteEmpresa"

// Los teléfonos se comparan por sus últimos 10 dígitos (sin lada internacional, espacios ni guiones).
export const telNorm = (t: string | null | undefined) => {
  const digitos = (t ?? "").replace(/\D/g, "")
  return digitos.length >= 10 ? digitos.slice(-10) : ""
}
export const emailNorm = (e: string | null | undefined) => (e ?? "").trim().toLowerCase()

/** Contactos (no prospectos) que comparten teléfono o correo con los datos dados. */
export function buscarContactosDuplicados(
  clientes: ClienteEmpresa[],
  datos: { telefono?: string | null; email?: string | null },
  excluirDocumentId?: string,
): ClienteEmpresa[] {
  const tel = telNorm(datos.telefono)
  const correo = emailNorm(datos.email)
  if (!tel && !correo) return []
  return clientes.filter(c =>
    c.tipo !== "prospecto" && c.documentId !== excluirDocumentId &&
    ((!!tel && telNorm(c.telefono) === tel) || (!!correo && emailNorm(c.email) === correo))
  )
}
