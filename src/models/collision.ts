import { tileSize } from "./conf";
import { getIndex } from "./world";

  export const CollisionY = (perso: any,cameraX:number,previousCameraOffset:number) => {
    const actualY = perso.y + perso.dy;
    const actualX = (perso.x + previousCameraOffset );
    // Vérifie en bas et en haut de Mario
    const tileBas1 = getIndex(actualX, actualY + perso.h);
    const tileBas2 = getIndex(actualX + perso.w -1, actualY + perso.h);
    const tileHaut1 = getIndex(actualX , actualY);
    const tileHaut2 = getIndex(actualX + perso.w -1 , actualY);
    // Collision pour le cas où Mario est en train de tomber


    if (perso.dy > 0 && (tileBas1 !== "sky" || tileBas2 !== "sky")) { 
        perso.dy = 0;
        perso.y = Math.floor(actualY / tileSize) * tileSize;
        perso.sauter = false;
    }
    // Collision pour le cas où Mario est en train de sauter
    else if (perso.dy < 0 && (tileHaut1 !== "sky" || tileHaut2 !== "sky")) { 
        perso.dy = 0;
        perso.y = Math.ceil(actualY / tileSize) * tileSize;
    }
};


export const CollisionX = (perso: any,cameraX:number,previousCameraOffset:number) => {
    const differenceCamera = cameraX - previousCameraOffset; // Décalage caméra
    const actualX = (perso.x + perso.dx + previousCameraOffset + differenceCamera);

    const tileGauche1 = getIndex(actualX, perso.y + perso.h / 2);
    const tileGauche2 = getIndex(actualX, perso.y + perso.h - 1);
    const tileDroite1 = getIndex(actualX + perso.w, perso.y + perso.h / 2);
    const tileDroite2 = getIndex(actualX + perso.w, perso.y + perso.h - 1);

    return ((perso.dx > 0 || differenceCamera>0) && (tileDroite1 !== "sky" || tileDroite2 !== "sky")) ||
           ((perso.dx < 0 || differenceCamera<0) && (tileGauche1 !== "sky" || tileGauche2 !== "sky"));
};

export const ecraser=(perso:any,goomba:any,cameraX:number)=>{
    const marioBottom = perso.y + perso.h;
    const goombaTop = goomba.y;
    const marioLeft = perso.x+cameraX;
    const marioRight = perso.x + perso.w + cameraX;
    const goombaLeft = goomba.x;
    const goombaRight = goomba.x + goomba.w;
    return (
        marioBottom >= goombaTop && // Collision verticale
        marioBottom - perso.dy < goombaTop && // mario vient de tomber
        marioRight > goombaLeft && marioLeft < goombaRight // collision horizontal
      )
}

export const collisionGoomba=(perso:any,goomba:any,cameraX:number)=>{
    const goombaBottom=goomba.y + goomba.h
    const marioTop=perso.y
    const marioLeft = perso.x+cameraX;
    const marioRight = perso.x + perso.w+cameraX;
    const goombaLeft = goomba.x;
    const goombaRight = goomba.x + goomba.w;
    return (
        marioRight > goombaLeft &&
        marioLeft < goombaRight &&
        marioTop >= goomba.y && marioTop <= goombaBottom
    ) 
}