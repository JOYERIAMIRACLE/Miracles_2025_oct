"use client"

import { useState } from "react"
import { Puzzle, Code2, Radio, ExternalLink } from "lucide-react"

/** Tu sdi-portal corriendo en local (puerto por defecto de Next.js) — cámbialo si usas otro puerto. */
const SDI_LOCAL = "http://localhost:3000"

function VerEnVivoSDI({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-red-500/25 bg-red-500/5 text-red-400/90 hover:bg-red-500/10 text-[11px] font-medium transition-colors max-w-md"
    >
      <Radio size={11} className="animate-pulse" /> Ver en vivo — tu sdi-portal local <ExternalLink size={11} />
    </a>
  )
}

const CATEGORIAS = [
  { id: "selects", label: "Selects" },
  { id: "tablas",  label: "Tablas de datos" },
  { id: "login",   label: "Login" },
  { id: "sidebar", label: "Sidebar" },
  { id: "header",  label: "Header" },
  { id: "forms",   label: "Forms" },
  { id: "cards",   label: "Cards de recursos" },
] as const

type CategoriaId = typeof CATEGORIAS[number]["id"]

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest mb-2">
      <Code2 size={11} className="text-amber-400" /> <span className="text-amber-400/80">{children}</span>
    </div>
  )
}

const CODE: Record<CategoriaId, { titulo: string; desc: React.ReactNode; snippet: string; live: string }> = {
  selects: {
    titulo: "Código real — SDI Portal",
    desc: <><code className="text-violet-400">DropdownPicker</code> — panel propio, nunca select nativo (<code className="text-slate-400">components/Shared/DropdownPicker.tsx</code>).</>,
    snippet: `<DropdownPicker
  label="Categoría"
  value={categoriaId}
  onChange={setCategoriaId}
  options={[
    { value: "1", label: "Anillos" },
    { value: "2", label: "Cadenas" },
  ]}
/>`,
    live: `${SDI_LOCAL}/marketing/configuracion`,
  },
  tablas: {
    titulo: "Código real — SDI Portal",
    desc: <>Patrón real de <code className="text-slate-400">marketing/pagos/page.tsx</code> — columnas que se ocultan en mobile, celdas con <code className="text-violet-400">TagSelect</code> inline.</>,
    snippet: `<tr onClick={() => setFormMode({ type: "edit", pago: p })}
  className="border-b hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
  <td className="px-4 py-3">{p.concepto}</td>
  <td className="px-4 py-3 hidden sm:table-cell">
    <TagSelect value={p.categoria} onClick={e => e.stopPropagation()} />
  </td>
</tr>`,
    live: `${SDI_LOCAL}/marketing/pagos`,
  },
  login: {
    titulo: "Código real — SDI Portal",
    desc: <><code className="text-slate-400">app/login/page.tsx</code> — dos columnas, acento naranja, además auto-vincula al colaborador por email.</>,
    snippet: `const res = await fetch(\`\${BASE}/api/auth/local\`, {
  method: "POST",
  body: JSON.stringify({ identifier: email, password }),
})
const role = await fetchUserRole(json.jwt, BASE)
const dest = redirectForRole(role)
// auto-vincula portal-colaborador por email si no
// estaba ligado a un usuario todavía
setToken(json.jwt)
router.push(dest)`,
    live: `${SDI_LOCAL}/login`,
  },
  sidebar: {
    titulo: "Código real — SDI Portal",
    desc: <><code className="text-slate-400">PortalSDIView.tsx</code> — 4 bloques fijos (Inicio / Conoce a SDI / Departamentos / Servicios), no por colores.</>,
    snippet: `const GRUPOS: NavGroup[] = [
  { id: "portal", label: "Inicio", icon: Home, items: [] },
  { id: "conoce", label: "Conoce a SDI", icon: Landmark,
    items: [/* Quiénes somos, Organigrama... */] },
  { id: "departamentos", label: "Departamentos",
    icon: Briefcase, items: [/* 8 deptos */] },
]`,
    live: `${SDI_LOCAL}/portal`,
  },
  header: {
    titulo: "Código real — SDI Portal",
    desc: <>Header embebido dentro de <code className="text-slate-400">PortalSDIView.tsx</code> — logo clicable vuelve siempre a Inicio.</>,
    snippet: `<button onClick={() => navigate("portal-home")}
  className="flex items-center gap-2.5 hover:opacity-80">
  <div className="h-9 w-9 overflow-hidden">{/* logo SDI */}</div>
</button>`,
    live: `${SDI_LOCAL}/portal`,
  },
  forms: {
    titulo: "Código real — SDI Portal",
    desc: <><code className="text-violet-400">fieldCls</code> — una sola constante en <code className="text-slate-400">lib/styles.ts</code>, reusada en todo el repo.</>,
    snippet: `export const fieldCls =
  "w-full h-9 px-3 text-sm rounded-xl border " +
  "border-slate-300 dark:border-slate-700 " +
  "bg-white dark:bg-slate-900 outline-none " +
  "focus:border-orange-400 transition-colors"

<input className={fieldCls} />`,
    live: `${SDI_LOCAL}/marketing/pagos`,
  },
  cards: {
    titulo: "Código real — SDI Portal",
    desc: <><code className="text-violet-400">RecursoCard</code> + <code className="text-violet-400">CardThumb</code> — thumbnail real: imagen, PDF renderizado, o placeholder por tipo.</>,
    snippet: `if (isImg) return <img src={url} className="object-contain" />
if (isPdf) return <PdfPageThumb url={url} />
return (
  <div className={\`bg-gradient-to-br \${grad}\`}>
    <span>{label /* ej. "XLS", "DOC" */}</span>
  </div>
)`,
    live: `${SDI_LOCAL}/portal#rh`,
  },
}

function CategoriaDemo({ id }: { id: CategoriaId }) {
  const c = CODE[id]
  return (
    <div className="max-w-md">
      <Etiqueta>{c.titulo}</Etiqueta>
      <p className="text-[11px] text-slate-500 mb-2">{c.desc}</p>
      <pre className="text-[10px] leading-relaxed bg-slate-950 border border-slate-800 rounded-lg p-3 overflow-x-auto text-slate-400">
        {c.snippet}
      </pre>
      <VerEnVivoSDI href={c.live} />
    </div>
  )
}

export function TallerSdiPortalPanel() {
  const [activa, setActiva] = useState<CategoriaId>("selects")

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Puzzle size={16} className="text-indigo-400" />
        <p className="text-xs text-slate-500">
          Piezas propias de SDI Portal — otro repo, no se pueden renderizar aquí sin duplicar. Código real + acceso a tu instancia local.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CATEGORIAS.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiva(cat.id)}
            className={`h-7 px-2.5 rounded-lg text-[11px] font-medium border transition-all ${
              activa === cat.id
                ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                : "border-slate-700 text-slate-500 hover:text-slate-300"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        <CategoriaDemo id={activa} />
      </div>
    </div>
  )
}
