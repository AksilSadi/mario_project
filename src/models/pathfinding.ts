import { mat } from './world';
//j'ai divise encore chaque cellule en 2X2 pour ajouter plus de precision de finesse dans mon path 
export const transformMatrix = (matrix: string[][]) => {
    const transformedMatrix: number[][] = [];
  
    for (let i = 0; i < matrix.length; i++) {
      // On ajoute deux lignes pour chaque ligne originale
      transformedMatrix[2 * i] = [];
      transformedMatrix[2 * i + 1] = [];
  
      for (let j = 0; j < matrix[0].length; j++) {
        const isSky = matrix[i][j] === "sky" ? 1 : 0;
  
        // On ajoute deux colonnes pour chaque colonne originale
        transformedMatrix[2 * i][2 * j] = isSky;
        transformedMatrix[2 * i][2 * j + 1] = isSky;
        transformedMatrix[2 * i + 1][2 * j] = isSky;
        transformedMatrix[2 * i + 1][2 * j + 1] = isSky;
      }
    }
  
    return transformedMatrix;
  };

type noeud = {
    x: number;
    y: number;
    g: number;
    h: number;
    f: number;
    parent: noeud | null;
}

export const heuristic = (a: noeud, b: noeud) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

const getNeighbors = (
    node: noeud,
    matrix: number[][],
    enemyHeight = 2,
    enemyWidth = 2
) => {
    const neighbors: noeud[] = [];
    const directions = [
        { dx: 0, dy: -1 },   // haut
        { dx: 1, dy: 0 },    // droite
        { dx: 0, dy: 1 },    // bas
        { dx: -1, dy: 0 },   // gauche
        { dx: 1, dy: -1 },   // haut-droite
        { dx: 1, dy: 1 },    // bas-droite
        { dx: -1, dy: 1 },   // bas-gauche
        { dx: -1, dy: -1 }   // haut-gauche
    ];

    for (const dir of directions) {
        const newX = node.x + dir.dx;
        const newY = node.y + dir.dy;

        // Vérifie que toutes les cases que l'ennemi occupe sont libres
        let libre = true;

        for (let h = 0; h < enemyHeight; h++) {
            for (let w = 0; w < enemyWidth; w++) {
                const checkX = newX + w;
                const checkY = newY + h;

                if (
                    checkX < 0 || checkX >= matrix[0].length ||
                    checkY < 0 || checkY >= matrix.length ||
                    matrix[checkY][checkX] !== 1
                ) {
                    libre = false;
                    break;
                }
            }
            if (!libre) break;
        }

        if (!libre) continue;

        // Gestion du coin-cutting (diagonale)
        const isDiagonal = dir.dx !== 0 && dir.dy !== 0;
        if (isDiagonal) {
            let horizontalFree = true;
            let verticalFree = true;

            for (let h = 0; h < enemyHeight; h++) {
                for (let w = 0; w < enemyWidth; w++) {
                    const horX = node.x + dir.dx + w;
                    const horY = node.y + h;
                    const verX = node.x + w;
                    const verY = node.y + dir.dy + h;

                    // Horizontal check
                    if (
                        horX < 0 || horX >= matrix[0].length ||
                        horY < 0 || horY >= matrix.length ||
                        matrix[horY][horX] !== 1
                    ) {
                        horizontalFree = false;
                    }

                    // Vertical check
                    if (
                        verX < 0 || verX >= matrix[0].length ||
                        verY < 0 || verY >= matrix.length ||
                        matrix[verY][verX] !== 1
                    ) {
                        verticalFree = false;
                    }
                }
            }

            if (!horizontalFree || !verticalFree) continue;
        }

        neighbors.push({
            x: newX,
            y: newY,
            g: 0,
            h: 0,
            f: 0,
            parent: null
        });
    }

    return neighbors;
};



const construirePath = (node: noeud | null) => {
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
        let currentNode = openSet.reduce((prev, curr) => (curr.f < prev.f ? curr : prev));

        if (currentNode.x === goal.x && currentNode.y === goal.y) {
            return construirePath(currentNode);
        }

        openSet.splice(openSet.indexOf(currentNode), 1);
        closedSet.push(currentNode);

        const neighbors = getNeighbors(currentNode, matrix);

        for (const neighbor of neighbors) {
            if (closedSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                continue;
            }

            const isDiagonal = neighbor.x !== currentNode.x && neighbor.y !== currentNode.y;
            const cost = isDiagonal ? Math.SQRT2 : 1;
            const tentativeG = currentNode.g + cost;

            const existingNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);

            if (!existingNode || tentativeG < existingNode.g) {
                neighbor.parent = currentNode;
                neighbor.g = tentativeG;
                neighbor.h = heuristic(neighbor, goal);
                neighbor.f = neighbor.g + neighbor.h;

                if (!existingNode) {
                    openSet.push(neighbor);
                }
            }
        }
    }

    return []; // aucun chemin trouvé
};
