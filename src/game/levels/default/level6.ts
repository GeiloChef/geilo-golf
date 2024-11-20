import { MapDataConfig } from '@/models/MapInterfaces';

const groundHeight = 40;

export const mapData: MapDataConfig = {
  name: 'default 6',
  groundHeight: groundHeight,
  platforms: [
    { x: 100, y: 100, width: 100, height: groundHeight, color: 0x228B22 },
    { x: 215, y: 100, width: 50, height: groundHeight, color: 0x228B22 },
    { x: 530, y: 250, width: 1000, height: groundHeight, color: 0x228B22 },
    { x: 980, y: 70, width: groundHeight, height: 200, color: 0x228B22 },
    { x: 350, y: 450, width: groundHeight, height: 200, color: 0x228B22 },
    { x: 600, y: 500, width: groundHeight, height: 200, color: 0x228B22 },
    { x: 850, y: 420, width: groundHeight, height: 200, color: 0x228B22 },
    { x: 750, y: 155, width: groundHeight, height: 150, color: 0x228B22 },
    { x: 450, y: 200, width: groundHeight, height: 100, color: 0x228B22 },
    { x: 50, y: 155, width: groundHeight, height: 150, color: 0x228B22 },
    { x: 250, y: 155, width: groundHeight, height: 150, color: 0x228B22 },
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
      x: 170,
      y: 100
    }
  }
};