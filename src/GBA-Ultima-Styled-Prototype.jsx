import React, { useRef, useEffect, useState } from "react";
import grassImg from "./assets/tile_grass.png";
import waterImg from "./assets/tile_water.png";
import sandImg from "./assets/tile_sand.png";
import wallImg from "./assets/tile_wall.png";
import playerImg from "./assets/player.png";
import enemyImg from "./assets/enemy.png";
import npcImg from "./assets/npc.png";

const TILE_SIZE = 16;
const SCALE = 3;
const VIEWPORT_TILES_X = 20;
const VIEWPORT_TILES_Y = 14;
const CANVAS_WIDTH = VIEWPORT_TILES_X * TILE_SIZE * SCALE;
const CANVAS_HEIGHT = VIEWPORT_TILES_Y * TILE_SIZE * SCALE;

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function randInt(a,b){return Math.floor(Math.random()*(b-a+1))+a;}

function generateMap(width,height){ const map = Array.from({length:height}, ()=>Array.from({length:width}, ()=>({t:'grass'}))); for(let y=0;y<height;y++){for(let x=0;x<width;x++){ if(x<2||y<2||x>width-3||y>height-3) map[y][x].t='water'; else if(Math.random()<0.03) map[y][x].t='water'; else if(Math.random()<0.04) map[y][x].t='sand'; else if(Math.random()<0.02) map[y][x].t='wall';}} const vx=Math.floor(width/3), vy=Math.floor(height/3); for(let y=vy;y<vy+6;y++) for(let x=vx;x<vx+10;x++) map[y][x].t = Math.random()<0.12 ? 'wall' : 'grass'; return map; }

const defaultPlayer = { x:8,y:8,hp:20,maxHp:20,attack:4,speed:6,inventory:[{id:'potion',name:'Healing Potion',qty:2,heal:8}],gold:5 };

function useKeyboard(){ const [keys,setKeys]=useState({}); useEffect(()=>{ function down(e){ setKeys(k=>({...k,[e.key.toLowerCase()]:true})); } function up(e){ setKeys(k=>({...k,[e.key.toLowerCase()]:false})); } window.addEventListener('keydown',down); window.addEventListener('keyup',up); return ()=>{ window.removeEventListener('keydown',down); window.removeEventListener('keyup',up); }; },[]); return keys; }

