
import type { WebSocket } from "ws"
import GameServer from "@/GameServer"
import type { IncomingMessage } from "node:http"


export default class Guardings {

  private readonly _core: GameServer;

  constructor(core: GameServer) {
    this._core = core;
  }

  check(socket: WebSocket, request: IncomingMessage) {
    console.log(`Request connection: ${request.socket.remoteAddress}`)

    const proxyResult = this.checkProxy(socket, request)
    const bannedResult = this.checkBanned(socket, request)
    const accountResult = this.checkAccount(socket, request)

    if (proxyResult && bannedResult && accountResult) {
      console.log(`Success connection: ${request.socket.remoteAddress}`)
      return true
    } else {
      console.log(`Reject connection: ${request.socket.remoteAddress}`)
      return false
    }
  }

  checkProxy(socket: WebSocket, request: IncomingMessage) {
    // Checked client use proxy
    return true
  }

  checkBanned(socket: WebSocket, request: IncomingMessage) {
    // Checked client banned ip
    return true
  }

  checkAccount(socket: WebSocket, request: IncomingMessage) {
    // Checked client account auth
    return true
  }
}
