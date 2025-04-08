export const BASE_TILE_SIZE = 16; // taille originale des sprites
export const SCALE = 1.5; // facteur pour redimensionner les sprites 
export const tileSize = BASE_TILE_SIZE * SCALE;

// fonction pour generer dynamiquement le monde en fonction de la hauteur de l'ecran
export const generateWorldData = () => {
    const totalRows = Math.ceil(window.innerHeight / tileSize);
    const groundStart = totalRows-2 ; // Avant-derniere ligne
    const groundEnd = totalRows;       // dernière ligne

    return {
        backgrounds: [
            {
                tile: "sky",
                ranges: [
                    [0, 200, 0, groundStart] // ciel jusqu'au sol
                ]
            },
            {
                tile: "ground",
                ranges: [
                    [0, 200, groundStart, groundEnd], // le sol
                    
                    
                ]
            }
            /*,{
                tile:'pipe',
                ranges:[
                    [66,68,groundStart-2,groundEnd]
                ]
            }*/
        ]
    };
};

// On genere les données du monde au chargement
export let worldData = generateWorldData();


