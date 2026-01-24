import React from 'react'
import FilterMaterial from './filter-material'
import FilterEstilo from './filter-estilo'


type FiltersControlsCategoryProps = {
  setFilterMaterial: (materialProduct: string) => void
  setFilterEstilo: (estiloProducto: string) => void
  // setFilterAll: (estiloProducto: string) => void
}

const FiltersControlsCategory = (props: FiltersControlsCategoryProps) => {
  const {setFilterMaterial, setFilterEstilo} = props

  return (
    <div className='sm:w-[350px] sm:mt-5 p-6  '>
      <FilterMaterial setFilterMaterial={setFilterMaterial}/>
      <FilterEstilo setFilterEstilo={setFilterEstilo}/>
      {/* <FilterAll setFilterAll={setFilterAll}/> */}
      
    </div>
  )
}

export default FiltersControlsCategory
