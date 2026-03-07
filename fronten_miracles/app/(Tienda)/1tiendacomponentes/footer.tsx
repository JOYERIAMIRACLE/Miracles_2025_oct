import React from 'react'
import Link from 'next/link'
import { Separator } from '../../../components/ui/separator'

// MANUAL DE DATOS FOOTER
const datafooter = [
    {
        id:1,
        name:"sobrenomberw ",
        link: "#",

    },
    {
        id:2,
        name:"productos ",
        link: "#",

    },
    {
        id:3,
        name:"blog ",
        link: "#",

    },
    {
        id:4,
        name:"mas ",
        link: "#",

    },
]

// COMPONENTE
const Footer = () => {
  return (

    // CAJON FOOTER
    <footer className='mt-4'>

        {/* CAMPO DE ELEMENTOS */}
      <div className='w-full max-w-screen mx-auto p-4 px-14 md:py-8'>


        {/* ACOMODO DE ELEMENTOS PARTE ALTA */}
        <div className='sm:flex sm:items-cener sm:justify-between'>


            {/* LOGO MARCA */}
            <p>
                <span className='font-bold mr-2 text-4xl'>
                    Miracles 
                     
                </span>
                <span className='text-4xl'>
                    jewerly
                </span>
            </p>

            {/* MENU FOOTER */}
            <ul className='flex flex-wrap items-center mb-6 text-sm font-medium text-gray-500 sm:mb-0 dark:text-gray-400'>
                {datafooter.map((data) => (
                    <li key={data.id}>
                        <Link href={data.link} className='hover:underline me-4 md:me-6 '>{data.name}</Link>

                    </li>
                ))}
            </ul>
            
        </div>

        {/* ACOMODO DE ELEMENTOS PARTE BAJA */}
        
        {/* SEPARADOR */}
        <Separator className='my-6 border-gray-200 sm:mx-auto dark:border-gray-500 lg:my-8'/>
        
        {/* DATOS DEEMPRESA (DISCLAIMER) */}
        <span className='font-bold block text-sm text-gray-500 sm:text-center dark:text-gray-400 '>
            &copy; 2025 
            <Link className='ml-3' href="#">Miracles | Todos los derechos reservados</Link> 
        </span>
        
      </div>
    
    </footer>
  )
}

export default Footer
