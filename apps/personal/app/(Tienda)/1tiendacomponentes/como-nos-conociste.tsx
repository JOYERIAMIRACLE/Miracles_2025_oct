const OPCIONES = [
  "Instagram",
  "Facebook",
  "WhatsApp",
  "Búsqueda en Google",
  "Recomendación de un familiar o amigo",
  "Los vi en persona",
  "Otro",
]

// Pregunta opcional que se guarda en el lead: es la forma de saber de dónde vienen
// las personas que ninguna herramienta puede rastrear (recomendaciones, WhatsApp).
export function ComoNosConociste({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        ¿Cómo nos conociste? <span className="text-gray-400 font-normal">(opcional)</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
      >
        <option value="">Seleccionar...</option>
        {OPCIONES.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}
