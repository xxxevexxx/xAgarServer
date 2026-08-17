import type { RawData, WebSocket } from "ws";
import type GameServer from "@/GameServer"
import type NodeParent from "@entitie/NodeParent";
import IncomingPackets from "@network/IncomingPackets";


export default class Player {

  private readonly _core: GameServer;

  private _alive: boolean
  private _socket: WebSocket

  private _nowScore: number
  private _maxScore: number

  private _playerId: number
  private _playerImg: number
  private _playerName: string
  private _playerColor: string
  private _metaVersion: number
  private _snapshotPending: boolean

  private _ownerNodes: Set<NodeParent> = new Set()
  private _knownNodes: Set<NodeParent> = new Set()
  private _knownMetaVersion: Map<number, number> = new Map()
  private _visibleNodes: Set<NodeParent> = new Set()

  private _mouseTarget: { x: number, y: number }

  private _viewBox: {
    topY: number, bottomY: number,
    leftX: number, rightX: number,
    width: number, height: number
  }

  constructor(core: GameServer, socket: WebSocket) {
    this._core = core

    this._alive = false
    this._socket = socket

    this._nowScore = 0
    this._maxScore = 0

    this._playerId = core.getNextPlayerId()
    this._playerImg = 0
    this._playerName = ""
    this._playerColor = ""
    this._metaVersion = 0
    this._snapshotPending = true

    this._ownerNodes = new Set()
    this._knownNodes = new Set()
    this._knownMetaVersion = new Map()
    this._visibleNodes = new Set()

    this._mouseTarget = { x: 0, y: 0 }

    this._viewBox = {
      topY: 0, bottomY: 0,
      leftX: 0, rightX: 0,
      width: 0, height: 0
    }

    this._core.onPlayerJoin(this)

    this._socket.on("message", (data: RawData) => {
      this.message(data)
    })

    this._socket.on("close", () => {
      this._core.onPlayerLeft(this)
    })
  }
  get alive() {
    return this._alive
  }

  set alive(value: boolean) {
    this._alive = value
  }

  get socket() {
    return this._socket
  }

  set socket(value: any) {
    this._socket = value
  }

  get nowScore() {
    return this._nowScore
  }

  set nowScore(value: number) {
    this._nowScore = value
  }

  get maxScore() {
    return this._maxScore
  }

  set maxScore(value: number) {
    this._maxScore = value
  }

  get playerId() {
    return this._playerId
  }

  set playerId(value: number) {
    this._playerId = value
  }

  get playerImg() {
    return this._playerImg
  }

  set playerImg(value: number) {
    this._playerImg = value
    this._metaVersion++
  }

  get playerName() {
    return this._playerName
  }

  set playerName(value: string) {
    this._playerName = value
    this._metaVersion++
  }

  get playerColor() {
    return this._playerColor
  }

  set playerColor(value: string) {
    this._playerColor = value
    this._metaVersion++
  }

  get metaVersion() {
    return this._metaVersion
  }

  get ownerNodes() {
    return this._ownerNodes
  }

  set ownerNodes(value: Set<NodeParent>) {
    this._ownerNodes = value
  }

  get knownNodes() {
    return this._knownNodes
  }

  set knownNodes(value: Set<NodeParent>) {
    this._knownNodes = value
  }

  get visibleNodes() {
    return this._visibleNodes
  }

  set visibleNodes(value: Set<NodeParent>) {
    this._visibleNodes = value
  }

  get mouseTarget() {
    return this._mouseTarget
  }

  set mouseTarget(value: { x: number, y: number }) {
    this._mouseTarget = value
  }

  get viewBox() {
    return this._viewBox
  }

  set viewBox(value: {
    topY: number, bottomY: number,
    leftX: number, rightX: number,
    width: number, height: number
  }) {
    this._viewBox = value
  }

  message(data: RawData) {
    const packet = IncomingPackets.parse(data)

    if (packet.type === "spawn") {
      this._core.getGameMode().spawnCommand(this)
      return
    }

    if (packet.type === "respawn") {
      this._core.getGameMode().respawnCommand(this)
      return
    }

    if (packet.type === "mouse") {
      this._mouseTarget = packet.coords
      return
    }

    if (packet.type === "split") {
      if (packet.coords) {
        this._mouseTarget = packet.coords
      }
      this._core.getGameMode().splitCommand(this)
      return
    }

    if (packet.type === "eject") {
      if (packet.coords) {
        this._mouseTarget = packet.coords
      }
      this._core.getGameMode().ejectCommand(this)
    }
  }

  refreshVisibleNodes() {
    this.updateViewBox()

    const nextVisibleNodes = new Set<NodeParent>()
    for (const node of this._core.getSpatializ().queryBounds(this._viewBox)) {
      nextVisibleNodes.add(node)
    }

    this._visibleNodes = nextVisibleNodes
  }

