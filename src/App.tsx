import { useRef, useEffect, useState } from 'react';
import Tiles from './images/tiles.png'
import { tileSize, worldData,SCALE,BASE_TILE_SIZE } from "./models/conf";
import { mat,getPosition } from './models/world';
import {CollisionX,CollisionY,ecraser,collisionGoomba} from './models/collision'
import characters from './images/characters.gif'
import fantomes from './images/Bones&&boo.png'
import mouvements from './models/marioMouvements'
import {astar} from './models/pathfinding'
import {catmullRomSpline} from './models/pathfindingSmooth'

const CanvasGame = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tileImage = useRef<HTMLImageElement>(new Image());
  const characterImageRef = useRef<HTMLImageElement>(new Image());
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const [isLoaded, setIsLoaded] = useState(false);
  // creer le background une seul fois et stocker le canva une seul fois puis en change canvaRef au fur a mesure
  const backgroundCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const backgroundCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const sprites =useRef<any>(mouvements)
  let lastMarioGridPos = { x: 0, y: 0 };
  type Mario = {
    x: number;
    y: number;
    dx: number;
    dy: number;
    w: number;
    h: number;
    Maxspeed:number
    gravity: number;
    forceSaut: number;
    sauter: boolean;
    direction: 'right' | 'left';
    etat: 'runD' | 'runG' | 'stopD' | 'stopG' | 'sauterD' | 'sauterG' | 'mort' | 'reverseD' | 'reverseG';
    image: HTMLImageElement;
    frameIndex:number;
    frameCounter:number;
    FRAME_SPEED:number;

  };
  type Point = { x: number, y: number };
  type Camera={
    x:number;
    y:number;
    dx:number;
    dy:number;
  }
  type canon={
    x:number;
    y:number;
    direction:'left' | 'right'
    lastShotTime:number;
    distance:number;//pour savoir si mario est dans la zone de tir
  }
  type Ennemi = {
    x: number;
    y: number;
    dx: number;
    dy: number;
    w: number;
    h: number;
    maxVisibilite?: number;//attribut pour piranha
    minVisibilite?: number;//attribut pour piranha
    tempsAttente?: number;//attribut pour piranha 
    type: 'goomba' | 'Bullet' | 'Piranha' | 'buzzyBeetle';
    gravity: number;
    direction?: 'left' | 'right' | 'Haut' | 'Bas';
    etat: 'marcher' | 'ecraser' | 'stopD' | 'stopG' | 'runD' | 'runG' | 'touchedD' | 'touchedG';
    image: HTMLImageElement;
    lancerCooldown?:number;//pour autoriser le lancer de la carapace
    frameIndex:number;
    frameCounter:number;
    FRAME_SPEED:number;
  };
  type noeud= {
    x: number;
    y: number;
    g: number; 
    h: number; 
    f: number; 
    parent: noeud | null; 
}
  type IAennemi = {
    x: number; 
    y: number;
    dx: number;
    dy: number;
    w: number;
    h: number;
    forceSaut: number;
    sauter: boolean;
    gravity: number;
    etat: 'marcher' | 'ecraser';
    direction: 'left' | 'right';
    path: noeud[];
    smoothPath: Point[];
    currentTargetIndex: number;
    image: HTMLImageElement;
    frameIndex:number;
    frameCounter:number;
    FRAME_SPEED:number;
    lastUpdate:number;
};
  type size = {
    width: number;
    height: number;
  };

  type Etat = {
    personnage: Mario;
    size?: size;
    endOfGame: boolean;
    ennemis:Ennemi[]
    Canon:canon[]
    intelligent:IAennemi
    camera:Camera
  };

  const StateRef = useRef<Etat>({
    personnage: { x: 0, y: 0, dx: 0, dy: 0, gravity: 0, forceSaut: 0, w: 0, h: 0,Maxspeed:0, sauter: true, direction: 'right', etat: "stopD", image: new Image(),frameIndex:0,frameCounter:0,FRAME_SPEED:12 },
    endOfGame: false,
    ennemis:[],
   intelligent: { x: 0, y: 0, dx: 0, dy: 0, gravity: 0, w: 0, h: 0,forceSaut: 0,sauter: true,etat: 'marcher', direction:'right' , path: [],smoothPath:[], currentTargetIndex: 0,image:new Image(),frameIndex:0,frameCounter:0,FRAME_SPEED:20,lastUpdate:0 } ,
   camera:{x:0,y:0,dx:0,dy:0},
   Canon:[]
    });

  const initialisation = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const { height, width } = ctx.canvas;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    const img=new Image();
    const img2=new Image();
    img.src=characters
    img2.src=fantomes
    StateRef.current={
      personnage:{
      x: 50,
      y: (height-(tileSize*2))-12,
      dx: 0,
      dy: 0,
      w:14*SCALE,
      h:16*SCALE,
      gravity: 0.3*SCALE,
      forceSaut: -8*SCALE,
      sauter: true,
      direction: 'right',
      etat:'stopD',
      image:img,
      frameIndex:0,
      frameCounter:0,
      FRAME_SPEED:6,
      Maxspeed:2.5*SCALE
    },
      endOfGame:false,
      ennemis:[
        { x: 200, y: 100, dx: 1*SCALE, dy: 0, w: 16*SCALE, h: 16*SCALE,type:"goomba", gravity: 0.3*SCALE, direction: 'left', etat: 'marcher',image:img,frameIndex:0,frameCounter:0,FRAME_SPEED:20 },
        { x: 400, y: 100, dx: 1*SCALE, dy: 0, w: 16*SCALE, h: 16*SCALE,type:"goomba", gravity: 0.3*SCALE, direction: 'right', etat: 'marcher',image:img,frameIndex:0,frameCounter:0,FRAME_SPEED:20 },
        { x: 600, y: 100, dx: 1*SCALE, dy: 0, w: 16*SCALE, h: 16*SCALE,type:"buzzyBeetle", gravity: 0.3*SCALE,lancerCooldown:0, direction: 'right', etat: 'marcher',image:img,frameIndex:0,frameCounter:0,FRAME_SPEED:20 }
      ],
      intelligent: { x: 1000, y: (height-(tileSize*2))-5, dx: -1*SCALE, dy: -1*SCALE, w: 16*SCALE, h: 16*SCALE, gravity: 0.3*SCALE,forceSaut: -8*SCALE,sauter: true,etat: 'marcher', direction:'right', path: [],smoothPath:[], currentTargetIndex: 0,image:img2,frameIndex:0,frameCounter:0,FRAME_SPEED:20,lastUpdate:0 },
      camera:{x:0,y:0,dx:0,dy:0},
      Canon:[],
      size:{
        height:height,
        width:width
      }
    }
    drawBackground(ctx);
   
   
  };



  const update = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let { personnage,ennemis,camera,size } = StateRef.current;
    personnage.dy += personnage.gravity;
    if(personnage.etat!=='mort'){
      updateBullet(StateRef.current);
      //updateIA(intelligent);
      if (keysPressed.current['ArrowRight']  ) {
        personnage.FRAME_SPEED=4;
        if (personnage.x >= canvas.width / 2 && camera.x < worldData.backgrounds[0].ranges[0][1] * tileSize - canvas.width) {
            camera.dx += personnage.dx+0.15;//transition fluide car en ce moment la je bouge la camera mais pas mario
            personnage.dx=0;
           if (camera.dx > personnage.Maxspeed) camera.dx = personnage.Maxspeed;//si on atteint la vitesse max on peut plus accelerer donc on fixe la vitesse a son max 
          
        } else {
            personnage.dx += 0.15;
           if (personnage.dx > personnage.Maxspeed) personnage.dx = personnage.Maxspeed;//si on atteint la vitesse max on peut plus accelerer donc on fixe la vitesse a son max 
        }
        
  
      } else if (keysPressed.current['ArrowLeft'] ) {
        personnage.FRAME_SPEED=4;
        if (
          personnage.x > canvas.width / 2 &&
          camera.x > 0
        ){
            camera.dx -= 0.15;
           if (camera.dx < -personnage.Maxspeed) camera.dx = -personnage.Maxspeed;
        } else {
            personnage.dx -=0.15;
           if (personnage.dx < -personnage.Maxspeed) personnage.dx = -personnage.Maxspeed; 
        }
      }

      if(((!keysPressed.current['ArrowLeft']) && (!keysPressed.current['ArrowRight']))){
        personnage.FRAME_SPEED=6;
        personnage.dx *= 0.95;
        camera.dx*=0.95
        if (Math.abs(personnage.dx) > 0 && Math.abs(personnage.dx) < 0.5 ) {
          personnage.dx = 0;
        }else if(Math.abs(camera.dx) > 0 && Math.abs(camera.dx) < 0.5){
          camera.dx=0;
        }
      }
      if(personnage.dx!==0 || camera.dx!==0){
        personnage.frameCounter++;
        if (personnage.frameCounter >= personnage.FRAME_SPEED) {
          personnage.frameCounter = 0;
          personnage.frameIndex = (personnage.frameIndex + 1) % 4; 
      }
      }
    
      // Saut
      if (keysPressed.current[' '] && !personnage.sauter) {
        personnage.dy = personnage.forceSaut;
        personnage.sauter = true;
        if(personnage.etat==='runD' || personnage.etat==='stopD'){
          personnage.etat='sauterD'
        }else if(personnage.etat==='runG' || personnage.etat==='stopG'){
          personnage.etat='sauterG';
        }
      }
    }
  
      //ennemis logique
      ennemis.forEach(ennemi => {
        switch (ennemi.type) {
          case 'goomba':
            updateGoomba(ennemi,StateRef.current);
            break;
          case 'Bullet':
            moveBullet(ennemi,StateRef.current);
            break;
          case 'Piranha':
            movePiranha(ennemi,StateRef.current);
            break;
          case 'buzzyBeetle':
            updateBuzzyBeetle(ennemi,StateRef.current);
            break;
          default:
            break;
        }
        if (ennemi.lancerCooldown && ennemi.lancerCooldown > 0) {
       ennemi.lancerCooldown--;
      }
        ennemi.frameCounter++;
        if (ennemi.frameCounter >= ennemi.FRAME_SPEED) {
          ennemi.frameCounter = 0;
          ennemi.frameIndex = (ennemi.frameIndex + 1) % 2; 
      }
      ennemis.forEach((autreGoomba) => {
        if (autreGoomba !== ennemi && autreGoomba.type!=='Bullet') {
          if (collisionGoomba(ennemi, autreGoomba, 0)) {
            ennemi.dx *= -1; // inverser la direction
            ennemi.direction = ennemi.direction === 'left' ? 'right' : 'left';
          }
        }
      });
      //pour interdir de rebondir sur les ennemis une fois que mario mort
      if (personnage.etat !== 'mort') {
        if (ennemi.etat !== 'ecraser') {
          if (collisionGoomba(personnage, ennemi, camera.x)) {
            if (!ennemi.lancerCooldown || ennemi.lancerCooldown <= 0) {
              personnage.etat = 'mort';
              personnage.dy = personnage.forceSaut;
            }
          }
        }
      }
      
      });
    
      // gestion de collision et de gravite
      if(personnage.etat!=='mort'){
        CollisionY(personnage,camera.x);
        if(CollisionX(personnage,camera.x,camera.dx)){
          const actualX = (personnage.x + personnage.dx + camera.x + camera.dx);
          if(personnage.dx>0 || camera.dx>0){
            personnage.dx = 0;
            camera.dx=0;
            personnage.x = ((Math.floor((actualX + personnage.w) / tileSize) * tileSize) - personnage.w)-camera.x;
          } else if(personnage.dx<0 || camera.dx<0){
          personnage.dx = 0;
          camera.dx=0;//stopper imediatement la camera si on est en collision avec un truc(pas d'effet glaissage)
          personnage.x = (Math.ceil(actualX / tileSize) * tileSize)-camera.x;
        } else if (actualX < 0) {
          personnage.dx = 0;
          personnage.x = 0;
          camera.dx=0;
          
        }
        };
        camera.x += camera.dx;
        // Clamp la caméra dans les bornes du monde
        if (camera.x <= 0) {
          camera.x = 0;
          personnage.dx+=camera.dx;//passer l'accleration de la camera a l'acceleration de mario 
          camera.dx=0;
        } else if (camera.x > worldData.backgrounds[0].ranges[0][1] * tileSize - canvas.width) {
          camera.x = worldData.backgrounds[0].ranges[0][1] * tileSize - canvas.width;
          camera.dx = 0;
        }
        // Si la caméra ne bouge pas on deplace mario
        if (camera.dx === 0) {
          personnage.x += personnage.dx;
        }
      }
      personnage.y += personnage.dy;
  
      if (personnage.dy === 0) {
        if (personnage.dx > 0 || camera.dx>0 ) {
          if(keysPressed.current['ArrowLeft'] || personnage.direction==='left'){
            personnage.etat='reverseG';
            personnage.direction='left';
          }else{
            personnage.etat = 'runD';
            personnage.direction = 'right';
          }
            
        } else if (personnage.dx < 0 || camera.dx<0) {
          if(keysPressed.current['ArrowRight'] ||  personnage.direction==='right'){
            personnage.etat='reverseD';
            personnage.direction='right';
          }else{
            personnage.etat = 'runG';
            personnage.direction = 'left';
          }
        } else if(personnage.dx===0 || camera.dx===0) {
            if (personnage.direction === 'left') {
                personnage.etat = 'stopG';
            } else {
                personnage.etat = 'stopD';
            }
        }
    }else if(personnage.dy>0){
      personnage.sauter=true;
    }
  };
  


  const animate = (ctx: CanvasRenderingContext2D) => {
    if (StateRef.current.endOfGame) return;
    update();
    draw(ctx);
    requestAnimationFrame(()=>animate(ctx));
  };

  const drawPersonne = (ctx: CanvasRenderingContext2D) => {
    const { personnage } = StateRef.current;
    const currentEtat = personnage.etat;
  
    // verifier si l'état existe dans le JSON
    const spriteEntry = sprites.current.mario.frames[currentEtat];
    if (!spriteEntry) return;
  
    let spriteData;
  
    if (Array.isArray(spriteEntry)) {
      // Vérifier que frameIndex est valide
      if (personnage.frameIndex < 0 || personnage.frameIndex >= spriteEntry.length) {
        personnage.frameIndex = 0; // Réinitialiser si l'index est hors limites
      }
      spriteData = spriteEntry[personnage.frameIndex];
    } else {
      spriteData = spriteEntry;
    }
  
    // Vérifier que spriteData est défini
    if (!spriteData) return;
  
    ctx.drawImage(
      personnage.image,
      spriteData.pixel[0], spriteData.pixel[1], spriteData.pixel[2], spriteData.pixel[3], 
      personnage.x, personnage.y, personnage.w, personnage.h
    );
  };
  

  const draw = (ctx: CanvasRenderingContext2D) => {
    
    let {camera } = StateRef.current;
    const height = ctx.canvas.height;
    const width = ctx.canvas.width;
    ctx.clearRect(0, 0, width, height);
    
    ctx.save();
    ctx.fillStyle = "#70c5ff"; // ciel
    ctx.fillRect(0, 0, width, height);//pour remplir le vide blanc
    
    // Applique l’échelle
 
    if (backgroundCanvasRef.current) {
      ctx.drawImage(
        backgroundCanvasRef.current, 
        camera.x, 0, width, height, 
        0, 0, width, height
      );
    }

    drawPersonne(ctx);
    drawEnnemi(ctx);
    drawIAennemi(ctx);
    drawPipe(ctx);//pour cacher la plante quand elle descent

    ctx.restore(); // Restaure l'état initial du contexte
};

 const drawIAennemi=(ctx: CanvasRenderingContext2D)=>{
    const { intelligent,camera } = StateRef.current;
    const currentEtat = intelligent.etat;
    // Vérifier si l'état existe dans le JSON
    const spriteEntry = sprites.current.fantome.frames[currentEtat];
    if (!spriteEntry) return;
    let spriteData;
    if (Array.isArray(spriteEntry)) {
      // Vérifier que frameIndex est valide
      if (intelligent.frameIndex < 0 || intelligent.frameIndex >= spriteEntry.length) {
        intelligent.frameIndex = 0; // Réinitialiser si l'index est hors limites
      }
      spriteData = spriteEntry[intelligent.frameIndex];
    } else {
      spriteData = spriteEntry;
    }

    if (!spriteData) return;
    if(intelligent.direction==='left'){
      //inverser l'image 
    ctx.save();
    ctx.translate(intelligent.x - camera.x + intelligent.w, intelligent.y);
    ctx.scale(-1, 1);
    ctx.drawImage(    
      intelligent.image,
      spriteData.pixel[0], spriteData.pixel[1], spriteData.pixel[2], spriteData.pixel[3], 
      0, 0, intelligent.w, intelligent.h
    );
    ctx.restore();
    }else{
      ctx.drawImage(
        intelligent.image,
        spriteData.pixel[0], spriteData.pixel[1], spriteData.pixel[2], spriteData.pixel[3], 
        intelligent.x-camera.x, intelligent.y, intelligent.w, intelligent.h
      );
    }
    
  };

  const drawEnnemi=(ctx: CanvasRenderingContext2D)=>{
    const { ennemis,camera } = StateRef.current;
    ennemis.forEach((ennemi,index)=>{
      const currentEtat = ennemi.etat;
  
    // verifier si l'etat existe dans le JSON
    let spriteEntry=sprites.current[ennemi.type].frames
    if(ennemi.type==='Bullet'){
      if(ennemi.direction==='left'){
        spriteEntry = spriteEntry['stopG'];
      }else{
        spriteEntry = spriteEntry['stopD'];
      }
    }else{
      spriteEntry = spriteEntry[currentEtat];
    }
    if (!spriteEntry) return;
    let spriteData;
  
    if (Array.isArray(spriteEntry)) {
      // Vérifier que frameIndex est valide
      if (ennemi.frameIndex < 0 || ennemi.frameIndex >= spriteEntry.length) {
        ennemi.frameIndex = 0; // reinitialiser si l'index est hors limites
      }
      spriteData = spriteEntry[ennemi.frameIndex];
    } else {
      spriteData = spriteEntry;
    }
  
    // verifier que le spritedata est bien defini
    if (!spriteData) return;
      ctx.drawImage(
        ennemi.image,
        spriteData.pixel[0], spriteData.pixel[1], spriteData.pixel[2], spriteData.pixel[3], 
        ennemi.x -camera.x, ennemi.y, ennemi.w, ennemi.h
      );
    })
  };

  const drawPipe=(ctx: CanvasRenderingContext2D)=>{
    const { camera } = StateRef.current;
    let pipeStartX = -1;
    let pipeStartY = -1;
    let X = 0, Y = 0;
    for (let y = 0; y < mat.length; y++) { // Parcourt les lignes de la matrice
      for (let x = 0; x < mat[y].length; x++) { 
        if (mat[y][x] === "pipe") {
          if (pipeStartX === -1 && pipeStartY === -1) {
            pipeStartX = x;
            pipeStartY = y;
          }
          ({ X, Y } = getPipeTile(x, y, pipeStartX, pipeStartY, 'pipe'));
          // Dessine le tuyau
          ctx.drawImage(
            tileImage.current,
            X, Y, BASE_TILE_SIZE, BASE_TILE_SIZE,
            x * tileSize - camera.x, y * tileSize, tileSize+1, tileSize+1
          );
        }
      } 
  }
}

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    const { camera,Canon,ennemis } = StateRef.current;
    let pipeStartX = -1;
    let pipeStartY = -1;
    let canonStartY = -1;
    let canonStartX = -1;
    let X = 0, Y = 0;
        for (let y = 0; y < mat.length; y++) { // Parcourt les lignes de la matrice
          for (let x = 0; x < mat[y].length; x++) {            
            if (mat[y][x] === "sky") {
              X = 3*BASE_TILE_SIZE;
              Y = 23*BASE_TILE_SIZE;

            } else if (mat[y][x] === "ground") {
              X = 0;
              Y = 0;
            }else if(mat[y][x] ==='pipe'){
              const isTopPart = (y === 0 || mat[y - 1][x] !== "pipe") && pipeStartX !== -1;
              if (isTopPart) {
                ennemis.push({
                  x: (x*tileSize)-tileSize/2,
                  y: (y*tileSize),
                  dx: 0,
                  dy: SCALE,
                  w: 16*SCALE,
                  h: 16*SCALE,
                  maxVisibilite:(y*tileSize)-tileSize,
                  minVisibilite:(y*tileSize),
                  tempsAttente:0,
                  type:"Piranha",
                  gravity: 0.2*SCALE,
                  direction: 'Haut',
                  etat: 'marcher',
                  image:characterImageRef.current,
                  frameIndex:0,
                  frameCounter:0,FRAME_SPEED:10
              });
              }
              if (pipeStartX === -1 && pipeStartY === -1) {
                pipeStartX = x;
                pipeStartY = y;
              }
              ({ X, Y } = getPipeTile(x, y, pipeStartX, pipeStartY, 'pipe'));
            }else if(mat[y][x] ==='canon'){
              const isTopPart = y === 0 || mat[y - 1][x] !== "canon";
              if (isTopPart) {
                Canon.push({
                  x,
                  y,
                  direction:'left',
                  lastShotTime: Date.now(),
                  distance:1000
                });
              }
              if (canonStartX === -1 && canonStartY === -1) {
                canonStartX = x;
                canonStartY = y;
              }
              ({ X, Y } = getPipeTile(x, y, canonStartX, canonStartY, 'canon'));
              ctx.drawImage(
                characterImageRef.current,
                X, Y, BASE_TILE_SIZE, BASE_TILE_SIZE,
                x * tileSize - camera.x, y * tileSize, tileSize+1, tileSize+1
              );
              continue;
            }
            ctx.drawImage(
              tileImage.current,
              X, Y, BASE_TILE_SIZE, BASE_TILE_SIZE,
              x * tileSize - camera.x, y * tileSize, tileSize+1, tileSize+1
            );
            
          } 
        } 
  };


  useEffect(() => {
    const loadImagesAndDraw = async () => {
      try {
        const [tilesImg, charsImg] = await Promise.all([
          loadImage(Tiles),
          loadImage(characters)
        ]);
  
        tileImage.current = tilesImg;
        characterImageRef.current = charsImg;
  
        setIsLoaded(true);
  
        if (!backgroundCanvasRef.current) {
          backgroundCanvasRef.current = document.createElement('canvas');
          backgroundCanvasRef.current.width = worldData.backgrounds[0].ranges[0][1] * tileSize;
          backgroundCanvasRef.current.height = window.innerHeight;
          backgroundCtxRef.current = backgroundCanvasRef.current.getContext('2d');
        }
  
        if (backgroundCtxRef.current) {
          drawBackground(backgroundCtxRef.current);
        }
  
      } catch (err) {
        console.error("Erreur lors du chargement des images :", err);
      }
    };
  
    loadImagesAndDraw();
  }, []);  

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  };
  

  useEffect(() => {
    if (!isLoaded) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        initialisation(ctx, canvas);
        requestAnimationFrame(() => animate(ctx));
      }
    }
  }, [isLoaded]);

  // Redimensionner le canvas
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const mario = StateRef.current.personnage;
    keysPressed.current[e.key] = true;
    if(mario.etat!=='mort'){
      if(e.key==='ArrowLeft' ){
        keysPressed.current['ArrowRight'] = false;
        if(mario.dy===0){
          if(mario.etat==='runD'){
            mario.etat='reverseG';
          }else{
            mario.etat='runG';
          }
        }else{
          mario.etat='sauterG';
        }
          mario.direction='left';
      }
       else if(e.key==='ArrowRight' ){
        keysPressed.current['ArrowLeft'] = false;
        if(mario.dy===0){
          if(mario.etat==='runG'){
            mario.etat='reverseD';
          }else{
             mario.etat='runD';
          }
         
        }else{
          mario.etat='sauterD';
        }
          mario.direction='right';
      }
    }
    }

  const handleKeyUp = (e: KeyboardEvent) => {
    const mario = StateRef.current.personnage;
    if(mario.etat!=='mort'){
      keysPressed.current[e.key] = false;
    if(e.key==='ArrowRight'){
      if(!keysPressed.current['ArrowLeft'] && !keysPressed.current['ArrowRight']){
        mario.etat='stopD'
      }
    }else if(e.key==='ArrowLeft'){
      if(!keysPressed.current['ArrowLeft'] && !keysPressed.current['ArrowRight']){
        mario.etat='stopG';
      }
    }
    }
    
};

