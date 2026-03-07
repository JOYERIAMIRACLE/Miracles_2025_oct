export type FilterTypes = {
    result: ResultFilterTypes | null;
    loading: boolean;
    error: string;
}

export type ResultFilterTypes = {
    schema : {
        attributes: {
            materialProducto:{
                enum:any 
            }
            estiloProducto:{
                enum:any
            }
            
        }
    }
}