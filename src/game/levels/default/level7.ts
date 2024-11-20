import { MapDataConfig } from '@/models/MapInterfaces';

const groundHeight = 40;

export const mapData: MapDataConfig = {
  name: 'default 7',
  groundHeight: groundHeight,
  platforms: [
    { x: 2140, y: 750, width: 75, height: groundHeight, color: 0x228B22 },
    { x: 2122, y: 695, width: groundHeight, height: 150, color: 0x228B22 },
    { x: 2320, y: 750, width: 200, height: groundHeight, color: 0x228B22 },
    { x: 2202, y: 600, width: 200, height: groundHeight, color: 0x228B22 },
    { x: 2202, y: 450, width: 500, height: groundHeight, color: 0x228B22 },
    { x: 1972, y: 640, width: groundHeight, height: 400, color: 0x228B22 },
    { x: 1800, y: 660, width: groundHeight, height: 600, color: 0x228B22 },
    { x: 1450, y: 380, width: 700, height: groundHeight, color: 0x228B22 },
    { x: 900, y: 500, width: groundHeight, height: 300, color: 0x228B22 },
    { x: 1180, y: 670, width: 600, height: groundHeight, color: 0x228B22 },
    { x: 400, y: 820, width: groundHeight, height: 300, color: 0x228B22 },

  ],
  width: 2400,
  height: 1000,
  ballSpawn: {
    x: 100,
    y: 900
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
      x: 2200,
      y: 750
    }
  }
};