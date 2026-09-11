import Link from 'next/link'

const ComprarPorMaterial = () => {
  return (
    <section className="bg-white dark:bg-slate-950 py-14 md:py-20">
      <div className="max-w-6xl mx-auto px-6 md:px-8">

        <div className="mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-500 mb-2">
            Elige tu material
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            Compra por material
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Oro 10k */}
          <Link
            href="/tienda"
            className="group relative overflow-hidden rounded-2xl h-64 md:h-80 block"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-700 to-yellow-500" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,_white,_transparent_60%)]" />
            <div className="absolute inset-0 flex flex-col justify-end p-8">
              <p className="text-amber-200 text-[11px] font-bold uppercase tracking-[0.3em] mb-1.5">
                Alta pureza
              </p>
              <h3 className="text-white text-3xl md:text-4xl font-extrabold leading-none">
                Oro 10k
              </h3>
              <p className="text-white/60 text-sm mt-2 mb-4 max-w-xs">
                Cadenas, aretes, anillos y dijes en oro de alta pureza con durabilidad excepcional.
              </p>
              <span className="inline-flex items-center text-white text-[11px] font-bold uppercase tracking-widest group-hover:text-amber-300 transition-colors">
                Ver colección →
              </span>
            </div>
          </Link>

          {/* Plata 925 */}
          <Link
            href="/tienda"
            className="group relative overflow-hidden rounded-2xl h-64 md:h-80 block"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-500 to-slate-300" />
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_70%_40%,_white,_transparent_60%)]" />
            <div className="absolute inset-0 flex flex-col justify-end p-8">
              <p className="text-slate-200 text-[11px] font-bold uppercase tracking-[0.3em] mb-1.5">
                Plata certificada
              </p>
              <h3 className="text-white text-3xl md:text-4xl font-extrabold leading-none">
                Plata 925
              </h3>
              <p className="text-white/60 text-sm mt-2 mb-4 max-w-xs">
                Diseños elegantes en plata esterlina .925 con acabados que duran años.
              </p>
              <span className="inline-flex items-center text-white text-[11px] font-bold uppercase tracking-widest group-hover:text-slate-200 transition-colors">
                Ver colección →
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default ComprarPorMaterial
