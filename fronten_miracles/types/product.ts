export type ProductType = {
    id: number;
    documentId: string;
    nombreProducto: string;
    slug: string;
    descripcion: string;
    activo: boolean;
    isFeatured: boolean;
    materialProducto: string;
    costo: number; 
    estiloProducto: string;
    imagenes: {
        id: number;
        url: string;
        }[];
    categoia:{
        slug: string;
        nombreCategoria: string;
            };
    };
