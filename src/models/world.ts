import {  tileSize, worldData } from "./conf";

export let mat: string[][] = []; // matrice du monde

export const generateMatrix = () => {
    // calcul base sur la taille visible (scaled)
    const visibleRows = Math.floor(window.innerHeight / tileSize);
    
    // Taille totale du monde en tuiles (200x pour l'horizontal)
    const totalRows = Math.max(
        visibleRows,
        ...worldData.backgrounds.flatMap(bg => 
            bg.ranges.map(([_, __, startY, endY]) => endY)
        )
    );

    // Initialisation avec "sky"
    mat = Array.from({ length: totalRows }, () => Array(200).fill("sky"));

    // Remplissage avec les données du monde (en coordonnées non scaled)
    worldData.backgrounds.forEach((background) => {
        const tileType = background.tile;

        background.ranges.forEach(([startX, endX, startY, endY]) => {
            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    // Protection contre les débordements
                    if (y >= 0 && y < totalRows && x >= 0 && x < 200) {
                        mat[y][x] = tileType;
                    }
                }
            }
        });
    });
};

export const getIndex = (x: number, y: number) => {
    // coordonnees en tuiles (basées sur tileSize scaled)
    const row = Math.floor(y / tileSize);
    const col = Math.floor(x / tileSize);

    if (row >= 0 && row < mat.length && col >= 0 && col < mat[0].length) {
        return mat[row][col];
    }
    return null;
};

const tileUnit=tileSize / 2;

export const getPosition = (pixel: number) => Math.floor(pixel / tileUnit);

generateMatrix();
window.addEventListener("resize", generateMatrix);