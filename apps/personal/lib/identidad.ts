// Los valores se guardan como un solo texto ("Confianza, Cercanía, …") que
// editan el Portal y pinta /nosotros; ambos deben separarlos igual.
export function separarValores(texto: string | null | undefined): string[] {
  return (texto ?? "").split(/[,·\n]/).map(v => v.trim()).filter(Boolean).map(v => v[0].toUpperCase() + v.slice(1))
}
