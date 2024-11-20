import { MapDataConfig } from '@/models/MapInterfaces';

const groundHeight = 40;

export const mapData: MapDataConfig = {
  name: 'default 4',
  groundHeight: groundHeight,
  platforms: [
    { x: 550, y: 0, width: groundHeight, height: 1400, color: 0x228B22 },
    { x: 550, y: 900, width: groundHeight, height: 250, color: 0x228B22 },

    { x: 950, y: 0, width: groundHeight, height: 1200, color: 0x228B22 },
    { x: 950, y: 900, width: groundHeight, height: 400, color: 0x228B22 },

    { x: 1350, y: 0, width: groundHeight, height: 1300, color: 0x228B22 },
    { x: 1350, y: 900, width: groundHeight, height: 300, color: 0x228B22 },

    { x: 2345, y: 940, width: 150, height: groundHeight, color: 0x228B22 },
    { x: 2155, y: 940, width: 150, height: groundHeight, color: 0x228B22 },
  ],
  width: 2400,
  height: 1000,
  ballSpawn: { x: 100, y: 900 },
  goal: {
    walls: {
      width: 5,
      height: 40,
    },
    base: {
      width: 40,
    },
    position: {
      x: 2250,
      y: 940
    }
  }
};