"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles } from "lucide-react"
import { RichiavrodHub }              from "@/components/GameEmpresa/RichiavrodHub"
import { SdiPortalOficinaHub }        from "@/components/GameEmpresa/SdiPortalOficinaHub"
import { MedallitadeoroOficinaHub }   from "@/components/GameEmpresa/MedallitadeoroOficinaHub"
import { AparadorMedallitadeoroPanel } from "@/components/GameEmpresa/AparadorMedallitadeoroPanel"
import { ArquitecturaMedallitadeoroPanel } from "@/components/GameEmpresa/ArquitecturaMedallitadeoroPanel"
import { AlmacenPanel } from "@/components/GameEmpresa/AlmacenPanel"
import { TallerRichiavrodPanel }     from "@/components/GameEmpresa/TallerRichiavrodPanel"
import { TallerMedallitadeoroPanel } from "@/components/GameEmpresa/TallerMedallitadeoroPanel"
import { TallerSdiPortalPanel }      from "@/components/GameEmpresa/TallerSdiPortalPanel"
import { MedallitadeoroDataMap }     from "@/components/GameEmpresa/MedallitadeoroDataMap"

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
  "arquitectura-medallitadeoro": "🕸️  Arquitectura — Medallitadeoro",
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
          totalFichas={32}
          adminUrl={MIRACLES_ADMIN}
          notaCompartida="Actualizado contra el sidebar real de portal-medallitadeoro (5 grupos: Inicio/Conoce/Operación/Recursos/Servicios y apps)."
          estantes={[
            { nombre: "Catálogo / Inventario", fichas: "product (con peso, material real y atributos de joya), product-category, catalogo-joyeria" },
            { nombre: "Ventas y Contactos",    fichas: "venta, venta-linea, cliente, cotización, centro-venta, proveedor" },
            { nombre: "Materia prima",         fichas: "material, movimiento-material, compra-material, compra-material-linea" },
            { nombre: "Finanzas",              fichas: "transacción, categoría, cuenta, partida-presupuesto, pago-programado" },
            { nombre: "Operación",             fichas: "tarea, historial-tarea, proyecto, campaña" },
            { nombre: "Recursos y marca",      fichas: "identidad-empresa, sitio-web-miracles, documento-legal, recurso, material-trabajo, material-digital" },
            { nombre: "Sistema",               fichas: "aviso, nota-mejora" },
            { nombre: "Compras de mercancía terminada (en desuso)", fichas: "orden-compra — tab quitado de la navegación, datos históricos intactos. proveedor sí sigue vivo (Contactos, Materia prima)." },
          ]}
          extra={
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-violet-500/60 mb-2.5">
                Cómo se conecta esto
              </p>
              <MedallitadeoroDataMap />
            </div>
          }
        />
      )

    case "aparador-medallitadeoro":
      return <AparadorMedallitadeoroPanel />

    case "taller-medallitadeoro":
      return <TallerMedallitadeoroPanel />

    case "arquitectura-medallitadeoro":
      return <ArquitecturaMedallitadeoroPanel />

    case "oficina-sdi":
      return <SdiPortalOficinaHub />

    case "almacen-sdi":
      return (
        <AlmacenPanel
          titulo="Bodega de SDI Portal"
          totalFichas={54}
          adminUrl={SDI_PORTAL_ADMIN}
          notaCompartida="Backend propio, cuenta de Railway separada de Miracles. El sidebar público se aplanó (ya no departamentos sueltos): Inicio → Conoce a SDI → Recursos → Servicios → Aplicaciones, más la app de Marketing aparte en /marketing."
          estantes={[
            { nombre: "Portal general / home / auth",    fichas: "acceso-rápido, aviso, portal-aviso-banner, portal-empresa, portal-evento, portal-nota-mejora, portal-herramienta-link, portal-usuario (rutas de auth)" },
            { nombre: "Conoce a SDI",                     fichas: "portal-asociacion, portal-colaborador" },
            { nombre: "Recursos (Documentos / Galería / Ingeniería)", fichas: "portal-documento-legal, portal-prestación, portal-política, portal-política-ti, portal-recurso, portal-recurso-categoría, portal-protocolo-hse, portal-normativa" },
            { nombre: "Servicios (Tickets/Evaluaciones/Vacaciones)", fichas: "todavía sin colección propia — placeholders \"contenido pendiente\"" },
            { nombre: "Departamentos (legado, fuera del sidebar pero siguen vivos por URL directa)", fichas: "RH, Administración, TI, Marketing, Cadena, Comercial, Seguridad → portal-emergencia, portal-vehículo, portal-catálogo-comercial, portal-objetivo-comercial, portal-importación, portal-proveedor, portal-compra, portal-logística, portal-inventario, portal-formato-mejora, portal-rol-marketing" },
            { nombre: "Equipo Marketing (app aparte, /marketing)", fichas: "tarea, historial-tarea, tarea-proyecto, campaña, campana-meta, pago-trabajo, categoría-pago, proceso-pago, sitio-web, mkt-mapa-procesos, ecosistema-mkt, boxscore-semana, cdl-métrica, enlace-corto, mkt-respuesta, material-trabajo, material-digital, mkt-catálogo, arbol-roles" },
            { nombre: "Dina (asistente IA) y microsites", fichas: "portal-dina-pregunta, portal-dina-sugerencia, propuesta-concurso" },
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
      return (
        <div className="p-8 flex flex-col items-center text-center gap-3 py-16">
          <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Sparkles size={18} className="text-violet-400" />
          </div>
          <p className="text-sm font-medium text-slate-300">Identidad nueva, sin contenido propio todavía</p>
          <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
            Se creó desde el mapa (o desde Strapi) pero todavía no tiene un panel a la medida — pídele a Claude que le agregue uno cuando quede claro para qué es.
          </p>
        </div>
      )
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
            className="absolute inset-0 z-40 flex items-center justify-center p-4 sm:p-8"
            style={{ background: "rgba(10,7,20,0.68)", backdropFilter: "blur(3px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="flex flex-col z-50 rounded-2xl overflow-hidden w-full"
              style={{
                maxWidth: "880px",
                height: "min(760px, 88vh)",
                background: "rgba(14,9,24,0.98)",
                border: "1px solid rgba(167,139,250,0.16)",
                boxShadow:
                  "0 30px 80px -20px rgba(0,0,0,0.7), 0 0 60px -10px rgba(167,139,250,0.15)",
                backdropFilter: "blur(24px)",
              }}
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", damping: 28, stiffness: 340 }}
              onClick={(e) => e.stopPropagation()}
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
