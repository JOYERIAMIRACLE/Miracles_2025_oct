"use client"

import { ChevronDown, Link2, Unlink } from "lucide-react"

type Nodo = { nombre: string; nota?: string; children?: React.ReactNode }

/* Caja de una entidad dentro del flujo */
function Caja({ nombre, nota, children }: Nodo) {
  return (
    <div className="rounded-lg border border-violet-500/25 bg-violet-500/5 px-3.5 py-2.5 text-center">
      <p className="text-xs font-semibold text-slate-200">{nombre}</p>
      {nota && <p className="text-[10px] text-slate-500 mt-0.5">{nota}</p>}
      {children}
    </div>
  )
}

/* Flecha vertical entre cajas — verde si la relación es real en Strapi,
   ámbar punteada si todavía es solo texto libre / sin relación estructurada. */
function Flecha({ label, conectado = true }: { label?: string; conectado?: boolean }) {
  return (
    <div className="flex flex-col items-center py-0.5">
      <ChevronDown size={14} className={conectado ? "text-emerald-500/50" : "text-amber-500/50"} />
      {label && (
        <span className={`text-[9px] font-mono px-1.5 rounded ${
          conectado ? "text-emerald-500/70" : "text-amber-500/70"
        }`}>
          {label}
        </span>
      )}
    </div>
  )
}

/* Mini-estepper del campo Funnel dentro de Cliente — "Lead" no es tabla
   aparte, es el primer valor de este mismo campo (confirmado en
   LeadsView.tsx: filtra clientes.filter(c => c.Funnel === "Lead")). */
function FunnelMini() {
  const etapas = ["Lead", "Oferta", "Pedido", "Entrega"]
  return (
    <div className="mt-1.5 pt-1.5 border-t border-violet-500/15">
      <p className="text-[9px] font-mono uppercase tracking-wider text-slate-600 mb-1">campo Funnel, mismo registro</p>
      <div className="flex items-center justify-center flex-wrap gap-x-1 gap-y-0.5">
        {etapas.map((e, i) => (
          <span key={e} className="flex items-center gap-1">
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-700/40">{e}</span>
            {i < etapas.length - 1 && <span className="text-slate-700 text-[9px]">→</span>}
          </span>
        ))}
      </div>
      <p className="text-[9px] text-slate-600 text-center mt-1">o "Rechazada" desde cualquier etapa</p>
    </div>
  )
}

function Flujo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-violet-500/60 mb-2.5">{titulo}</p>
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-4 flex flex-col items-stretch max-w-xs mx-auto">
        {children}
      </div>
    </div>
  )
}

export function MedallitadeoroDataMap() {
  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-500 leading-relaxed">
        Cómo se conectan hoy los datos reales de Medallitadeoro (verificado contra los schemas de Strapi, no es un diagrama aspiracional) — dos flujos: de dónde sale el dinero (Ventas) y de dónde sale el material (Suministro).
      </p>

      <Flujo titulo="Ventas — de cliente a producto entregado">
        <Caja nombre="Cliente">
          <FunnelMini />
        </Caja>
        <Flecha label="normalmente en etapa Oferta" />
        <Caja nombre="Cotización" nota="items guardados como texto libre, no ligados a Producto todavía" />
        <Flecha conectado={false} label="sin relación" />
        <div className="flex items-center gap-1.5 text-[10px] text-amber-500/70 justify-center -mt-1 mb-1">
          <Unlink size={11} /> Aceptar cotización no crea la Venta sola — es un paso manual
        </div>
        <Caja nombre="Venta" nota="sí ligada a Cliente, Centro de venta y Cuenta" />
        <Flecha label="1 → muchas" />
        <Caja nombre="Línea de venta" nota="cada línea SÍ apunta a un Producto real" />
        <Flecha label="muchas → 1" />
        <Caja nombre="Producto" />
      </Flujo>

      <Flujo titulo="Suministro — de proveedor a material listo para usar">
        <Caja nombre="Proveedor" />
        <Flecha label="1 → muchas" />
        <Caja nombre="Compra de material" nota="también se liga a una Transacción contable" />
        <Flecha label="1 → muchas" />
        <Caja nombre="Línea de compra" />
        <Flecha label="muchas → 1" />
        <Caja nombre="Material" nota="stock en gramos" />
        <Flecha label="registra entrada/salida" />
        <Caja nombre="Movimiento de material" nota="apunta a qué Producto consumió esos gramos" />
      </Flujo>

      <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3.5 space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-violet-500/60">
          <Link2 size={12} /> Puente entre los dos flujos
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          <span className="font-mono text-slate-300">Producto</span> tiene un campo directo <span className="font-mono text-slate-300">materialInsumo</span> — de qué Material está hecho — además de la conexión indirecta vía Movimiento de material. Es la pieza que une "qué vendo" con "de qué está hecho".
        </p>
      </div>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-1.5">
        <p className="text-[10px] font-mono uppercase tracking-widest text-amber-500/70">Huecos reales, no relación estructurada todavía</p>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          • <span className="font-mono text-slate-400">Envío</span> guarda cliente/concepto como texto libre — no está ligado a la Venta como relación de Strapi.<br />
          • <span className="font-mono text-slate-400">Orden de compra</span> (Proveedor → mercancía terminada) sigue en el schema pero está en desuso — el flujo activo de compras es "Compra de material".
        </p>
      </div>
    </div>
  )
}
