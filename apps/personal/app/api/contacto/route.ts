import { NextRequest, NextResponse } from "next/server"

const STRAPI = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:1337"
// Si defines STRAPI_API_TOKEN en .env.local se usará para autenticar (recomendado en prod)
const TOKEN  = process.env.STRAPI_API_TOKEN ?? ""

function headers() {
  const h: Record<string, string> = { "Content-Type": "application/json" }
  if (TOKEN) h["Authorization"] = `Bearer ${TOKEN}`
  return h
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nombre, telefono, email, mensaje, interes } = body

    if (!nombre?.trim() || !telefono?.trim()) {
      return NextResponse.json({ error: "Nombre y teléfono son requeridos" }, { status: 400 })
    }

    // 1. Crear cliente en Strapi
    const clienteRes = await fetch(`${STRAPI}/api/clientes`, {
      method:  "POST",
      headers: headers(),
      body: JSON.stringify({
        data: {
          nombre:         nombre.trim(),
          telefono:       telefono.trim(),
          email:          email?.trim() || null,
          origenContacto: "Web",
          canalContacto:  "Formulario",
        },
      }),
    })

    const clienteJson = await clienteRes.json()

    if (!clienteRes.ok || !clienteJson?.data) {
      console.error("Error creando cliente:", clienteJson)
      return NextResponse.json(
        { error: clienteJson?.error?.message ?? "Error al registrar contacto" },
        { status: 500 }
      )
    }

    const clienteId = clienteJson.data.id

    // 2. Crear lead vinculado al cliente
    const leadRes = await fetch(`${STRAPI}/api/leads`, {
      method:  "POST",
      headers: headers(),
      body: JSON.stringify({
        data: {
          cliente:        { connect: [{ id: clienteId }] },
          Funnel:         "Lead",
          origenApp:      "tienda",
          origenContacto: "Web",
          canalContacto:  "Formulario de contacto",
          campanaOrigen:  interes ? `Interés: ${interes}` : undefined,
          notas:          mensaje?.trim() || null,
          fechaLead:      new Date().toISOString(),
        },
      }),
    })

    const leadJson = await leadRes.json()

    if (!leadRes.ok || !leadJson?.data) {
      console.error("Error creando lead:", leadJson)
      return NextResponse.json(
        { error: leadJson?.error?.message ?? "Error al procesar solicitud" },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Error en /api/contacto:", e)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
