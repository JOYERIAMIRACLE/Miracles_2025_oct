import { useFavorites } from "@/hooks/useFavirites";
import { ProductType } from "@/types/product";
import { useRouter } from "next/navigation";

interface ItemProductosFavoritosProps {
    producto: ProductType
}


const itemProductosFavoritos = (props: ItemProductosFavoritosProps) => {

    const {producto} = props;
    const router = useRouter()
    const removeFaorite = useFavorites() 


    return (
        <li className="flex py-6 border-b">

        </li>
    );
}

export default itemProductosFavoritos;