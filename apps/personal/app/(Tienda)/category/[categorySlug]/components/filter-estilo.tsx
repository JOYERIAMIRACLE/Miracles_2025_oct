"use client"
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

type FilterEstiloProps = {
  setFilterEstilo: (figura: string) => void
}

const FilterEstilo = ({ setFilterEstilo }: FilterEstiloProps) => {
  return (
    <div className='my-5'>
      <p className='mb-3 font-bold'>Estilo / Figura</p>
      <RadioGroup defaultValue="" onValueChange={(value) => setFilterEstilo(value)}>
        <div className='flex items-center space-x-2'>
          <RadioGroupItem value="" id="all-estilos" />
          <Label htmlFor="all-estilos">Todos</Label>
        </div>
        {["Cartier", "Figaro", "Cubana", "Corazón", "Cruz", "Solitario", "Otro"].map((estilo) => (
          <div key={estilo} className='flex items-center space-x-2'>
            <RadioGroupItem value={estilo} id={estilo} />
            <Label htmlFor={estilo}>{estilo}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

export default FilterEstilo
