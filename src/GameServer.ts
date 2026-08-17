import Player from "@/entitie/anyEntitie/Player"
import NodeEject from "@entitie/NodeEject"
import NodeFood from "@entitie/NodeFood"
import NodeVirus from "@entitie/NodeVirus"
import NodeParent from "@entitie/NodeParent"
import NodePlayer from "@entitie/NodePlayer"
import NodeSource from "@entitie/NodeSource"

import Commandes from "@systems/Commandes"
import Databases from "@systems/Databases"
import Guardings from "@systems/Guardings"
import Movements from "@systems/Movements"
import Serialize from "@systems/Serialize"
import Spatializ from "@systems/Spatializ"

import type Controller from "@/Controller"
import type { Config } from "@/config"
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
  private _gameMode!: GameMode

  private _lastNodeId: number
  private _lastPlayerId: number

  private allNodes: Set<NodeParent> = new Set()
  private deletedNodes: Set<NodeParent> = new Set()

  private staticNodesFood: Set<NodeFood> = new Set()
  private staticNodesEject: Set<NodeEject> = new Set()
  private staticNodesVirus: Set<NodeVirus> = new Set()
  private staticNodesSource: Set<NodeSource> = new Set()
  private staticNodesPlayer: Set<NodePlayer> = new Set()

  private movingNodesFood: Set<NodeFood> = new Set()
  private movingNodesEject: Set<NodeEject> = new Set()
  private movingNodesVirus: Set<NodeVirus> = new Set()
  private movingNodesSource: Set<NodeSource> = new Set()
  private movingNodesPlayer: Set<NodePlayer> = new Set()

  private _incomingEvents: Set<any>
  private _outgoingEvents: Set<any>

  private _commandes: Commandes
  private _databases: Databases
  private _guardings: Guardings
  private _movements: Movements
  private _serialize: Serialize
  private _spatializ: Spatializ

  constructor(controller: Controller) {
    this._controller = controller

    this._uptime = performance.now()
    this._running = false

    this._lastNodeId = 1;
    this._lastPlayerId = 1;

    this._incomingEvents = new Set()
    this._outgoingEvents = new Set()

    this._commandes = new Commandes(this)
    this._databases = new Databases(this)
    this._guardings = new Guardings(this)
    this._movements = new Movements(this)
    this._serialize = new Serialize(this)
    this._spatializ = new Spatializ(this)
  }

  listen() {
    this._server = new WebSocketServer({ port: this._controller._config.port });

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
    this._gameMode.onTick()
    this._movements.tick()

    for (const player of this._players) {
      player.update()
    }

    this.clearDirtyNodes()
    this.clearDeletedNodes()
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
    this._gameMode.onPlayerJoin(player)
  }

  onPlayerLeft(player: Player) {
    this._players.delete(player)
    this._gameMode.onPlayerLeft(player)
  }

  setGameMode(gameMode: GameMode) {
    this._gameMode = gameMode
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

  spawnPlayer(player: Player, coords?: { x: number, y: number }) {
    for (const node of player.ownerNodes) {
      if (node instanceof NodePlayer) return null
    }

    const node = new NodePlayer(player, this.getNextNodeId(), player.playerId)
    node.mass = this._controller._config.world.player.startMass ?? this._controller._config.world.player.minMass
    node.coords = coords ?? this.getRandomPosition(node)

    player.mouseTarget = { ...node.coords }
    player.alive = true

    this.addNode(node)
    this._gameMode.onPlayerSpawn(player, node.coords)

    return node
  }

  getAllNodes() {
    return this.allNodes
  }

  getDeletedNodes() {
    return this.deletedNodes
  }

  getConfig(): Config {
    return this._controller._config
  }

  clearDeletedNodes() {
    this.deletedNodes.clear()
  }

  getSerialize() {
    return this._serialize
  }

  getGameMode() {
    return this._gameMode
  }

  getMovements() {
    return this._movements
  }

  getSpatializ() {
    return this._spatializ
  }

  getStaticNodesPlayer() {
    return this.staticNodesPlayer
  }

  getStaticNodesSource() {
    return this.staticNodesSource
  }

  getStaticNodesVirus() {
    return this.staticNodesVirus
  }

  getStaticNodesEject() {
    return this.staticNodesEject
  }

  getStaticNodesFood() {
    return this.staticNodesFood
  }

  getMovingNodesPlayer() {
    return this.movingNodesPlayer
  }

  getMovingNodesSource() {
    return this.movingNodesSource
  }

  getMovingNodesVirus() {
    return this.movingNodesVirus
  }

  getMovingNodesEject() {
    return this.movingNodesEject
  }

  getMovingNodesFood() {
    return this.movingNodesFood
  }

  addNode(node: NodeParent) {
    this.allNodes.add(node)
    if (node.player) {
      node.player.ownerNodes.add(node)
    }
    this.setNodeStatic(node)
    this._spatializ.addNode(node)
    this._gameMode.onNodeAdd(node)
  }

  delNode(node: NodeParent) {
    if (!this.allNodes.has(node)) return

    this.allNodes.delete(node)
    this._spatializ.removeNode(node)
    if (node.player) {
      node.player.ownerNodes.delete(node)
    }
    this.dropNodeStatic(node)
    this.dropNodeMoving(node)
    this.deletedNodes.add(node)
    this._gameMode.onNodeDel(node)
  }

  setNodeStatic(node: NodeParent) {
    this.dropNodeMoving(node)
    if (node instanceof NodePlayer) {
      this.staticNodesPlayer.add(node)
    } else if (node instanceof NodeFood) {
      this.staticNodesFood.add(node)
    } else if (node instanceof NodeVirus) {
      this.staticNodesVirus.add(node)
    } else if (node instanceof NodeEject) {
      this.staticNodesEject.add(node)
    } else if (node instanceof NodeSource) {
      this.staticNodesSource.add(node)
    }
  }

  setNodeMoving(node: NodeParent) {
    this.dropNodeStatic(node)
    if (node instanceof NodePlayer) {
      this.movingNodesPlayer.add(node)
    } else if (node instanceof NodeFood) {
      this.movingNodesFood.add(node)
    } else if (node instanceof NodeVirus) {
      this.movingNodesVirus.add(node)
    } else if (node instanceof NodeEject) {
      this.movingNodesEject.add(node)
    } else if (node instanceof NodeSource) {
      this.movingNodesSource.add(node)
    }
  }

  getRandomPosition(node: NodeParent) {
    const border = this._controller._config.world.border
    const radius = node.radius
    const minX = border.Left + radius
    const maxX = border.Right - radius
    const minY = border.Top + radius
    const maxY = border.Bottom - radius

    if (minX > maxX || minY > maxY) {
      return {
        x: ((border.Left + border.Right) / 2) | 0,
        y: ((border.Top + border.Bottom) / 2) | 0,
      }
    }

    const maxAttempts = 64
    let fallback = {
      x: this.randomInt(minX, maxX),
      y: this.randomInt(minY, maxY),
    }
    let fallbackDistance = -1

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidate = {
        x: this.randomInt(minX, maxX),
        y: this.randomInt(minY, maxY),
      }

      let blocked = false
      let nearestGap = Number.POSITIVE_INFINITY

      const bounds = {
        topY: candidate.y - radius,
        bottomY: candidate.y + radius,
        leftX: candidate.x - radius,
        rightX: candidate.x + radius,
      }

      for (const other of this._spatializ.queryBounds(bounds)) {
        if (other === node) continue

        const dx = candidate.x - other.coords.x
        const dy = candidate.y - other.coords.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const requiredDistance = radius + other.radius

        if (distance < requiredDistance) {
          blocked = true
          break
        }

        const gap = distance - requiredDistance
        if (gap < nearestGap) {
          nearestGap = gap
        }
      }

      if (!blocked) {
        return candidate
      }

      if (nearestGap > fallbackDistance) {
        fallback = candidate
        fallbackDistance = nearestGap
      }
    }

    return fallback
  }

  private dropNodeStatic(node: NodeParent) {
    if (node instanceof NodePlayer) {
      this.staticNodesPlayer.delete(node)
    } else if (node instanceof NodeFood) {
      this.staticNodesFood.delete(node)
    } else if (node instanceof NodeVirus) {
      this.staticNodesVirus.delete(node)
    } else if (node instanceof NodeSource) {
      this.staticNodesSource.delete(node)
    } else if (node instanceof NodeEject) {
      this.staticNodesEject.delete(node)
    }
  }

  private dropNodeMoving(node: NodeParent) {
    if (node instanceof NodePlayer) {
      this.movingNodesPlayer.delete(node)
    } else if (node instanceof NodeFood) {
      this.movingNodesFood.delete(node)
    } else if (node instanceof NodeVirus) {
      this.movingNodesVirus.delete(node)
    } else if (node instanceof NodeSource) {
      this.movingNodesSource.delete(node)
    } else if (node instanceof NodeEject) {
      this.movingNodesEject.delete(node)
    }
  }

  private randomInt(min: number, max: number) {
    if (min >= max) return min | 0
    return (Math.random() * (max - min) + min) | 0
  }

  private clearDirtyNodes() {
    for (const node of this.allNodes) {
      node.dirtyUpdate = false
    }
  }
}
