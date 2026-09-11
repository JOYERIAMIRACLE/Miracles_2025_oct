import Link from 'next/link'

const OCASIONES = [
  { emoji: "🎀", titulo: "Quinceañera",       sub: "El regalo perfecto para su día especial",       href: "/tienda", color: "from-pink-900 via-rose-700 to-pink-400"   },
  { emoji: "💍", titulo: "Compromiso",         sub: "Anillos y piezas para dar el gran paso",        href: "/tienda", color: "from-amber-900 via-amber-700 to-yellow-500" },
  { emoji: "💒", titulo: "Boda",               sub: "Argollas y sets nupciales únicos",              href: "/tienda", color: "from-slate-800 via-slate-600 to-slate-400"  },
  { emoji: "🌸", titulo: "Día de la Madre",    sub: "Piezas con amor para mamá",                    href: "/tienda", color: "from-purple-900 via-purple-700 to-fuchsia-400" },
  { emoji: "🎓", titulo: "Graduación",         sub: "Celebra el logro con una joya",                href: "/tienda", color: "from-blue-900 via-blue-700 to-cyan-500"     },
  { emoji: "🎁", titulo: "Regalo especial",    sub: "Para cualquier ocasión que importa",            href: "/tienda", color: "from-emerald-900 via-emerald-700 to-teal-400" },
]

const ComprarPorOcasion = () => {
  return (
    <section className="bg-white dark:bg-slate-950 py-14 md:py-20">
      <div className="max-w-6xl mx-auto px-6 md:px-8">

        <div className="mb-8 md:mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-500 mb-2">
            Para cada momento
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            Compra por ocasión
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md">
            Encuentra la pieza ideal para cada celebración y momento especial.
          </p>
        </div>

        {/* Grid 2 columnas mobile, 3 columnas desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {OCASIONES.map((oc) => (
            <Link
              key={oc.titulo}
              href={oc.href}
              className={`group relative overflow-hidden rounded-2xl h-44 md:h-52 bg-gradient-to-br ${oc.color} block`}
            >
              {/* Brillo sutil */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_25%_25%,_white,_transparent_60%)]" />

              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <span className="text-3xl mb-2 drop-shadow">{oc.emoji}</span>
                <p className="text-white text-sm md:text-base font-bold leading-tight">
                  {oc.titulo}
                </p>
                <p className="text-white/55 text-[11px] mt-1 leading-snug line-clamp-2">
                  {oc.sub}
                </p>
                <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mt-2.5 group-hover:text-white transition-colors">
                  Explorar →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ComprarPorOcasion
