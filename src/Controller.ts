import MainSocket from "@/MainSocket"
import GameServer from "@/GameServer"
import Experiment from "@gameset/Experiment"
import type GameMode from "@gameset/GameMode"
import { readFileSync } from "node:fs"

type Config = {
  tickRt: number
  tickMcu: number
}

// Точка входа, подключается к главному серверу деррижору и запускает сервер
export default class Controller {

  private _socket!: MainSocket
  private _server!: GameServer

  public _gameMode!: GameMode

  public tickRt: number
  public tickMs: number
  public tickMcu: number

  constructor(config: Config) {
    this._gameMode = new Experiment(this._server)

    this.tickMcu = config.tickMcu
    this.tickRt = config.tickRt
    this.tickMs = 1000 / this.tickRt
  }

  startMainSocket() {
    this._socket = new MainSocket(this)
    this._socket.startLoop()
  }

  startGameServer() {
    this._server = new GameServer(this)
    this._server.startLoop()
  }

  init() {
    this.startMainSocket()
    this.startGameServer()
  }
}


const loadConfig = (): Config => {
  const configUrl = new URL("../config.json", import.meta.url)
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


new Controller(loadConfig()).init()
