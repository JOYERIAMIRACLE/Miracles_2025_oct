export type ProductType = {
    id: number;
    attributes:{
        nombreProducto: string;
        slug: string;
        descripcion: string;
        activo: boolean;
        isFeatured: boolean;
        tipoProducto: string;
        costo: number; 
        imagenes: {
            data: {
                id: number;
                attributes: {
                    url: string;
                }
            }[]
        };
        categoia:{
            data:{
                attributes: {
                    slug: string;
                    nombreCategoria: string;
                };
            };
        }
    }
}