const getPipeTile = (x: number, y: number, startX: number, startY: number, type:string) => {
  let X = 0, Y = 0;
  if(type==='pipe'){
    if (y === startY) {
      Y = 8*BASE_TILE_SIZE;
    } else {
      Y = 9*BASE_TILE_SIZE;
    }
  
    if (x === startX) {
      X = 0;
    } else {
      X = BASE_TILE_SIZE;
    }
  }else if(type==='canon'){
    if (y === startY) {
      Y = 333; // Partie haute du canon
    } else {
      Y = 349; // Corps du canon
    }
    X=248;
    
  }
  

  return { X, Y };
};

//la recherche

const generatepath=(sourceX:number,sourceY:number,cibleX:number,cibleY:number,ennemi:IAennemi)=>{
  const noeudSource:noeud={
    x: getPosition(sourceX),
    y: getPosition(sourceY),
    g: 0, h: 0, f: 0, parent: null
  }
  const noeudCible:noeud={
    x: getPosition(cibleX),
    y: getPosition(cibleY),
    g: 0, h: 0, f: 0, parent: null
}
 const path =astar(noeudSource,noeudCible);
 ennemi.path=path;
 const points: Point[] = path.map(n => ({ x: n.x * 12, y: n.y * 12 }));
  ennemi.smoothPath = catmullRomSpline(points);
 return ennemi;
}

