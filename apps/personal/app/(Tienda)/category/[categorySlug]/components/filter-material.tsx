"use client"
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const MATERIALES = ["Oro 10k", "Plata 925"]

type FilterMaterialProps = {
  setFilterMaterial: (materialProduct: string) => void
}

const FilterMaterial = ({ setFilterMaterial }: FilterMaterialProps) => {
  return (
    <div className='my-5'>
      <p className='mb-3 font-bold'>Material</p>
      <RadioGroup defaultValue="" onValueChange={(value) => setFilterMaterial(value)}>
        <div className='flex items-center space-x-2'>
          <RadioGroupItem value="" id="all-materiales" />
          <Label htmlFor="all-materiales">Todos</Label>
        </div>
        {MATERIALES.map((material) => (
          <div key={material} className='flex items-center space-x-2'>
            <RadioGroupItem value={material} id={material} />
            <Label htmlFor={material}>{material}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

export default FilterMaterial
