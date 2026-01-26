import React from 'react'
import { Skeleton } from '../../../../components/ui/skeleton';


// MANUAL DE DATOS DE SKELETON
type SkeletonSchemaProps = {
    grid: number
}


// COMPONENTE BASE PARA PRODUCTO
const SkeletonSchema = (props: SkeletonSchemaProps) => {
  const {grid} = props;
//   RECIBE EL PROP DE GRID
    console.log(grid)
  return (    
    Array.from({length: grid}).map((_, index) => (
        <div key={index} className='flex flex-col gap-8 mx-auto space-y-3'>
            <Skeleton className='h-[125px] w-[250px] roundex-xl'/>
            <div className='space-y-2'>
                <Skeleton className='h-4 w-[250px]'/>
                <Skeleton className='h-4 w-[250px]'/>
            </div>
        </div>
    ))
    
  );
}

export default SkeletonSchema