const updateIA=(ennemi:IAennemi)=> {
  const {personnage,camera}= StateRef.current;
  const realX=personnage.x+camera.x;
  const marioGridX = getPosition(realX);
  const marioGridY = getPosition(personnage.y);
  const path = ennemi.smoothPath;
  if (path && path.length > 1) {
    const dx = path[1].x - path[0].x;
    if (Math.abs(dx) > 0.1) {
      ennemi.direction = dx > 0 ? 'right' : 'left';
    } else {
      const finalDx = path[path.length - 1].x - path[0].x;
      if (Math.abs(finalDx) > 0.1) {
        ennemi.direction = finalDx > 0 ? 'right' : 'left';
      }
      // Sinon on ne change pas la direction
    }
  }
  if (marioGridX !== lastMarioGridPos.x || marioGridY !== lastMarioGridPos.y) {
    const now = performance.now();
    if (now - ennemi.lastUpdate > 300) { // mettons à jour max 3 fois/seconde
      generatepath(ennemi.x, ennemi.y, realX, personnage.y, ennemi);
      lastMarioGridPos = { x: marioGridX, y: marioGridY };
      ennemi.currentTargetIndex = 0;
      ennemi.lastUpdate = now;
    }
  }  
  //suivre le chemin pour atteindre la cible
  suivreChemin(ennemi);
}



