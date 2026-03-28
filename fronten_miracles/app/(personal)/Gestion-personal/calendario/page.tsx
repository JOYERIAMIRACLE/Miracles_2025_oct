export default function CalendarioPage() {
  // 1. HOOKS
  
  // 2. LOGS DE DESARROLLO
  
  // 3. GUARDS
  
  // 4. RETURN PRINCIPAL
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl p-4 m-2 mb-1 pb-1 font-semibold tracking-tight">Calendario de Actividades</h1>
          <p className="text-sm text-zinc-500 ml-6">Agenda y planificación</p>
        </div>
      </div>
      
      <div className="p-6 bg-background rounded-xl border shadow-sm flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground font-medium mb-2">
            Tu componente de calendario interactivo irá aquí.
          </p>
          <p className="text-sm text-muted-foreground/75">
            Puedes instalar una librería como react-big-calendar o fullcalendar para completarlo.
          </p>
        </div>
      </div>
    </div>
  )
}
