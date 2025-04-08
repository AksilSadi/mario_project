import { mat } from './world';
const transformMatrix = (matrix: string[][]) => {
    const transformedMatrix: number[][] = [];
    for (let i = 0; i < matrix.length; i++) {
        transformedMatrix[i] = [];
        for (let j = 0; j < matrix[0].length; j++) {
            if(matrix[i][j] === "sky"){
                transformedMatrix[i][j] = 1;
        }else{
            transformedMatrix[i][j] = 0;
        }
    }
}
return transformedMatrix;
}
type noeud= {
    x: number;
    y: number;
    g: number; // cout depuis le depart
    h: number; // heuristique vers l'arrive
    f: number; // f = g + h
    parent: noeud | null; // pour reconstruire le chemin
}
const heuristic = (a: noeud, b: noeud) => {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);//la distance de Manhattan(tres utilise dans les algorithmes de pathfinding)
}
const getNeighbors = (node: noeud, matrix: number[][]) => {
    const neighbors: noeud[] = [];
    const directions = [
        { dx: 0, dy: -1 }, // haut
        { dx: 1, dy: 0 }, // droite
        { dx: 0, dy: 1 }, // bas
        { dx: -1, dy: 0 } // gauche
    ];
    for (const dir of directions) {
        const newX = node.x + dir.dx;
        const newY = node.y + dir.dy;
        if (newX >= 0 && newX < matrix[0].length && newY >= 0 && newY < matrix.length) {
            if (matrix[newY][newX] === 1) {
                neighbors.push({ x: newX, y: newY, g: 0, h: 0, f: 0, parent: null }); 
            }
        }
    }
    return neighbors;
}

const construirePath = (node: noeud|null) => {
    const path: noeud[] = [];
    while (node) {
        path.push(node);
        node = node.parent;
    }
    return path.reverse();
}
export const astar = (start: noeud, goal: noeud) => {
    const matrix = transformMatrix(mat);
    const openSet: noeud[] = [start];
    const closedSet: noeud[] = [];
    start.g = 0;
    start.h = heuristic(start, goal);
    start.f = start.g + start.h;

    while (openSet.length > 0) {
        // trouver le nœud avec le plus bas f
        let currentNode = openSet.reduce((prev, curr) => (curr.f < prev.f ? curr : prev));

        // si on a atteint l'objectif, on reconstruit le chemin
        if (currentNode.x === goal.x && currentNode.y === goal.y) {
            return construirePath(currentNode);
        }

        // on deplace le nœud actuel de openSet à closedSet
        openSet.splice(openSet.indexOf(currentNode), 1);
        closedSet.push(currentNode);

        // on recupere les voisins
        const neighbors = getNeighbors(currentNode, matrix);

        for (const neighbor of neighbors) {
            // si le voisin est deja dans closedSet, on passe
            if (closedSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                continue;
            }

            const gScore = currentNode.g + 1;

            // si le voisin n'est pas dans openSet ou si on a trouve un chemin plus court
            if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y) || gScore < neighbor.g) {
                neighbor.parent = currentNode;
                neighbor.g = gScore;
                neighbor.h = heuristic(neighbor, goal);
                neighbor.f = neighbor.g + neighbor.h;

                // ajouter le voisin a openSet si ce n'est pas deja fait
                if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                    openSet.push(neighbor);
                }
            }
        }
    }

    return []; // si aucun chemin n'est trouve
};
   
