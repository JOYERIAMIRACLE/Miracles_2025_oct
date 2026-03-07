import { useGetProductFile } from '@/api/getProductFile'
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FilterTypes } from '@/types/filters';
import { ResponseType } from '@/types/response';
import React from 'react'


type FilterEstiloProps = {
  setFilterEstilo: (estiloProducto: string) => void
}


const FilterEstilo = (props: FilterEstiloProps) => {
    const {setFilterEstilo} = props
    const {result, loading, error}: FilterTypes  =  useGetProductFile()    
    console.log(result); 
    return (
        <div className='my-5'>
            <p className='mb-3 font-bold '>Estilo</p>
            {loading && result === null && (
                <p>cargando pues.....</p>
            )}

            <RadioGroup onValueChange={(value)=> setFilterEstilo(value)}>

                <div className='flex items-center space-x-2'>
                    <RadioGroupItem value="" id="all-styles" />
                    <Label htmlFor="all-styles">Todos</Label>
                </div>
                {result !== null && result.schema.attributes.estiloProducto.enum.map((estiloProducto:string)=>(
                    <div key={estiloProducto} className='flex items-center space-x-2'>
                        <RadioGroupItem value={estiloProducto} id={estiloProducto}/>
                             
                            <Label htmlFor={estiloProducto}>{estiloProducto}</Label>
                        
                    </div> 
                )) }
            </RadioGroup>
        </div>
    )
}

export default FilterEstilo
