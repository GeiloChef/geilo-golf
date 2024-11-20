import { MapDataConfig } from '@/models/MapInterfaces';

const groundHeight = 40;

export const mapData: MapDataConfig = {
  name: 'default 7',
  groundHeight: groundHeight,
  platforms: [
    { x: 600, y: 305, width: groundHeight, height: 450, color: 0x228B22 },
    { x: 300, y: 420, width: groundHeight, height: 100, color: 0x228B22 },
    { x: 440, y: 100, width: 350, height: groundHeight, color: 0x228B22 },
    { x: 150, y: 250, width: 500, height: groundHeight, color: 0x228B22 },
    { x: 900, y: 360, width: groundHeight, height: 200, color: 0x228B22 },
    { x: 900, y: 140, width: groundHeight, height: 100, color: 0x228B22 },
    { x: 1060, y: 110, width: 350, height: groundHeight, color: 0x228B22 },
    { x: 960, y: 300, width: 150, height: groundHeight, color: 0x228B22 },
    { x: 1180, y: 300, width: 150, height: groundHeight, color: 0x228B22 },
    { x: 920, y: 440, width: 25, height: groundHeight, color: 0x228B22 },
    { x: 995, y: 440, width: 50, height: groundHeight, color: 0x228B22 },
  ],
  width: 1200,
  height: 500,
  ballSpawn: {
    x: 100,
    y: 400
  },
  goal: {
    walls: {
      width: 5,
      height: 40,
    },
    base: {
      width: 40,
    },
    position: {
      x: 950,
      y: 440
    }
  }
};