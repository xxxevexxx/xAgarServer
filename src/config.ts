import { readFileSync } from "node:fs"


type BorderConfig = {
  Left: number
  Right: number
  Top: number
  Bottom: number
}

type FoodConfig = {
  spawnInterval: number
  spawnAmount: number
  startAmount: number
  minAmount: number
  maxAmount: number
  minMass: number
  maxMass: number
}

type EjectConfig = {
  speed: number
  massLoss: number
  defaultMass: number
  spawnPlayer: number
}

type VirusConfig = {
  spawnInterval: number
  spawnAmount: number
  startAmount: number
  minAmount: number
  maxAmount: number
  minMass: number
  maxMass: number
  feedAmount: number
}

type SourceConfig = {
  spawnInterval: number
  spawnAmount: number
  startAmount: number
  minAmount: number
  maxAmount: number
  minMass: number
  maxMass: number
}

type PlayerConfig = {
  minMass: number
  maxMass: number
  startMass: number
  playerMaxCells: number

  playerMinMassEject: number
  playerMinMassSplit: number
  playerSplitStartDistance: number

  playerRecombineSplitTime: number
  playerRecombineVirusTime: number
  playerRecombineRefreshAll: number

  playerIgnorCollisionSplitTime: number
  playerIgnorCollisionVirusTime: number
  playerIgnorCollisionRefreshAll: number

  playerSplitBoost: number
  playerSplitTicks: number
  playerSplitDecay: number

  playerMassDecayRate: number
}

type WorldConfig = {
  border: BorderConfig
  food: FoodConfig
  eject: EjectConfig
  virus: VirusConfig
  source: SourceConfig
  player: PlayerConfig
}

export interface Config {
  tickRt: number
  tickMcu: number
  port: number
  viewBase: number
  gamemode: string
  maxConnections: number
  world: WorldConfig
}


export const loadConfig = (): Config => {
  const configUrl = new URL("./config.json", import.meta.url)
  const configRaw = readFileSync(configUrl, "utf-8").trim()

  if (!configRaw) {
    throw new Error("config.json is empty")
  }

  const config = JSON.parse(configRaw) as Partial<Config>

  if (typeof config.tickRt !== "number") {
    throw new Error("config.json: tickRt must be a number")
  }

  if (typeof config.tickMcu !== "number") {
    throw new Error("config.json: tickMcu must be a number")
  }

  return config as Config
}
