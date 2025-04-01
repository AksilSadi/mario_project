import { useRef, useEffect, useState } from 'react';
import Tiles from './images/tiles.png'
import { tileSize, worldData } from "./models/conf";
import { generateMatrix } from './models/world';
import {CollisionX,CollisionY,ecraser,collisionGoomba} from './models/collision'
import characters from './images/characters.gif'
import mouvements from './models/marioMouvements'

const CanvasGame = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tileImage = useRef<HTMLImageElement>(new Image());
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const cameraOffset = useRef(0); // position de la camera actual
  const previousCameraOffset=useRef(0)
  // creer le background une seul fois et stocker le canva une seul fois puis en change canvaRef au fur a mesure
  const backgroundCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const backgroundCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const sprites =useRef<any>(mouvements)
  type Mario = {
    x: number;
    y: number;
    dx: number;
    dy: number;
    w: number;
    h: number;
    gravity: number;
    forceSaut: number;
    sauter: boolean;
    direction: 'right' | 'left';
    etat: 'runD' | 'runG' | 'stopD' | 'stopG' | 'sauterD' | 'sauterG' | 'mort';
    image: HTMLImageElement;
    frameIndex:number;
    frameCounter:number;
    FRAME_SPEED:number;

  };
  type Ennemi = {
    x: number;
    y: number;
    dx: number;
    dy: number;
    w: number;
    h: number;
    gravity: number;
    direction: 'left' | 'right';
    etat: 'marcher' | 'ecraser';
    image: HTMLImageElement;
    frameIndex:number;
    frameCounter:number;
    FRAME_SPEED:number;

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
    /*ennemi: Ennemi;*/
  };

  const StateRef = useRef<Etat>({
    personnage: { x: 0, y: 0, dx: 0, dy: 0, gravity: 0, forceSaut: 0, w: 0, h: 0, sauter: true, direction: 'right', etat: "stopD", image: new Image(),frameIndex:0,frameCounter:0,FRAME_SPEED:12 },
    endOfGame: false,
    ennemis:[]
    });

  const initialisation = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const { height, width } = ctx.canvas;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    const img=new Image()
    img.src=characters
    StateRef.current={
      personnage:{
      x: 50,
      y: 50,
      dx: 0,
      dy: 0,
      w:14,
      h:16,
      gravity: 0.3,
      forceSaut: -8,
      sauter: true,
      direction: 'right',
      etat:'stopD',
      image:img,
      frameIndex:0,
      frameCounter:0,
      FRAME_SPEED:4

    },
      endOfGame:false,
      ennemis:[
        { x: 200, y: 100, dx: -1, dy: 0, w: 16, h: 16, gravity: 0.3, direction: 'left', etat: 'marcher',image:img,frameIndex:0,frameCounter:0,FRAME_SPEED:20 },
        { x: 400, y: 100, dx: 1, dy: 0, w: 16, h: 16, gravity: 0.3, direction: 'right', etat: 'marcher',image:img,frameIndex:0,frameCounter:0,FRAME_SPEED:20 }
      ]
    }
    drawBackground(ctx);
   
  };

  const update = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let { personnage,ennemis } = StateRef.current;
  
    // reinitialiser la vitesse du mario
    personnage.dx = 0;
    personnage.dy += personnage.gravity;
    if(personnage.etat!=='mort'){
      if (keysPressed.current['ArrowRight']) {
        if (personnage.x >= canvas.width / 2 && cameraOffset.current < worldData.backgrounds[0].ranges[0][1] * tileSize - canvas.width) {
          // Déplacement de la caméra et Mario reste à sa position dans le monde
          cameraOffset.current += 3;
        } else {
          // mario avance normalement, et la camera ne bouge pas
          personnage.dx = 3;
        }
        
        personnage.frameCounter++;
        if (personnage.frameCounter >= personnage.FRAME_SPEED) {
          personnage.frameCounter = 0;
          personnage.frameIndex = (personnage.frameIndex + 1) % 4; 
      }
  
      } else if (keysPressed.current['ArrowLeft']) {
        if (cameraOffset.current > 0 && personnage.x <= canvas.width / 2) {
          // Déplacement de la caméra et Mario reste à sa position dans le monde
          cameraOffset.current -= 3;
        } else {
          // Si la caméra ne peut plus reculer, Mario peut bouger à gauche
          personnage.dx = -3;
        }
        personnage.frameCounter++;
        if (personnage.frameCounter >= personnage.FRAME_SPEED) {
          personnage.frameCounter = 0;
          personnage.frameIndex = (personnage.frameIndex + 1) % 4; 
      }
      }
      if (!keysPressed.current['ArrowRight'] && !keysPressed.current['ArrowLeft']) {
        personnage.frameIndex = 0; // devenir à l'image de base
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
  
      //gombas logique
      ennemis.forEach(goomba => {
        if (goomba.etat === 'ecraser') return;
        goomba.dy += goomba.gravity; // Appliquer la gravité
        goomba.frameCounter++;
        if (goomba.frameCounter >= goomba.FRAME_SPEED) {
          goomba.frameCounter = 0;
          goomba.frameIndex = (goomba.frameIndex + 1) % 2; 
      }
    
        // Vérifier collisions latérales et inverser direction
        if (CollisionX(goomba, 0, 0)) {
          goomba.dx *= -1; // Inverser la direction
          goomba.direction = goomba.direction === 'left' ? 'right' : 'left';
        }
    
        // Vérifier collisions au sol
        CollisionY(goomba, cameraOffset.current, previousCameraOffset.current);
    
        goomba.x += goomba.dx;
        goomba.y += goomba.dy;
        if(ecraser(personnage,goomba,cameraOffset.current)){
            goomba.etat = 'ecraser'; // change l'etat du goomba
            personnage.dy = personnage.forceSaut / 2; // mario rebondit un peu
            goomba.y += (goomba.h - 8);
            goomba.h = 8;
            ennemis = ennemis.filter(e => e !== goomba);//pour supprimer le goombat qui vient de s'ecraser dans notre etat de jeu
            setTimeout(()=>{
              StateRef.current.ennemis=ennemis;
            },500);  
        }
        if(collisionGoomba(personnage,goomba,cameraOffset.current)){
          personnage.etat='mort';
          personnage.dy=personnage.forceSaut;
        }
      });
    
      // Appliquer la gravité et gérer les collisions
      if(personnage.etat!=='mort'){
        CollisionY(personnage,cameraOffset.current,previousCameraOffset.current);
        if(CollisionX(personnage,cameraOffset.current,previousCameraOffset.current)){
          const differenceCamera=cameraOffset.current-previousCameraOffset.current
          const actualX = (personnage.x + personnage.dx + previousCameraOffset.current + differenceCamera);
          if(personnage.dx>0 || differenceCamera>0){
            personnage.dx = 0;
            personnage.x = ((Math.floor((actualX + personnage.w) / tileSize) * tileSize) - personnage.w)-cameraOffset.current;
          } else if(personnage.dx<0 || differenceCamera<0){
          personnage.dx = 0;
          personnage.x = (Math.ceil(actualX / tileSize) * tileSize)-cameraOffset.current;
        } else if (actualX < 0) {
          personnage.dx = 0;
          personnage.x = 0;
        }
        };
        // Appliquer le mouvement final de Mario
        personnage.x += personnage.dx;
      }
      personnage.y += personnage.dy;
  
      

  
      if (personnage.dy === 0) {
        const difference=cameraOffset.current-previousCameraOffset.current
        if (personnage.dx > 0 || difference>0 ) {
            personnage.etat = 'runD';
            personnage.direction = 'right';
        } else if (personnage.dx < 0 || difference<0) {
            personnage.etat = 'runG';
            personnage.direction = 'left'; 
        } else {
            if (personnage.direction === 'left') {
                personnage.etat = 'stopG';
            } else {
                personnage.etat = 'stopD';
            }
        }
    }else if(personnage.dy>0){
      personnage.sauter=true;
    }
      // Mettre à jour la position précédente de la caméra
     previousCameraOffset.current = cameraOffset.current;
  };
  


  const animate = (ctx: CanvasRenderingContext2D) => {
    if (StateRef.current.endOfGame) return;
    update();
    draw(ctx);
    setTimeout(()=>animate(ctx),15);
    
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
    const height = ctx.canvas.height;
    const width = ctx.canvas.width;
    if (backgroundCanvasRef.current) {
      ctx.drawImage(
        backgroundCanvasRef.current, 
        cameraOffset.current, 0, width, height, 
        0, 0, width, height
      );
    }
    drawPersonne(ctx)
    drawGomba(ctx);
  };

  const drawGomba=(ctx: CanvasRenderingContext2D)=>{
    const { ennemis } = StateRef.current;
    ennemis.forEach((ennemi,index)=>{
      const currentEtat = ennemi.etat;
  
    // Vérifier si l'état existe dans le JSON
    const spriteEntry = sprites.current.goomba.frames[currentEtat];
    if (!spriteEntry) return;
  
    let spriteData;
  
    if (Array.isArray(spriteEntry)) {
      // Vérifier que frameIndex est valide
      if (ennemi.frameIndex < 0 || ennemi.frameIndex >= spriteEntry.length) {
        ennemi.frameIndex = 0; // Réinitialiser si l'index est hors limites
      }
      spriteData = spriteEntry[ennemi.frameIndex];
    } else {
      spriteData = spriteEntry;
    }
  
    // Vérifier que spriteData est défini
    if (!spriteData) return;
  
    ctx.drawImage(
      ennemi.image,
      spriteData.pixel[0], spriteData.pixel[1], spriteData.pixel[2], spriteData.pixel[3], 
      ennemi.x -cameraOffset.current, ennemi.y, ennemi.w, ennemi.h
    );
    })
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    worldData.backgrounds.forEach(background => {
      const tileType = background.tile;

      background.ranges.forEach(range => {
        const [startX, endX, startY, endY] = range;

          for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
            let tileX = 0, tileY = 0;

            if (tileType === "sky") {
              tileX = 3;
              tileY = 23;

            } else if (tileType === "ground") {
              tileX = 0;
              tileY = 0;
            }else if(tileType ==='pipe'){
              ({ tileX, tileY } = getPipeTile(x, y, startX, startY));
            }

            ctx.drawImage(
              tileImage.current,
              tileX * tileSize, tileY * tileSize, tileSize, tileSize,
              x * tileSize - cameraOffset.current, y * tileSize, tileSize, tileSize
            );
          }
        }
      });
    });
  };


  useEffect(() => {
    tileImage.current.src = Tiles;
    tileImage.current.onload = () => {
      setIsLoaded(true);
      generateMatrix(); // generer la matrice du monde
  
      // creer et configurer le canvas de fond
      if (!backgroundCanvasRef.current) {
        backgroundCanvasRef.current = document.createElement('canvas');
        backgroundCanvasRef.current.width = worldData.backgrounds[0].ranges[0][1] * tileSize;
        backgroundCanvasRef.current.height = window.innerHeight; // Ajuste si nécessaire
  
        backgroundCtxRef.current = backgroundCanvasRef.current.getContext('2d');
      }
  
      if (backgroundCtxRef.current) {
        drawBackground(backgroundCtxRef.current); // dessiner une seule fois
      }
    };
  }, []);
  

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
      if(e.key==='ArrowLeft'){
        if(mario.dy===0){
          mario.etat='runG'
        }else{
          mario.etat='sauterG'
        }
          mario.direction='left'
      }else if(e.key==='ArrowRight'){
        if(mario.dy===0){
          mario.etat='runD'
        }else{
          mario.etat='sauterD'
        }
          mario.direction='right'
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

const getPipeTile = (x: number, y: number, startX: number, startY: number) => {
  let tileX = 0, tileY = 0;

  if (y === startY) {
    tileY = 8; // Partie haute du pipe
  } else {
    tileY = 9; // Corps du pipe
  }

  if (x === startX) {
    tileX = 0; // Côté gauche du pipe
  } else {
    tileX = 1; // Côté droit du pipe
  }

  return { tileX, tileY };
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
