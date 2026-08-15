import { WebSocket } from "ws"
import type GameServer from "@/GameServer"

// Точка входа, подключается к главному серверу деррижору и запускает сервер
class Controller {

  private _socket!: WebSocket
  private _server!: GameServer


  constructor() {

  }

  startMainSocket() {

  }

  startGameServer() {

  }

  init() {

  }
}


new Controller().init()
