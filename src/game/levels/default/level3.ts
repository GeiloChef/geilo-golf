import { MapDataConfig } from '@/models/MapInterfaces';

const groundHeight = 40;

export const mapData: MapDataConfig = {
  name: 'default 3',
  groundHeight: groundHeight,
  platforms: [
    { x: 1000, y: 390, width: 170, height: groundHeight, color: 0x228B22 },
    { x: 1072, y: 350, width: 100, height: groundHeight, color: 0x228B22 },
    { x: 932, y: 350, width: 100, height: groundHeight, color: 0x228B22 },
  ],
  width: 1200,
  height: 500,
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
      y: 350
    }
  }
};