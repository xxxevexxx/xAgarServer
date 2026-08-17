import MainSocket from "@/MainSocket"
import GameServer from "@/GameServer"
import Experiment from "@gameset/Experiment"
import Tournament from "@gameset/Tournament"
import type GameMode from "@gameset/GameMode"
import { type Config, loadConfig } from "@/config"


export default class Controller {

  private _socket!: MainSocket
  private _server!: GameServer

  public _config: Config

  public tickRt: number
  public tickMcu: number
  public tickMs: number

  public _gameMode!: GameMode

  constructor(config: Config) {
    this._config = config

    this.tickRt = config.tickRt
    this.tickMcu = config.tickMcu
    this.tickMs = 1000 / this.tickRt
  }

  startMainSocket() {
    this._socket = new MainSocket(this)
    this._socket.startLoop()
  }

  startGameServer() {
    this._server = new GameServer(this)
    this._gameMode = this.createGameMode(this._server)
    this._server.setGameMode(this._gameMode)
    this._gameMode.onRun()
    this._server.startLoop()
  }

  init() {
    this.startGameServer()
  }

  private createGameMode(server: GameServer): GameMode {
    const mode = this._config.gamemode.toLowerCase()

    if (mode === "experiment") {
      return new Experiment(server)
    }

    if (mode === "tournament") {
      return new Tournament(server)
    }

    throw new Error(`Unknown gamemode: ${this._config.gamemode}`)
  }
}


new Controller(loadConfig()).init()
