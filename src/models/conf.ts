export const BASE_TILE_SIZE = 16; // taille originale des sprites
export const SCALE = 2; // facteur pour redimensionner les sprites 
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
                  [0, 200, groundStart, groundEnd],
                  
                  // Petites collines à gauche
                  [4, 8, groundStart - 4, groundStart - 2],
                  [9, 13, groundStart - 2, groundStart],
                  
                  // Vallée
                  [20, 24, groundStart + 2, groundEnd + 2],
              
                  // Re-colline à droite
                  [28, 32, groundStart - 4, groundStart - 2],
                  [33, 37, groundStart - 2, groundStart],
              
                  // Plateau élevé
                  [45, 50, groundStart - 6, groundStart - 4],
                  [45, 50, groundStart - 6, groundEnd],
                ]
              },
            {
                tile:'pipe',
                ranges:[
                    [66,68,groundStart-2,groundStart]
                ]
            },
            {
                tile:'canon',
                ranges:[
                    [4,5,groundStart-6,groundStart-4]
                ]
            }
            
        ]
    };
};

// On genere les données du monde au chargement
export let worldData = generateWorldData();


