const BENEFICIOS = [
  { icon: "🚚", titulo: "Envío a todo México",     sub: "5-7 días hábiles" },
  { icon: "✅", titulo: "Calidad certificada",      sub: "Oro 10k y Plata .925" },
  { icon: "🔒", titulo: "Compra segura",            sub: "Pago protegido" },
  { icon: "💬", titulo: "Asesoría personalizada",  sub: "Vía WhatsApp" },
  { icon: "🔄", titulo: "Devoluciones fáciles",    sub: "Hasta 30 días" },
  { icon: "⭐", titulo: "Garantía 6 meses",        sub: "En todas las piezas" },
]

const CertificadosStrip = () => {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-6 py-5">
        <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-1 md:grid md:grid-cols-6">
          {BENEFICIOS.map((b) => (
            <div
              key={b.titulo}
              className="flex flex-col items-center text-center gap-1 min-w-[110px] md:min-w-0"
            >
              <span className="text-2xl">{b.icon}</span>
              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 leading-tight whitespace-nowrap">
                {b.titulo}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                {b.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CertificadosStrip
