import { useGetProductFile } from '@/api/getProductFile'
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FilterTypes } from '@/types/filters';
import { ResponseType } from '@/types/response';
import React from 'react'


type FilterMaterialProps = {
  setFilterMaterial: (materialProduct: string) => void
}


const FilterMaterial = (props: FilterMaterialProps) => {
    const {setFilterMaterial} = props
    const {result, loading, error}: FilterTypes  =  useGetProductFile()    
    console.log(result); 
    return (
        <div className='my-5'>
            <p className='mb-3 font-bold '>Material</p>
            {loading && result === null && (
                <p>cargando pues.....</p>
            )}
            <RadioGroup onValueChange={(value)=> setFilterMaterial(value)}>
                {result !== null && result.schema.attributes.materialProducto.enum.map((materialProducto:string)=>(
                    <div key={materialProducto} className='flex items-center space-x-2'>
                        <RadioGroupItem value={materialProducto} id={materialProducto}/>
                             
                            <Label htmlFor={materialProducto}>{materialProducto}</Label>
                        
                    </div>
                )) }
            </RadioGroup>
        </div>
    )
}

export default FilterMaterial