  collectDeleteNodes() {
    const deleteNodes = new Set<NodeParent>()

    for (const node of this._knownNodes) {
      if (this._core.getDeletedNodes().has(node) || !this._visibleNodes.has(node)) {
        deleteNodes.add(node)
      }
    }

    return deleteNodes
  }

  collectCreatedNodes() {
    const createdUnknownNodes = new Set<NodeParent>()

    for (const node of this._visibleNodes) {
      if (this._knownNodes.has(node)) continue
      createdUnknownNodes.add(node)
    }

    return createdUnknownNodes
  }

  collectUpdateNodes(createdNodes: ReadonlySet<NodeParent>) {
    const updateNodes = new Set<NodeParent>()

    for (const node of this._knownNodes) {
      if (!this._visibleNodes.has(node)) continue
      if (createdNodes.has(node)) continue
      if (!node.dirtyUpdate) continue
      updateNodes.add(node)
    }

    return updateNodes
  }

  collectMetaNodes() {
    const metaNodes = new Set<NodeParent>()
    const handledOwners = new Set<number>()

    for (const node of this._knownNodes) {
      if (!this._visibleNodes.has(node)) continue

      const owner = node.player
      if (!owner) continue
      const ownerId = owner.playerId
      if (handledOwners.has(ownerId)) continue

      const knownMetaVersion = this._knownMetaVersion.get(ownerId)
      if (knownMetaVersion === owner.metaVersion) continue

      handledOwners.add(ownerId)
      metaNodes.add(node)
    }

    return metaNodes
  }

  commitCreatedNodes(nodes: Iterable<NodeParent>) {
    for (const node of nodes) {
      this._knownNodes.add(node)
    }
  }

  commitDeletedNodes(nodes: Iterable<NodeParent>) {
    for (const node of nodes) {
      this._knownNodes.delete(node)
      this._visibleNodes.delete(node)
    }
  }

  commitMetaNodes(nodes: Iterable<NodeParent>) {
    for (const node of nodes) {
      if (!node.player) continue
      this._knownMetaVersion.set(node.player.playerId, node.player.metaVersion)
    }
  }

  update() {
    if (this._socket.readyState !== 1) return
    this.refreshVisibleNodes()

    if (this._snapshotPending) {
      this._socket.send(this._core.getSerialize().clearSnapshot())
      this._socket.send(this._core.getSerialize().worldSnapshot(this._visibleNodes))
      this.commitCreatedNodes(this._visibleNodes)
      this.commitMetaNodes(this._visibleNodes)
      this._snapshotPending = false
      return
    }

    const createdNodes = this.collectCreatedNodes()
    if (createdNodes.size) {
      this._socket.send(this._core.getSerialize().createNodes(createdNodes))
      this.commitCreatedNodes(createdNodes)
    }

    const updateNodes = this.collectUpdateNodes(createdNodes)
    if (updateNodes.size) {
      this._socket.send(this._core.getSerialize().updateNodes(updateNodes))
    }

    const metaNodes = this.collectMetaNodes()
    if (metaNodes.size) {
      this._socket.send(this._core.getSerialize().metaNodes(metaNodes))
      this.commitMetaNodes(metaNodes)
    }

    const deleteNodes = this.collectDeleteNodes()
    if (deleteNodes.size) {
      this._socket.send(this._core.getSerialize().deleteNodes(deleteNodes))
      this.commitDeletedNodes(deleteNodes)
    }

  }

  private updateViewBox() {
    const baseSize = Math.max(0, this._core.getConfig().viewBase | 0)
    let centerX = this._mouseTarget.x
    let centerY = this._mouseTarget.y

    if (this._ownerNodes.size) {
      let sumX = 0
      let sumY = 0
      let totalRadius = 0

      for (const node of this._ownerNodes) {
        sumX += node.coords.x
        sumY += node.coords.y
        totalRadius += node.radius
      }

      centerX = (sumX / this._ownerNodes.size) | 0
      centerY = (sumY / this._ownerNodes.size) | 0

      const dynamicSize = baseSize + totalRadius
      this._viewBox = {
        topY: centerY - dynamicSize,
        bottomY: centerY + dynamicSize,
        leftX: centerX - dynamicSize,
        rightX: centerX + dynamicSize,
        width: dynamicSize,
        height: dynamicSize,
      }
      return
    }

    this._viewBox = {
      topY: centerY - baseSize,
      bottomY: centerY + baseSize,
      leftX: centerX - baseSize,
      rightX: centerX + baseSize,
      width: baseSize,
      height: baseSize,
    }
  }

  private nodeInView(node: NodeParent) {
    const radius = node.radius

    if (node.coords.x + radius < this._viewBox.leftX) return false
    if (node.coords.x - radius > this._viewBox.rightX) return false
    if (node.coords.y + radius < this._viewBox.topY) return false
    if (node.coords.y - radius > this._viewBox.bottomY) return false

    return true
  }

}
