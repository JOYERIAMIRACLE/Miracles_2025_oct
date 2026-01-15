import Link from 'next/link'
import React from 'react'
import { buttonVariants } from './ui/button'

const BannerDiscount = () => {
  return (

//   BLOQUE DE COMPONENTE
    <div className='p-2 sm:p-14 text-center'>

      {/* TITULO */}
      <h2 className='uppercase font-black text-2xl text-primary '>consigue hasta 2% de descuento </h2>


      {/* DESCRIPCION */}
      <h3 className='mt-2 font-semibold'>Cupon gratis en primera compra</h3>

      {/* CAJA DE BOTONES */}
      <div className='flex-col max-w-md mx-auto flex sm:flex-row mt-2 p-4 justify-center gap-8 '>

        {/* BOTON 1 */}
        <Link href="#" className={buttonVariants()}>Comprar</Link>

        {/* BOTON 2  */}
        <Link href="#" className={buttonVariants({variant: "outline"})}>Más información</Link>
      </div>
    </div>
  )
}

export default BannerDiscount
