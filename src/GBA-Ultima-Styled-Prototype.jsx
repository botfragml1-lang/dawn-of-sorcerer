import { useState, useEffect, useRef } from "react";
import { generateMap, defaultPlayer, randInt } from "./utils"; // adjust imports as needed

// Import assets
import enemyImg from "./assets/enemy.png";
import npcImg from "./assets/npc.png";
import playerImg from "./assets/player.png";
import tileGrass from "./assets/tile_grass.png";
import tileSand from "./assets/tile_sand.png";
import tileWall from "./assets/tile_wall.png";
import tileWater from "./assets/tile_water.png";

function useKeyboard() {
  const [keys, setKeys] = useState({});

  useEffect(() => {
    function down(e) {
      setKeys(k => ({ ...k, [e.key.toLowerCase()]: true }));
    }
    function up(e) {
      setKeys(k => ({ ...k, [e.key.toLowerCase()]: false }));
    }

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return keys;
}

export default function GBAUltimaPrototype() {
  const canvasRef = useRef(null);
  const keys = useKeyboard();

  const [map] = useState(() => generateMap(60, 40));

  const [player, setPlayer] = useState(() => {
    const s = localStorage.getItem("dawn_save_v1");
    return s ? JSON.parse(s).player : defaultPlayer;
  });

  const [entities, setEntities] = useState(() => {
    const list = [];

    // Add enemies
    for (let i = 0; i < 8; i++) {
      list.push({
        id: `e${i}`,
        type: "enemy",
        x: randInt(10, 50),
        y: randInt(10, 30),
        hp: 8,
        maxHp: 8,
        atk: 2,
        vx: 0,
        vy: 0,
        cooldown: 0,
        sprite: enemyImg,
      });
    }

    // Add NPCs
    list.push({
      id: "npc1",
      type: "npc",
      x: 22,
      y: 12,
      name: "Old Man",
      dialog: ["Welcome, traveler!", "Bring me 3 gold and I'll teach you a trick."],
      sprite: npcImg,
    });

    list.push({
      id: "npc2",
      type: "npc",
      x: 24,
      y: 14,
      name: "Merchant",
      dialog: ["Buy potions? Press I to open inventory."],
      sprite: npcImg,
    });

    return list;
  });

  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [showInventory, setShowInventory] = useState(false);
  const [messages, setMessages] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [combatLog, setCombatLog] = useState([]);
  const [attackCooldown, setAttackCooldown] = useState(0);

  // Example of tile images usage
  const tiles = {
    grass: tileGrass,
    sand: tileSand,
    wall: tileWall,
    water: tileWater,
  };

  useEffect(() => {
    const id = setInterval(() => setAttackCooldown(c => Math.max(0, c - 0.1)), 100);
    return () => clearInterval(id);
  }, []);

  // You can now use `tiles` and entity.sprite in your canvas drawing logic

  return <canvas ref={canvasRef} width={960} height={640}></canvas>;
}