const suivreChemin = (ennemi: IAennemi) => {
  if (!ennemi.smoothPath || ennemi.currentTargetIndex >= ennemi.smoothPath.length) return;
  const target = ennemi.smoothPath[ennemi.currentTargetIndex];
  const dx = target.x - ennemi.x;
  const dy = target.y - ennemi.y;
  const distance = Math.hypot(dx, dy);
  const seuil = 1.0;

  if (distance < seuil) {
    ennemi.x = target.x;
    ennemi.y = target.y;
    ennemi.currentTargetIndex += 10;
    return;
  }


  const speed = 2; 
  ennemi.dx = (dx / distance) * speed;
  ennemi.dy = (dy / distance) * speed;

  ennemi.x += ennemi.dx;
  ennemi.y += ennemi.dy;
  ennemi.frameCounter++;
  if (ennemi.frameCounter >= ennemi.FRAME_SPEED) {
    ennemi.frameCounter = 0;
    ennemi.frameIndex = (ennemi.frameIndex + 1) % 2;
  }
};

const updateBullet=(etat:Etat)=>{
  for (const canon of etat.Canon) {
    if(peutTirer(canon,etat.personnage,etat.camera.x,etat.size!.width)){
      canon.lastShotTime=Date.now();
      if(etat.personnage.x-canon.x>0){
        canon.direction='right'
      }else{
        canon.direction='left'
      }
      const X=canon.x*tileSize;
      const Y=canon.y*tileSize;
      tirer(etat,X,Y,canon.direction);
    }
    
  }
}
const tirer=(etat:Etat,X:number,Y:number,Direction:'right' | 'left')=>{
  const img=new Image();
  img.src=characters;
  etat.ennemis.push({
      x: X,
      y: Y,
      dx: Direction==='right'?1*SCALE:-1*SCALE,
      dy: 0,
      w: 16*SCALE,
      h: 16*SCALE,
      type:"Bullet",
      gravity: 0.2*SCALE,
      direction: Direction,
      etat: Direction==='right'?'stopD':'stopG',
      image:img,
      frameIndex:0,
      frameCounter:0,FRAME_SPEED:20
  })
}

