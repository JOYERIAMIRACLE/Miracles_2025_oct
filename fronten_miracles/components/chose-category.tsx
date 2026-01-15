"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ResponseType } from "@/types/response"
import { useGetCategories } from '@/api/GetProduct'

import React from 'react'
import { CategoryType } from '@/types/category'

// COMPONENTE

const ChoseCategory = () => {

  // MANUAL DE DATOS
  const {loading,result,error}: ResponseType = useGetCategories()
      const router = useRouter()
      console.log(result); 


  // VISUALIZADORES
  return (

    // CAJA
    <div className='max-w-6xl py-4   mx-auto  sm:py-24 sm:px-24'>

      {/* TITULO */}
      <h3 className='uppercase font-black text-3xl px-6 pb-4 sm:pb-8 text-primary'>Elige tu categoria</h3>
      
        {/* CAJA GRID */}
        <div className='grid gap-5 sm:grid-cols-3'> 


          {/* LOADING DE ESTADO {MAGIA} */}
          {!loading && result !== undefined && (

            // MANUAL DE APODOS 
            result.map((category: CategoryType)=> (

              <Link key={category.id} 
              href={`/category/${category.slug}`}
              className='relative max-w-xs mx-auto overflow-hidden bg-no-repeatbg-cover rounded-lg  group '
              >
                <img 
                src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${category.MainImage?.url}`}
                alt={category.NombreCategoria}
                className='max-w-[270px] transition duration-300 ease-in-out rounded-lg group-hover:scale-110 '
                />
                <h4 className='font-bold absolute w-full py-2 text-lg text-center text-white bottom-5 backdrop-blur-lg  group-hover:scale-105 '>{category.NombreCategoria}</h4>
              </Link>


            ))  
          )}















          {/* CARGA DE SKELETON
          {loading && (
                            
                            <p>productocategoria</p>   
                        )}

          MAPING DE DATOS
          {result !== null && 
              result.map((productcategories: any) => {
                  const { id, NombreCategoria } = productcategories; 

                  return(
                    <p key={id} className=''>{NombreCategoria}</p>

                  
                  )}
              )} */}










        </div>
    </div>
  )
}

export default ChoseCategory
