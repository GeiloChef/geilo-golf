export interface PlatformData {
  x: number,
  y: number,
  width: number,
  height: number,
  color: number
}

export interface BallCoordinates {
  x: number,
  y: number,
}

export interface GoalConfig {
  walls: {
    width: number,
    height: number,
  },
  base: {
    width: number,
  },
  position: {
    x: number,
    y: number
  }
}

export interface MapDataConfig {
  name: string,
  height: number,
  width: number,
  groundHeight: number,
  ballSpawn: BallCoordinates,
  platforms: PlatformData[],
  goal: GoalConfig
}