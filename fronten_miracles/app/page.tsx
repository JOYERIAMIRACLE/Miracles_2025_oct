import { Button } from "@/components/ui/button"
import Link from 'next/link'
 
export default function Home() {
  return (
    <div>
       
      <Button className="">Click me madafake</Button>
      <Link href="/blog">
        blog
      </Link>
      
    </div>
  )
}