const peutTirer=(canon:canon,mario:Mario,cameraX:number,screenWidth:number):boolean=>{
  const time = Date.now();
  const distance = Math.abs(canon.x - mario.x);

  const marge = canon.distance;//une distance suuplimentaire pour que le canon tire
  const estVisibleOuProche =
    canon.x > cameraX - marge && canon.x < cameraX + screenWidth + marge;
  return (
    time - canon.lastShotTime > 5000 &&
    
    estVisibleOuProche
  ); 
}


const updateGoomba=(ennemi:Ennemi,etat:Etat)=>{
  let { personnage,camera,ennemis } = etat;
  if (ennemi.etat === 'ecraser') return;
  ennemi.dy += ennemi.gravity; // Appliquer la gravité
    if (CollisionX(ennemi, 0, 0)) {
      ennemi.dx *= -1; // inverser la direction
      ennemi.direction = ennemi.direction === 'left' ? 'right' : 'left';
    }
  // verifier collisions au sol
  ennemi.x += ennemi.dx;
    CollisionY(ennemi, camera.x);
    ennemi.y += ennemi.dy;
  if(personnage.etat!=='mort'){
      if(ecraser(personnage,ennemi,camera.x)){
        ennemi.y += (ennemi.h - 8);
        ennemi.h = 8;
        ennemis = ennemis.filter(e => e !== ennemi);//pour supprimer le goombat qui vient de s'ecraser dans notre etat de jeu
        setTimeout(()=>{
          StateRef.current.ennemis=ennemis;
        },500); 
        
        ennemi.etat = 'ecraser';
        personnage.dy = personnage.forceSaut / 2; // mario rebondit un peu 
    }
    }
  }

  const updateBuzzyBeetle = (ennemi: Ennemi, etat: Etat) => {
    let { personnage, camera } = etat;
  
    ennemi.dy += ennemi.gravity;
  
    // appliquer la vitesse selon l'état
    if (ennemi.etat === 'touchedD') {
      ennemi.dx = SCALE * 3;
    } else if (ennemi.etat === 'touchedG') {
      ennemi.dx = -SCALE * 3;
    }
  
    // Collision laterale (rebond)
    if (CollisionX(ennemi, 0, 0)) {
      ennemi.dx *= -1;
      ennemi.direction = ennemi.direction === 'left' ? 'right' : 'left';
  
      
      if (ennemi.etat === 'touchedD') {
        ennemi.etat = 'touchedG';
      } else if (ennemi.etat === 'touchedG') {
        ennemi.etat = 'touchedD';
      }
    }
  
    
    if (
      ennemi.etat !== 'ecraser' &&
      ennemi.etat !== 'touchedD' &&
      ennemi.etat !== 'touchedG'
    ) {
      if (ennemi.dx > 0) {
        ennemi.etat = 'runD';
      } else if (ennemi.dx < 0) {
        ennemi.etat = 'runG';
      }
    }
  
    
    ennemi.x += ennemi.dx;
    CollisionY(ennemi, camera.x);
    ennemi.y += ennemi.dy;
  
    
    if (personnage.etat !== 'mort') {
      if (ecraser(personnage, ennemi, camera.x)) {
        ennemi.dx = 0;
        ennemi.etat = 'ecraser';
        personnage.dy = personnage.forceSaut / 2;
      }
    }
  
    // Lancer la carapace
    if (ennemi.etat === 'ecraser') {
      if (collisionGoomba(personnage, ennemi, camera.x)) {
        ennemi.etat = personnage.dx > 0 ? 'touchedD' : 'touchedG';
        ennemi.lancerCooldown = 10;
      }
    }
  };
  

