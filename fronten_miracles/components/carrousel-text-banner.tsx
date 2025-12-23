"use client"
import React from 'react'
import { Carousel, CarouselContent, CarouselItem } from './ui/carousel'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from './ui/card'
import Autoplay from 'embla-carousel-autoplay'
 

export const dataCarouselTop = [
  {
    id:1,
    title: "envio en 24/48 hrs ",
    description: " Entregas de 5 a 7 dias a todas partes de México ",
    link: "#"
  },
  {
    id:2,
    title: "Precios especiales ",
    description: "como cliente MIRACLES OBTIENES PRODUCTOS GRASTIS ",
    link: "#"
  },
  {
    id:3,
    title: "Asesoria personalizada",
    description: "consulta con nuestros asesores la pieza perfecta para la ocacion especial  ",
    link: "#"
  },
]

const CarouselTextBanner = () => {

  const router = useRouter()


  return (
    <div className='bg-gray-200 dark:bg-primary' >
       <Carousel className='w-full max-w-4xl mx-auto'
          plugins={[
            Autoplay({
              delay:2500
            })
          ]}
       
       >
          <CarouselContent> 
            {dataCarouselTop.map(({id,title,description,link}) => ( 
              <CarouselItem key={id} onClick={()=> router.push(link)} className='cursor-pointer '>
                <div>
                  <Card className='shadow-none border-none bg-transparent'>
                    <CardContent className='flex flex-col justify-center  items-center text-center '>
                      <p className='sm:text-lg font-semibold text-wrap dark:text-secondary'>{title}</p>
                      <p className='text-xs sm:text-sm text-wrap dark:text-secondary'>{description}</p>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
       </Carousel>
    </div>
  )
}

export default CarouselTextBanner
