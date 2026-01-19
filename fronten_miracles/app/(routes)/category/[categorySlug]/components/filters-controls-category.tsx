import React from 'react'
import FilterMaterial from './filter-material'


type FiltersControlsCategoryProps = {
  setFilterMaterial: (materialProduct: string) => void
}

const FiltersControlsCategory = (props: FiltersControlsCategoryProps) => {
  const {setFilterMaterial} = props

  return (
    <div className='sm:w-[350px] sm:mt-5 '>
      <FilterMaterial setFilterMaterial={setFilterMaterial}/>
      
    </div>
  )
}

export default FiltersControlsCategory
