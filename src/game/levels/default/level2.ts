import { MapDataConfig } from '@/models/MapInterfaces';

const groundHeight = 40;

export const mapData: MapDataConfig = {
  name: 'default 2',
  groundHeight: groundHeight,
  platforms: [
    { x: 1000, y: 440, width: 200, height: groundHeight, color: 0x228B22 },
    { x: 1045, y: 400, width: 50, height: groundHeight, color: 0x228B22 },
    { x: 955, y: 400, width: 50, height: groundHeight, color: 0x228B22 },
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
      y: 400
    }
  }
};