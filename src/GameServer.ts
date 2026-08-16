import Player from "@/entitie/anyEntitie/Player"
import NodeFood from "@entitie/NodeFood"
import NodeVirus from "@entitie/NodeVirus"
import NodeParent from "@entitie/NodeParent"
import NodePlayer from "@entitie/NodePlayer"
import NodeSource from "@entitie/NodeSource"

import Commandes from "@systems/Commandes"
import Databases from "@systems/Databases"
import Guardings from "@systems/Guardings"
import Movements from "@systems/Movements"

import type Controller from "@/Controller"
import type GameMode from "@gameset/GameMode"
import { performance } from "node:perf_hooks"
import { WebSocketServer, WebSocket } from "ws"
import type { IncomingMessage } from "node:http"


export default class GameServer {

  private _controller: Controller

  private _server!: WebSocketServer

  private _uptime: number
  private _running: boolean
  private _loopTimer: NodeJS.Timeout | null = null
  private _accumulator = 0
  private _lastTime = 0
  private _tickId = 0

  private _players: Set<Player> = new Set()
  private _gameMode: GameMode

  private _lastNodeId: number
  private _lastPlayerId: number

  private staticNodes: Set<NodeParent> = new Set()
  private staticNodesFood: Set<NodeFood> = new Set()
  private staticNodesVirus: Set<NodeVirus> = new Set()
  private staticNodesSource: Set<NodeSource> = new Set()
  private staticNodesPlayer: Set<NodePlayer> = new Set()

  private movingNodes: Set<NodeParent> = new Set()
  private movingNodesFood: Set<NodeFood> = new Set()
  private movingNodesVirus: Set<NodeVirus> = new Set()
  private movingNodesSource: Set<NodeSource> = new Set()
  private movingNodesPlayer: Set<NodePlayer> = new Set()

  private _incomingEvents: Set<any>
  private _outgoingEvents: Set<any>

  private _commandes: Commandes
  private _databases: Databases
  private _guardings: Guardings
  private _movements: Movements

  constructor(controller: Controller) {
    this._controller = controller

    this._uptime = performance.now()
    this._running = false

    this._gameMode = this._controller._gameMode

    this._lastNodeId = 1;
    this._lastPlayerId = 1;

    this._incomingEvents = new Set()
    this._outgoingEvents = new Set()

    this._commandes = new Commandes(this)
    this._databases = new Databases(this)
    this._guardings = new Guardings(this)
    this._movements = new Movements(this)
  }

  listen() {
    this._server = new WebSocketServer({ port: 8080 });

    this._server.on("listening", () => {
      this.onServerRun();
    });

    this._server.on("connection", (socket: WebSocket, request: IncomingMessage) => {
      const guardStatus = this._guardings.check(socket, request)
      if (guardStatus) {
        new Player(this, socket)
      } else {
        socket.close()
      }
    });

    this._server.on("close", () => {
      this.onServerEnd();
    });

    this._server.on("error", (error: Error) => {
      this.onServerError(error)
    });
  }

  startLoop() {
    if (this._loopTimer) return
    this.listen()
    this._running = true
    this._accumulator = 0
    this._lastTime = performance.now()

    const frame = () => {
      if (!this._running) {
        this._loopTimer = null
        return
      }

      const now = performance.now()
      let delta = now - this._lastTime
      this._lastTime = now

      if (delta > 250) delta = 250

      this._accumulator += delta

      let ticks = 0
      while (this._accumulator >= this._controller.tickMs && ticks < this._controller.tickMcu) {
        this._accumulator -= this._controller.tickMs
        this.tick()
        ticks++
      }

      if (ticks === this._controller.tickMcu) {
        this._accumulator = 0
      }

      const delay = Math.max(0, this._controller.tickMs - this._accumulator)
      this._loopTimer = setTimeout(frame, delay)
    }

    this._loopTimer = setTimeout(frame, this._controller.tickMs)
  }

  stopLoop() {
    this._running = false

    if (this._loopTimer) {
      clearTimeout(this._loopTimer)
      this._loopTimer = null
    }
  }

  private tick() {
    this._tickId++;
  }

  private onServerRun() {
    console.log(`Server startup`)
  }

  private onServerEnd() {
    console.log(`Server shutdown`)
  }

  private onServerError(error: Error) {
    console.error(error)
  }

  addIncomingEvents(event: any) {
    this._incomingEvents.add(event)
  }

  addOutgoingEvents(event: any) {
    this._outgoingEvents.add(event)
  }

  onPlayerJoin(player: Player) {
    this._players.add(player)
  }

  onPlayerLeft(player: Player) {
    this._players.delete(player)
  }

  getNextNodeId() {
    if (this._lastNodeId > 2147483647) {
      this._lastNodeId = 1;
    }
    return this._lastNodeId++;
  };

  getNextPlayerId() {
    if (this._lastPlayerId > 2147483647) {
      this._lastPlayerId = 1;
    }
    return this._lastPlayerId++;
  };

  addNode(node: NodeParent) {
    !this.staticNodes.has(node) && this.staticNodes.add(node)
    if (node instanceof NodeFood && !this.staticNodesFood.has(node)) {
      this.staticNodesFood.add(node)
    }
    if (node instanceof NodeVirus && !this.staticNodesVirus.has(node)) {
      this.staticNodesVirus.add(node)
    }
    if (node instanceof NodePlayer && !this.staticNodesPlayer.has(node)) {
      this.staticNodesPlayer.add(node)
    }
    if (node instanceof NodeSource && !this.staticNodesSource.has(node)) {
      this.staticNodesSource.add(node)
    }
  }

  delNode(node: NodeParent) {
    this.staticNodes.has(node) && this.staticNodes.delete(node)
    if (node instanceof NodeFood && this.staticNodesFood.has(node)) {
      this.staticNodesFood.delete(node)
    }
    if (node instanceof NodeVirus && this.staticNodesVirus.has(node)) {
      this.staticNodesVirus.delete(node)
    }
    if (node instanceof NodePlayer && this.staticNodesPlayer.has(node)) {
      this.staticNodesPlayer.delete(node)
    }
    if (node instanceof NodeSource && this.staticNodesSource.has(node)) {
      this.staticNodesSource.delete(node)
    }
  }

  getRandomPosition(node: NodeParent) {

  }
}
