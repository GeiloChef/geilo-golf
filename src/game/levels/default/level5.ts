import { MapDataConfig } from '@/models/MapInterfaces';

const groundHeight = 40;

export const mapData: MapDataConfig = {
  name: 'default 5',
  groundHeight: groundHeight,
  platforms: [
    { x: 0, y: 240, width: 900, height: groundHeight, color: 0x228B22 },
    { x: 90, y: 200, width: 100, height: groundHeight, color: 0x228B22 },
    { x: 430, y: 60, width: groundHeight, height: 200, color: 0x228B22 },
    { x: 430, y: 420, width: groundHeight, height: 200, color: 0x228B22 },
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
      x: 22,
      y: 200
    }
  }
};