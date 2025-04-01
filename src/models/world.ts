import { tileSize, worldData } from "./conf";

export let mat: string[][] = []; // matrice du monde

export const generateMatrix = () => {
    const rows = Math.ceil(window.innerHeight / tileSize);

    // Initialisation avec "sky"
    mat = Array.from({ length: rows }, () => Array(200).fill("sky"));

    // Remplissage avec les données du monde
    worldData.backgrounds.forEach((background) => {
        const tileType = background.tile;

        background.ranges.forEach(([startX, endX, startY, endY]) => {
                for (let y = startY; y < endY; y++) {
                    for (let x = startX; x < endX; x++) {
                        mat[y][x] = tileType;
                }
            }
        });
    });
};

// fonction qui sera utile pour savoir ou est mario dans la matrice 
export const getIndex = (x: number, y: number) => {
    const row = Math.floor(y / tileSize);
    const col = Math.floor(x / tileSize);

    if (row >= 0 && row < mat.length && col >= 0 && col < mat[0].length) {
        return mat[row][col];
    }
    return null; // indice hors de la matrice
};

// ecouteur pour mettre à jour la matrice lors du redimensionnement
window.addEventListener("resize", generateMatrix);

// Génération initiale
generateMatrix();