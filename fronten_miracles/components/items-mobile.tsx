 
import React from 'react'
import Link from 'next/link'
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover'
import { Menu, MenuIcon } from 'lucide-react'


const ItemsMenuMobile = () => {
  return (
    <div>
      <Popover>
        <PopoverTrigger>
            <Menu/>
        </PopoverTrigger>
        <PopoverContent className='flex flex-col'>
            <Link href="/cafe1"  >cafe 1</Link>
            <Link href="/cafe2" >cafe 2</Link>
            <Link href="/cafe3" >cafe 3</Link>
        </PopoverContent>
      </Popover>
    </div>
  
  )
}
         
export default ItemsMenuMobile



