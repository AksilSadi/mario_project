export const tileSize = 16;

// fonction pour generer dynamiquement le monde en fonction de la hauteur de l'ecran
export const generateWorldData = () => {
    const totalRows = Math.ceil(window.innerHeight / tileSize);
    const groundStart = totalRows - 4; // Avant-derniere ligne
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
                    [0, 200, groundStart-2, groundEnd], // le sol
                    
                    [12, 18, groundStart - 12, groundStart - 11],
                    [2, 3, groundStart - 12, groundStart - 11],
                    [0, 3, groundStart - 12, groundStart - 11],
                    [0, 3, groundStart - 14, groundStart - 13],
                    [10, 12, groundStart - 11, groundStart - 10],
                    [9, 10, groundStart - 7, groundEnd],
                    [20, 21, groundStart - 7, groundEnd],
                    [100,101,groundStart - 7, groundEnd],
                    [90,91,groundStart - 7, groundEnd],
                    [60,61,groundStart - 7, groundEnd],
                    [61,62,groundStart - 7, groundEnd],
                    [62,63,groundStart - 7, groundEnd],
                    [63,64,groundStart - 7, groundEnd],
                    [64,65,groundStart - 7, groundEnd],
                    [91,92,groundStart - 7, groundEnd],
                    [10, 30, groundStart - 14, groundStart - 12]
                ]
            },{
                tile:'pipe',
                ranges:[
                    [66,68,groundStart-2,groundEnd]
                ]
            }
        ]
    };
};

// On genere les données du monde au chargement
export let worldData = generateWorldData();