export default function GBAUltimaPrototype(){ const canvasRef=useRef(null); const keys = useKeyboard(); const [map]=useState(()=>generateMap(60,40)); const [player,setPlayer]=useState(()=>{ const s=localStorage.getItem('dawn_save_v1'); return s?JSON.parse(s).player:defaultPlayer; }); const [entities,setEntities]=useState(()=>{ const list=[]; for(let i=0;i<8;i++) list.push({ id:`e${i}`, type:'enemy', x:randInt(10,50), y:randInt(10,30), hp:8, maxHp:8, atk:2, vx:0, vy:0, cooldown:0 }); list.push({ id:'npc1', type:'npc', x:22, y:12, name:'Old Man', dialog:['Welcome, traveler!','Bring me 3 gold and I\\'ll teach you a trick.']}); list.push({ id:'npc2', type:'npc', x:24, y:14, name:'Merchant', dialog:['Buy potions? Press I to open inventory.']}); return list; }); const [selectedItemIndex,setSelectedItemIndex]=useState(0); const [showInventory,setShowInventory]=useState(false); const [messages,setMessages]=useState([]); const [dialog,setDialog]=useState(null); const [combatLog,setCombatLog]=useState([]); const [attackCooldown,setAttackCooldown]=useState(0);

useEffect(()=>{ const id=setInterval(()=>setAttackCooldown(c=>Math.max(0,c-0.1)),100); return ()=>clearInterval(id); },[]);

useEffect(()=>{ const canvas = canvasRef.current; const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false; let last = performance.now(); function frame(now){ const dt = Math.min(0.05,(now-last)/1000); update(dt); render(ctx); last = now; requestAnimationFrame(frame); } requestAnimationFrame(frame);

function update(dt){ let dx=0, dy=0; if(keys['w']||keys['arrowup']) dy -=1; if(keys['s']||keys['arrowdown']) dy +=1; if(keys['a']||keys['arrowleft']) dx -=1; if(keys['d']||keys['arrowright']) dx +=1; if(dx!==0 && dy!==0){ dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; } const moveSpeed = (player.speed / TILE_SIZE) * dt; const newX = player.x + dx * moveSpeed; const newY = player.y + dy * moveSpeed; const tx = Math.floor(newX), ty = Math.floor(newY); if(map[ty] && map[ty][tx] && map[ty][tx].t !== 'wall' && map[ty][tx].t !== 'water'){ setPlayer(p=>({...p, x:newX, y:newY})); }

setEntities(list=> list.map(ent=>{ if(ent.type==='enemy'){ const dist = Math.hypot(ent.x - player.x, ent.y - player.y); if(dist<6){ const ang = Math.atan2(player.y - ent.y, player.x - ent.x); ent.x += Math.cos(ang) * dt * 1.6; ent.y += Math.sin(ang) * dt * 1.6; ent.state = 'chase'; } else { if(Math.random()<0.01){ ent.vx = Math.floor(Math.random()*3)-1; ent.vy = Math.floor(Math.random()*3)-1; } ent.x += ent.vx * dt * 0.6; ent.y += ent.vy * dt * 0.6; ent.state='idle'; } const d2 = Math.hypot(ent.x - player.x, ent.y - player.y); if(d2 < 0.9 && ent.cooldown <= 0){ setPlayer(p=>({...p, hp: Math.max(0, p.hp - ent.atk)})); ent.cooldown = 1.2; setCombatLog(c=>[`${ent.id} hit you for ${ent.atk}`].concat(c).slice(0,8)); } ent.cooldown = Math.max(0, (ent.cooldown||0) - dt); return {...ent}; } return ent; }));

if((keys[' ']||keys['space']) && attackCooldown <= 0){ const hitRange = 1.2; let hit=null; for(const e of entities){ if(e.type==='enemy'){ const d=Math.hypot(e.x - player.x, e.y - player.y); if(d<=hitRange){ hit=e; break; } } } if(hit){ setEntities(list=> list.map(x=> x.id===hit.id ? {...x, hp: Math.max(0, x.hp - player.attack)} : x)); setCombatLog(c=>[`You hit ${hit.id} for ${player.attack}`].concat(c).slice(0,8)); setAttackCooldown(0.6); } }

if(keys['e']){ for(const n of entities){ if(n.type==='npc'){ const d=Math.hypot(n.x - player.x, n.y - player.y); if(d<1.5){ setDialog({ who: n.name, lines: n.dialog, index: 0 }); setMessages(m=>[`Talking to ${n.name}`].concat(m).slice(0,6)); } } } }

if(keys['i']) setShowInventory(s=>!s);
if(keys['enter'] && showInventory){ const item = player.inventory[selectedItemIndex]; if(item){ if(item.id==='potion'){ setPlayer(p=>({...p, hp: clamp(p.hp + item.heal, 0, p.maxHp), inventory: p.inventory.map((it,idx)=> idx===selectedItemIndex ? {...it, qty: it.qty-1} : it).filter(it=>it.qty>0) })); setMessages(m=>[`Used ${item.name}`].concat(m).slice(0,6)); } } }

setEntities(list=> list.filter(e=> !(e.type==='enemy' && e.hp <= 0)));

if(player.hp <= 0){ setMessages(m=>['You have fallen... Press R to respawn'].concat(m).slice(0,6)); if(keys['r']){ setPlayer({...defaultPlayer, x:8, y:8}); setEntities(()=>{ const list=[]; for(let i=0;i<8;i++) list.push({ id:`e${i}`, type:'enemy', x:randInt(10,50), y:randInt(10,30), hp:8, maxHp:8, atk:2, vx:0, vy:0, cooldown:0 }); list.push({ id:'npc1', type:'npc', x:22, y:12, name:'Old Man', dialog:['Welcome, traveler!','Bring me 3 gold and I\\'ll teach you a trick.']}); return list; }); } }

if(dialog && keys['space']){ const nextIndex = dialog.index + 1; if(nextIndex >= dialog.lines.length) setDialog(null); else setDialog(d=>({...d, index: nextIndex})); }
}

function render(ctx){ ctx.fillStyle = '#071024'; ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT); const camX = clamp(Math.floor(player.x - VIEWPORT_TILES_X/2), 0, map[0].length - VIEWPORT_TILES_X); const camY = clamp(Math.floor(player.y - VIEWPORT_TILES_Y/2), 0, map.length - VIEWPORT_TILES_Y);

for(let yy=0; yy<VIEWPORT_TILES_Y; yy++){ for(let xx=0; xx<VIEWPORT_TILES_X; xx++){ const tile = map[camY+yy][camX+xx].t; const px = xx * TILE_SIZE * SCALE; const py = yy * TILE_SIZE * SCALE; if(tile==='grass') drawImageScaled(ctx, grassImg, px, py, TILE_SIZE*SCALE); else if(tile==='water') drawImageScaled(ctx, waterImg, px, py, TILE_SIZE*SCALE); else if(tile==='sand') drawImageScaled(ctx, sandImg, px, py, TILE_SIZE*SCALE); else if(tile==='wall') drawImageScaled(ctx, wallImg, px, py, TILE_SIZE*SCALE); } }

const allEntities = entities.concat([{ id:'player', type:'player', x:player.x, y:player.y, hp:player.hp }]); for(const ent of allEntities){ const sx = Math.round((ent.x - camX) * TILE_SIZE * SCALE); const sy = Math.round((ent.y - camY) * TILE_SIZE * SCALE); if(ent.type==='player') drawImageScaled(ctx, playerImg, sx, sy, TILE_SIZE*SCALE); else if(ent.type==='enemy'){ drawImageScaled(ctx, enemyImg, sx, sy, TILE_SIZE*SCALE); ctx.fillStyle='black'; ctx.fillRect(sx, sy-6, TILE_SIZE*SCALE, 4); ctx.fillStyle='#D9534F'; ctx.fillRect(sx, sy-6, TILE_SIZE*SCALE * clamp(ent.hp/ent.maxHp,0,1), 4); } else if(ent.type==='npc') drawImageScaled(ctx, npcImg, sx, sy, TILE_SIZE*SCALE); }

drawUi(ctx);
}

function drawUi(ctx){ ctx.fillStyle='#071024'; ctx.fillRect(0,0,0,0); drawUiPanel(ctx,8,CANVAS_HEIGHT-48,220,40); drawText(ctx,'Dawn of Sorcerer',18,CANVAS_HEIGHT-40); drawText(ctx,`HP: ${player.hp}/${player.maxHp}  Gold: ${player.gold}`,18,CANVAS_HEIGHT-20); drawText(ctx,'I=Inventory • E=Interact • Space=Attack',260,CANVAS_HEIGHT-20);
let y=8; for(const c of combatLog.slice(0,6)){ drawSmallText(ctx,c,CANVAS_WIDTH-260,y); y+=12; } let my=8; for(const m of messages.slice(0,6)){ drawText(ctx,m,8,my); my+=16; } if(showInventory){ drawUiPanel(ctx,CANVAS_WIDTH-220,CANVAS_HEIGHT-160,208,140); drawText(ctx,'Inventory',CANVAS_WIDTH-200,CANVAS_HEIGHT-148); player.inventory.forEach((it,idx)=> drawText(ctx,`${idx===selectedItemIndex?'>':' '} ${it.name} x${it.qty}`,CANVAS_WIDTH-200,CANVAS_HEIGHT-128 + idx*18)); } if(dialog){ drawUiPanel(ctx,20,CANVAS_HEIGHT-120,CANVAS_WIDTH-40,96); drawText(ctx,`${dialog.who}: ${dialog.lines[dialog.index]}`,36,CANVAS_HEIGHT-92); drawText(ctx,'(Space to continue)',CANVAS_WIDTH-180,CANVAS_HEIGHT-36); } }

function drawImageScaled(ctx,img,x,y,size){ ctx.imageSmoothingEnabled=false; ctx.drawImage(img,x,y,size,size); }
function drawUiPanel(ctx,x,y,w,h){ ctx.fillStyle='rgba(5,8,12,0.9)'; ctx.fillRect(x,y,w,h); ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.strokeRect(x+0.5,y+0.5,w-1,h-1); }
function drawText(ctx,text,x,y){ ctx.font=`${12*3}px monospace`; ctx.fillStyle='#E6F0FF'; ctx.fillText(text,x,y); }
function drawSmallText(ctx,text,x,y){ ctx.font=`${10*3}px monospace`; ctx.fillStyle='#E6F0FF'; ctx.fillText(text,x,y); }

}, [canvasRef, keys, player, entities, showInventory, dialog, combatLog, messages, attackCooldown]);

function saveGame(){ const save={player,entities}; localStorage.setItem('dawn_save_v1', JSON.stringify(save)); setMessages(m=>['Game saved'].concat(m).slice(0,6)); }
function loadGame(){ const s=localStorage.getItem('dawn_save_v1'); if(s){ const data=JSON.parse(s); if(data.player) setPlayer(data.player); if(data.entities) setEntities(data.entities); setMessages(m=>['Loaded save'].concat(m).slice(0,6)); } else setMessages(m=>['No save found'].concat(m).slice(0,6)); }
function exportSave(){ const save={player,entities}; const blob=new Blob([JSON.stringify(save)], { type:'application/json' }); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='dawn_of_sorcerer_save.json'; a.click(); URL.revokeObjectURL(url); }

return (<div className="w-full max-w-5xl flex flex-col items-center gap-3"><h2 className="text-2xl">Dawn of Sorcerer</h2><div className="flex gap-4"><canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, imageRendering: 'pixelated', borderRadius: 8 }} /><div className="flex flex-col gap-2"><button className="px-3 py-2 rounded bg-slate-800 text-white" onClick={saveGame}>Save</button><button className="px-3 py-2 rounded bg-slate-800 text-white" onClick={loadGame}>Load</button><button className="px-3 py-2 rounded bg-slate-800 text-white" onClick={exportSave}>Export Save</button><div className="p-2 bg-slate-900 text-white rounded">HP: {player.hp}/{player.maxHp}</div><div className="p-2 bg-slate-900 text-white rounded">Gold: {player.gold}</div><div className="p-2 bg-slate-900 text-white rounded text-xs">Controls: WASD / Arrows — Move • Space — Attack • E — Interact • I — Inventory • Enter — Use selected</div></div></div><div className="text-xs text-slate-400 mt-2">Tip: Run <code>npm install</code> then <code>npm run dev</code> inside the project folder.</div></div>);
}
