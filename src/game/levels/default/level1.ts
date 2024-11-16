import { MapDataConfig } from '@/models/MapInterfaces';

const groundHeight = 40;

export const mapData: MapDataConfig = {
  name: 'default 1',
  groundHeight: groundHeight,
  platforms: [
    { x: 200, y: 500, width: 150, height: groundHeight, color: 0x228B22 },
    { x: 400, y: 750, width: 155, height: groundHeight, color: 0x228B22 },
  ],
  height: 1200,
  width: 800,
  ballSpawn: { x: 200, y: 1000 },
  goal: {
    walls: {
      width: 5,
      height: 40,
    },
    base: {
      width: 40,
    },
    position: {
      x: 200,
      y: 1100
    }
  }
};