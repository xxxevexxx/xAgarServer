import Player from "@players/Player";
import NodeFood from "@entitie/NodeFood"
import NodeVirus from "@entitie/NodeVirus"
import NodeParent from "@entitie/NodeParent"
import NodePlayer from "@entitie/NodePlayer"
import NodeSource from "@entitie/NodeSource"
import { WebSocketServer, WebSocket } from "ws"


class GameServer {

  private _server!: WebSocketServer

  private _uptime: number
  private _running: boolean

  private _players: Player[]
  private _gameMode: any

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

  constructor() {

    this._uptime = 0
    this._running = false

    this._players = [];
    this._gameMode = null

    this._lastNodeId = 1;
    this._lastPlayerId = 1;

  }

  listen() {
    this._server = new WebSocketServer({
      port: 8080
    });

    this._server.on("listening", () => {
      this.onServerRun();
    });

    this._server.on("connection", (socket, request) => {

    });

    this._server.on("close", () => {
      this.onServerEnd();
    });

    this._server.on("error", (error: Error) => {
      this.onServerError(error)
    });
  }

  onServerRun() {
    this._running = true
    console.log(`Server startup`)
  }

  onServerEnd() {
    this._running = false
    console.log(`Server shutdown`)
  }

  onServerError(error: Error) {
    console.error(error)
  }

  onPlayerJoin(player: Player) { }

  onPlayerLeft(player: Player) { }

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

  update() {

  }
}