const moveBullet=(ennemi:Ennemi,etat:Etat)=>{
  let { personnage,camera,size,ennemis } = etat;
  ennemi.dy += ennemi.gravity;//cela permet de faire tomber la balle
  if(size){
    if ( ennemi.y <= 0 || ennemi.y >= size?.height) {
      StateRef.current.ennemis = StateRef.current.ennemis.filter(e => e !== ennemi);
    }
  }
  ennemi.x += ennemi.dx;
  if(ennemi.etat==='ecraser'){
    ennemi.y += ennemi.dy;
  }
  if(personnage.etat!=='mort'){
    if(ennemi.etat!=='ecraser'){
      if(ecraser(personnage,ennemi,camera.x)){
          ennemi.dx=0;
          ennemi.dy=0;
          ennemi.y-=ennemi.h/2;
        
        ennemi.etat = 'ecraser';
        personnage.dy = personnage.forceSaut / 2; // mario rebondit un peu 
    }
    }

  }
}

const movePiranha = (ennemi: Ennemi, etat: Etat) => {
  if (ennemi.etat === 'ecraser') return;

  // initialiser l'attribut s'il est indéfini
  if (ennemi.tempsAttente === undefined) {
    ennemi.tempsAttente = 0;
  }

  if (ennemi.y >= ennemi.minVisibilite!) {
    if (ennemi.tempsAttente < 60) {
      ennemi.dy = 0;
      ennemi.tempsAttente++;
    } else {
      ennemi.dy = -0.5; // redescend
      ennemi.tempsAttente = 0;
    }
  } else if (ennemi.y < ennemi.maxVisibilite!) {
    if (ennemi.tempsAttente < 60) {
      ennemi.dy = 0;
      ennemi.tempsAttente++;
    } else {
      ennemi.dy = 0.5; // remonte
      ennemi.tempsAttente = 0;
    }
  }
  ennemi.y += ennemi.dy;
};





  useEffect(() => {
    resizeCanvas(); // Redimensionner à l'ouverture
    window.addEventListener('resize', resizeCanvas); // Redimensionner lors du changement de taille de fenêtre
    window.addEventListener("keydown", handleKeyDown); // Ajouter l'écouteur pour les touches*/
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener("keydown", handleKeyDown); // Supprimer l'écouteur pour les touches
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
};

const App = () => {
  return (
    <div className="App">
      <CanvasGame />
    </div>
  );
};

export default App;
