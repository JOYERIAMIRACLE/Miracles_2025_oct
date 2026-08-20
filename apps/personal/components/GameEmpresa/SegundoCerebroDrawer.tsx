"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { RichiavrodHub }              from "@/components/GameEmpresa/RichiavrodHub"
import { SdiPortalOficinaHub }        from "@/components/GameEmpresa/SdiPortalOficinaHub"
import { MedallitadeoroOficinaHub }   from "@/components/GameEmpresa/MedallitadeoroOficinaHub"
import { AparadorMedallitadeoroPanel } from "@/components/GameEmpresa/AparadorMedallitadeoroPanel"
import { AlmacenPanel } from "@/components/GameEmpresa/AlmacenPanel"
import { TallerRichiavrodPanel }     from "@/components/GameEmpresa/TallerRichiavrodPanel"
import { TallerMedallitadeoroPanel } from "@/components/GameEmpresa/TallerMedallitadeoroPanel"
import { TallerSdiPortalPanel }      from "@/components/GameEmpresa/TallerSdiPortalPanel"

const MIRACLES_ADMIN   = "https://miracles2025oct-production.up.railway.app/admin"
const SDI_PORTAL_ADMIN = "https://sdi-portal-production.up.railway.app/admin"

const LABELS: Record<string, string> = {
  "oficina-richiavrod":      "🏢  Oficina — Richiavrod",
  "almacen-richiavrod":      "🏬  Almacén — Richiavrod",
  "taller-richiavrod":       "🧩  Taller — Richiavrod",
  "oficina-medallitadeoro":  "🏢  Oficina — Medallitadeoro",
  "almacen-medallitadeoro":  "🏬  Almacén — Medallitadeoro",
  "aparador-medallitadeoro": "🪟  Aparador — Medallitadeoro",
  "taller-medallitadeoro":   "🧩  Taller — Medallitadeoro",
  "oficina-sdi":             "🏢  Oficina — SDI Portal",
  "almacen-sdi":             "🏬  Almacén — SDI Portal",
  "taller-sdi":              "🧩  Taller — SDI Portal",
}

