import { MapDataConfig } from '@/models/MapInterfaces';

const groundHeight = 40;

export const mapData: MapDataConfig = {
  name: 'default 1',
  groundHeight: groundHeight,
  platforms: [
    { x: 1118, y: 440, width: 200, height: groundHeight, color: 0x228B22 },
    { x: 400, y: 440, width: 100, height: groundHeight, color: 0x228B22 },
    { x: 854, y: 440, width: 250, height: groundHeight, color: 0x228B22 },
  ],
  height: 500,
  width: 1200,
  ballSpawn: { x: 100, y: 400 },
  goal: {
    walls: {
      width: 5,
      height: 40,
    },
    base: {
      width: 40,
    },
    position: {
      x: 1000,
      y: 440
    }
  }
};