function Content({ module }: { module: string }) {
  switch (module) {
    case "oficina-richiavrod":
      return <RichiavrodHub />

    case "taller-richiavrod":
      return <TallerRichiavrodPanel />

    case "almacen-richiavrod":
      return (
        <AlmacenPanel
          titulo="Bodega de richiavrod"
          totalFichas={29}
          adminUrl={MIRACLES_ADMIN}
          notaCompartida="Comparte el mismo Strapi que medallitadeoro — separadas solo por convención, no por servidor."
          estantes={[
            { nombre: "Finanzas personales", fichas: "cuenta, transacción, evento-calendario, partida-presupuesto, categoría, activo, pasivo, meta-ahorro, préstamo-otorgado, registro-mensual, snapshot-mes, snapshot-cuenta, pago-programado" },
            { nombre: "Salud",               fichas: "ejercicio, plan-ejercicio, sesión-gym, métrica-corporal" },
            { nombre: "Hogar y vehículos",   fichas: "vehículo, servicio-vehículo, ingrediente-despensa, item-compra" },
            { nombre: "Cocina",              fichas: "receta, plan-comida" },
            { nombre: "Social",              fichas: "persona-social, evento-social" },
            { nombre: "Práctica freelance",  fichas: "cliente-trabajo, proyecto, reunión, pago-trabajo, ticket" },
          ]}
        />
      )

    case "oficina-medallitadeoro":
      return <MedallitadeoroOficinaHub />

    case "almacen-medallitadeoro":
      return (
        <AlmacenPanel
          titulo="Bodega de medallitadeoro"
          totalFichas={23}
          adminUrl={MIRACLES_ADMIN}
          estantes={[
            { nombre: "Catálogo / Inventario", fichas: "product (con peso, material real y atributos de joya), product-category, catalogo-joyeria" },
            { nombre: "Ventas",                fichas: "venta, venta-linea, cliente, cotización, centro-venta, envío" },
            { nombre: "Materia prima",         fichas: "material, movimiento-material, compra-material, compra-material-linea" },
            { nombre: "Compras (mercancía terminada, en desuso)", fichas: "proveedor, orden-compra — tab quitado de la navegación, datos históricos intactos" },
            { nombre: "Marca / Sitio",         fichas: "identidad-empresa, sitio-web-miracles, blog-post, anuncio" },
          ]}
        />
      )

    case "aparador-medallitadeoro":
      return <AparadorMedallitadeoroPanel />

    case "taller-medallitadeoro":
      return <TallerMedallitadeoroPanel />

    case "oficina-sdi":
      return <SdiPortalOficinaHub />

    case "almacen-sdi":
      return (
        <AlmacenPanel
          titulo="Bodega de SDI Portal"
          totalFichas={47}
          adminUrl={SDI_PORTAL_ADMIN}
          notaCompartida="Backend propio, cuenta de Railway separada de Miracles."
          estantes={[
            { nombre: "Portal general / home / auth", fichas: "acceso-rápido, aviso, portal-empresa, portal-evento, portal-nota-mejora, portal-usuario, portal-herramienta-link..." },
            { nombre: "RH / colaboradores",            fichas: "portal-colaborador, portal-prestación, portal-política" },
            { nombre: "Comercial",                     fichas: "portal-catálogo-comercial" },
            { nombre: "Cadena de suministro",          fichas: "portal-proveedor, portal-importación, portal-inventario, portal-logística, portal-compra, portal-proceso, portal-vehículo" },
            { nombre: "TI / seguridad / legal",        fichas: "portal-política-ti, portal-documento-legal, portal-emergencia, portal-protocolo-hse, portal-normativa" },
            { nombre: "Recursos descargables",         fichas: "portal-recurso, portal-recurso-categoría, portal-formato-mejora" },
            { nombre: "Marketing (Team Marketing)",    fichas: "tarea, campaña, ecosistema-mkt, cdl-métrica, boxscore-semana, material-digital, material-trabajo, pago-trabajo, mkt-catálogo..." },
          ]}
          infraestructura={[
            { label: "Login",     valor: "Strapi nativo (/api/auth/local), JWT propio" },
            { label: "Hosting",   valor: "Railway — build en 2 pasos (copy-admin-build.js)" },
            { label: "Base de datos", valor: "PostgreSQL vía DATABASE_URL" },
            { label: "Integraciones", valor: "Anthropic (Dina), Mailgun, Banxico" },
          ]}
        />
      )

    case "taller-sdi":
      return <TallerSdiPortalPanel />

    default:
      return <p className="p-8 text-sm text-slate-600">Módulo: {module}</p>
  }
}

interface Props {
  module:  string | null
  onClose: () => void
}

export function SegundoCerebroDrawer({ module, onClose }: Props) {
  useEffect(() => {
    if (!module) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [module, onClose])

  return (
    <AnimatePresence>
      {module && (
        <>
          <motion.div
            className="absolute inset-0 z-40"
            style={{ background: "rgba(10,7,20,0.55)", backdropFilter: "blur(2px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="absolute right-0 top-0 bottom-0 z-50 flex flex-col"
            style={{
              width: "min(720px, 72vw)",
              background: "rgba(12,8,20,0.98)",
              borderLeft: "1px solid rgba(167,139,250,0.12)",
              backdropFilter: "blur(24px)",
            }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            <div
              className="flex items-center justify-between px-5 py-3 border-b shrink-0"
              style={{ borderColor: "rgba(167,139,250,0.1)" }}
            >
              <div>
                <p className="text-[8px] font-mono text-violet-400/50 uppercase tracking-[0.2em] mb-0.5">
                  ZONA ACTIVA
                </p>
                <h2 className="text-[13px] font-bold text-slate-200">
                  {LABELS[module] ?? module}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-slate-700">ESC para cerrar</span>
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800/60 rounded-lg transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <Content module={module} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
