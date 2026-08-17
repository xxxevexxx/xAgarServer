import GameServer from "@/GameServer";
import type Player from "@/entitie/anyEntitie/Player"
import NodeEject from "@entitie/NodeEject"
import NodeParent from "@entitie/NodeParent"
import NodePlayer from "@entitie/NodePlayer"
import NodeVirus from "@entitie/NodeVirus"

type PlayerNodeState = {
  recombineTicks: number
  ignoreCollision: boolean
  restoreCollisionTicks: number
}

type VirusNodeState = {
  fed: number
}


export default class Movements {

  private readonly _core: GameServer;
  private readonly _playerState = new WeakMap<NodeParent, PlayerNodeState>()
  private readonly _virusState = new WeakMap<NodeParent, VirusNodeState>()

  constructor(core: GameServer) {
    this._core = core;
  }

  tick() {
    this.updatePlayerNodeState()
    this.updatePlayerNodes()
    this.updateMovingNodes()
  }

  splitPlayer(player: Player) {
    const config = this._core.getConfig().world
    const cells = Array.from(player.ownerNodes)

    for (const cell of cells) {
      if (!(cell instanceof NodePlayer)) continue
      if (player.ownerNodes.size >= config.player.playerMaxCells) continue
      if (cell.mass < config.player.playerMinMassSplit) continue

      const angle = this.getAngle(cell.coords, player.mouseTarget)
      if (!Number.isFinite(angle)) continue

      const distance = cell.radius * (Number(config.player.playerSplitStartDistance) || 1)
      const startCoords = this.clampCoords({
        x: cell.coords.x + distance * Math.sin(angle),
        y: cell.coords.y + distance * Math.cos(angle),
      })

      const splitBoost = Number(config.player.playerSplitBoost) || 1
      const splitSpeed = this.getPlayerSpeed(cell) * 6 * splitBoost
      const newMass = cell.mass / 2

      cell.mass = newMass
      this._core.getSpatializ().updateNode(cell)

      const split = new NodePlayer(player, this._core.getNextNodeId(), player.playerId)
      split.coords = startCoords
      split.mass = newMass
      split.color = cell.color
      split.angle = angle
      split.moveEngineSpeed = splitSpeed
      split.moveEngineTicks = Number(config.player.playerSplitTicks) || 32
      split.moveEngineDecay = Number(config.player.playerSplitDecay) || 0.85

      const splitState = this.ensurePlayerState(split)
      splitState.recombineTicks = this.toTicks(config.player.playerRecombineSplitTime)
      splitState.restoreCollisionTicks = this.toTicks(config.player.playerIgnorCollisionSplitTime)
      splitState.ignoreCollision = splitState.restoreCollisionTicks > 0

      if (Number(config.player.playerRecombineRefreshAll)) {
        for (const ownCell of player.ownerNodes) {
          if (!(ownCell instanceof NodePlayer)) continue
          this.ensurePlayerState(ownCell).recombineTicks = splitState.recombineTicks
        }
      }

      if (Number(config.player.playerIgnorCollisionRefreshAll) && splitState.restoreCollisionTicks > 0) {
        for (const ownCell of player.ownerNodes) {
          if (!(ownCell instanceof NodePlayer)) continue
          const ownState = this.ensurePlayerState(ownCell)
          ownState.restoreCollisionTicks = splitState.restoreCollisionTicks
          ownState.ignoreCollision = true
        }
      }

      this._core.addNode(split)
      this._core.setNodeMoving(split)
    }
  }

  ejectPlayer(player: Player) {
    const config = this._core.getConfig().world

    for (const cell of player.ownerNodes) {
      if (!(cell instanceof NodePlayer)) continue
      if (cell.mass < config.player.playerMinMassEject) continue

      const angle = this.getAngle(cell.coords, player.mouseTarget)
      if (!Number.isFinite(angle)) continue

      const size = cell.radius + 5
      const startCoords = this.clampCoords({
        x: cell.coords.x + (size + config.eject.defaultMass) * Math.sin(angle),
        y: cell.coords.y + (size + config.eject.defaultMass) * Math.cos(angle),
      })

      cell.mass -= config.eject.massLoss
      this._core.getSpatializ().updateNode(cell)

      const randomizedAngle = angle + Math.random() * 0.4 - 0.2
      const eject = new NodeEject(player, this._core.getNextNodeId(), player.playerId)
      eject.coords = startCoords
      eject.mass = config.eject.defaultMass
      eject.color = cell.color
      eject.angle = randomizedAngle
      eject.moveEngineSpeed = config.eject.speed
      eject.moveEngineTicks = 20
      eject.moveEngineDecay = 0.75

      this._core.addNode(eject)
      this._core.setNodeMoving(eject)
    }
  }

  private updatePlayerNodeState() {
    for (const node of this.iterPlayerNodes()) {
      const state = this.ensurePlayerState(node)

      if (state.recombineTicks > 0) {
        state.recombineTicks--
      }
      if (state.restoreCollisionTicks > 0) {
        state.restoreCollisionTicks--
        if (state.restoreCollisionTicks <= 0) {
          state.ignoreCollision = false
        }
      }
    }
  }

  private updatePlayerNodes() {
    for (const node of this.iterPlayerNodes()) {
      if (!node.player) continue

      this.movePlayerNode(node, node.player.mouseTarget)

      const collisions = this.getCellsInRange(node)
      for (const check of collisions) {
        this.consumeNode(node, check)
      }
    }
  }

  private updateMovingNodes() {
    for (const node of this.iterMovingNodes()) {
      if (node.moveEngineTicks > 0) {
        if (node instanceof NodeEject && this.tryFeedNearbyVirus(node)) {
          continue
        }

        this.moveBoostedNode(node)
        continue
      }

      this.finishMovingNode(node)
    }
  }

  private movePlayerNode(node: NodePlayer, target: { x: number, y: number }) {
    const config = this._core.getConfig().world
    const angle = this.getAngle(node.coords, target)
    if (!Number.isFinite(angle)) return

    const dist = this.getDistance(node.coords, target)
    const speed = Math.min(this.getPlayerSpeed(node), dist)
    const nextCoords = {
      x: node.coords.x + speed * Math.sin(angle),
      y: node.coords.y + speed * Math.cos(angle),
    }

    const state = this.ensurePlayerState(node)
    for (const other of node.player?.ownerNodes ?? []) {
      if (!(other instanceof NodePlayer)) continue
      if (other.nodeId === node.nodeId) continue
      if (state.ignoreCollision) continue

      const otherState = this.ensurePlayerState(other)
      if (state.recombineTicks <= 0 && otherState.recombineTicks <= 0) continue

      const collisionDist = other.radius + node.radius
      if (!this.simpleCollide(other.coords, nextCoords, collisionDist)) continue

      const actualDist = this.getDistance(node.coords, other.coords)
      if (actualDist >= collisionDist) continue

      const newAngle = this.getAngle(nextCoords, other.coords)
      const move = collisionDist - actualDist + 5
      other.coords = this.clampCoords({
        x: other.coords.x + move * Math.sin(newAngle),
        y: other.coords.y + move * Math.cos(newAngle),
      })
      this._core.getSpatializ().updateNode(other)
    }

    this._core.getGameMode().onNodeMove(node)
    node.coords = this.clampCoords(nextCoords)
    this._core.getSpatializ().updateNode(node)
  }

  private moveBoostedNode(node: NodeParent) {
    const border = this._core.getConfig().world.border
    let dx = node.moveEngineSpeed * Math.sin(node.angle)
    let dy = node.moveEngineSpeed * Math.cos(node.angle)
    let x = node.coords.x + dx
    let y = node.coords.y + dy

    node.moveEngineSpeed *= node.moveEngineDecay
    node.moveEngineTicks--

    if (x < border.Left) {
      dx = -dx
      x = border.Left
    }
    if (x > border.Right) {
      dx = -dx
      x = border.Right
    }
    if (y < border.Top) {
      dy = -dy
      y = border.Top
    }
    if (y > border.Bottom) {
      dy = -dy
      y = border.Bottom
    }

    node.angle = Math.atan2(dx, dy)
    node.coords = { x: x | 0, y: y | 0 }
    this._core.getSpatializ().updateNode(node)
  }

  private finishMovingNode(node: NodeParent) {
    if (node instanceof NodePlayer) {
      const state = this.ensurePlayerState(node)
      if (state.restoreCollisionTicks <= 0) {
        state.ignoreCollision = false
      }
    }

    if (node instanceof NodeEject && this.tryFeedNearbyVirus(node)) {
      return
    }

    this._core.setNodeStatic(node)
  }

  private getCellsInRange(cell: NodePlayer) {
    const list = new Set<NodeParent>()
    const bounds = this.getNodeBounds(cell)
    const owner = cell.player

    if (!owner) return list

    for (const check of this._core.getSpatializ().queryBounds(bounds)) {
      if (check.nodeId === cell.nodeId) continue
      if (!this.boundsIntersect(bounds, this.getNodeBounds(check))) continue

      if (check instanceof NodePlayer) {
        if (check.player === cell.player) {
          const state = this.ensurePlayerState(cell)
          const otherState = this.ensurePlayerState(check)
          if (state.ignoreCollision) continue
          if (state.recombineTicks > 0 || otherState.recombineTicks > 0) {
            continue
          }
        }
      }

      let multiplier = 1.25
      if (check.nodeType === 3) {
        list.add(check)
        continue
      }
      if (check.nodeType === 4) {
        multiplier = 1.33
      }
      if (check.nodeType === 1 && check.player === cell.player) {
        multiplier = 1
      }

      if (check.mass * multiplier > cell.mass) continue

      const distance = this.getDistance(cell.coords, check.coords)
      const eatingRange = cell.radius - this.getEatingRange(check)
      if (distance > eatingRange) continue

      list.add(check)
    }

    return list
  }

  private consumeNode(consumer: NodePlayer, target: NodeParent) {
    if (target.nodeType === 3 || target.nodeType === 2) {
      consumer.mass = Math.min(
        consumer.mass + target.mass,
        this._core.getConfig().world.player.maxMass,
      )
      this._core.getSpatializ().updateNode(consumer)
      this._core.delNode(target)
      return
    }

    if (target.nodeType === 4) {
      this.consumeVirus(consumer, target as NodeVirus)
      this._core.delNode(target)
      return
    }

    if (target.nodeType === 1) {
      consumer.mass = Math.min(
        consumer.mass + target.mass,
        this._core.getConfig().world.player.maxMass,
      )
      this._core.getSpatializ().updateNode(consumer)
      target.killer = consumer
      this._core.delNode(target)
      return
    }
  }

  private consumeVirus(consumer: NodePlayer, virus: NodeVirus) {
    const config = this._core.getConfig().world
    const owner = consumer.player
    if (!owner) return

    const maxSplits = Math.floor(consumer.mass / 16) - 1
    let numSplits = config.player.playerMaxCells - owner.ownerNodes.size
    numSplits = Math.min(numSplits, maxSplits)
    let splitMass = Math.min(consumer.mass / (numSplits + 1), 32)

    consumer.mass = Math.min(consumer.mass + virus.mass, config.player.maxMass)
    this._core.getSpatializ().updateNode(consumer)
    if (numSplits <= 0) return

    let bigSplits = 0
    let endMass = consumer.mass - numSplits * splitMass
    if (endMass > 300 && numSplits > 0) {
      bigSplits++
      numSplits--
    }
    if (endMass > 1200 && numSplits > 0) {
      bigSplits++
      numSplits--
    }
    if (endMass > 3000 && numSplits > 0) {
      bigSplits++
      numSplits--
    }

    let angle = 0
    for (let i = 0; i < numSplits; i++) {
      angle += 6 / Math.max(1, numSplits)
      this.spawnVirusedSplit(owner, consumer, angle, splitMass, 150)
      consumer.mass -= splitMass
      this._core.getSpatializ().updateNode(consumer)
    }

    for (let i = 0; i < bigSplits; i++) {
      angle = Math.random() * 6.28
      splitMass = consumer.mass / 4
      this.spawnVirusedSplit(owner, consumer, angle, splitMass, 20)
      consumer.mass -= splitMass
      this._core.getSpatializ().updateNode(consumer)
    }
  }

  private spawnVirusedSplit(player: Player, parent: NodePlayer, angle: number, mass: number, speed: number) {
    const config = this._core.getConfig().world
    const split = new NodePlayer(player, this._core.getNextNodeId(), player.playerId)
    split.coords = this.clampCoords(parent.coords)
    split.mass = mass
    split.color = parent.color
    split.angle = angle
    split.moveEngineSpeed = speed
    split.moveEngineTicks = 10
    split.moveEngineDecay = 0.75

    const state = this.ensurePlayerState(split)
    state.recombineTicks = this.toTicks(config.player.playerRecombineVirusTime)
    state.restoreCollisionTicks = this.toTicks(config.player.playerIgnorCollisionVirusTime)
    state.ignoreCollision = true

    this._core.addNode(split)
    this._core.setNodeMoving(split)
  }

  private tryFeedNearbyVirus(node: NodeEject) {
    const virus = this.getNearestVirus(node)
    if (!virus) return false

    const virusState = this.ensureVirusState(virus)
    const config = this._core.getConfig().world

    virus.angle = node.angle
    virus.mass += node.mass
    this._core.getSpatializ().updateNode(virus)
    virusState.fed++
    this._core.delNode(node)

    if (virusState.fed >= config.virus.feedAmount) {
      virus.mass = config.virus.minMass
      virusState.fed = 0
      this.spawnShotVirus(virus)
    }

    return true
  }

  private spawnShotVirus(parent: NodeVirus) {
    const config = this._core.getConfig().world
    const virus = new NodeVirus(parent.player, this._core.getNextNodeId(), parent.playerId)
    virus.coords = { ...parent.coords }
    virus.mass = config.virus.minMass
    virus.color = parent.color
    virus.angle = parent.angle
    virus.moveEngineSpeed = 200
    virus.moveEngineTicks = 20
    virus.moveEngineDecay = 0.75

    this._core.addNode(virus)
    this._core.setNodeMoving(virus)
  }

  private getNearestVirus(node: NodeParent) {
    const searchRadius = 100
    const bounds = {
      topY: node.coords.y - searchRadius,
      bottomY: node.coords.y + searchRadius,
      leftX: node.coords.x - searchRadius,
      rightX: node.coords.x + searchRadius,
    }

    let nearest: NodeVirus | null = null
    for (const virus of this._core.getSpatializ().queryBounds(bounds)) {
      if (!(virus instanceof NodeVirus)) continue
      if (!this.boundsIntersect(bounds, this.getNodeBounds(virus))) continue
      nearest = virus
    }

    return nearest
  }

  private ensurePlayerState(node: NodeParent) {
    let state = this._playerState.get(node)
    if (!state) {
      state = {
        recombineTicks: 0,
        ignoreCollision: false,
        restoreCollisionTicks: 0,
      }
      this._playerState.set(node, state)
    }
    return state
  }

  private ensureVirusState(node: NodeParent) {
    let state = this._virusState.get(node)
    if (!state) {
      state = { fed: 0 }
      this._virusState.set(node, state)
    }
    return state
  }

  private getPlayerSpeed(node: NodeParent) {
    return 30 * Math.pow(node.mass, -1 / 4.5) * 50 / 40
  }

  private getEatingRange(node: NodeParent) {
    if (node.nodeType === 1 || node.nodeType === 4) {
      return node.radius * 0.4
    }
    return 0
  }

  private getNodeBounds(node: NodeParent) {
    return {
      topY: node.coords.y - node.radius,
      bottomY: node.coords.y + node.radius,
      leftX: node.coords.x - node.radius,
      rightX: node.coords.x + node.radius,
    }
  }

  private boundsIntersect(
    a: { topY: number, bottomY: number, leftX: number, rightX: number },
    b: { topY: number, bottomY: number, leftX: number, rightX: number },
  ) {
    if (b.topY > a.bottomY) return false
    if (b.bottomY < a.topY) return false
    if (b.leftX > a.rightX) return false
    if (b.rightX < a.leftX) return false
    return true
  }

  private clampCoords(coords: { x: number, y: number }) {
    const border = this._core.getConfig().world.border
    return {
      x: Math.max(border.Left, Math.min(border.Right, coords.x)) | 0,
      y: Math.max(border.Top, Math.min(border.Bottom, coords.y)) | 0,
    }
  }

  private getAngle(from: { x: number, y: number }, to: { x: number, y: number }) {
    return Math.atan2(to.x - from.x, to.y - from.y)
  }

  private getDistance(a: { x: number, y: number }, b: { x: number, y: number }) {
    const dx = b.x - a.x
    const dy = b.y - a.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  private simpleCollide(a: { x: number, y: number }, b: { x: number, y: number }, distance: number) {
    const len = (2 * distance) | 0
    return Math.abs(a.x - b.x) < len && Math.abs(a.y - b.y) < len
  }

  private *iterPlayerNodes() {
    yield* this._core.getStaticNodesPlayer()
    yield* this._core.getMovingNodesPlayer()
  }

  private *iterVirusNodes() {
    yield* this._core.getStaticNodesVirus()
    yield* this._core.getMovingNodesVirus()
  }

  private *iterMovingNodes() {
    yield* this._core.getMovingNodesPlayer()
    yield* this._core.getMovingNodesEject()
    yield* this._core.getMovingNodesVirus()
    yield* this._core.getMovingNodesSource()
    yield* this._core.getMovingNodesFood()
  }

  private toTicks(seconds: number) {
    return Math.max(0, ((Number(seconds) || 0) * 20 + 0.5) >> 0)
  }
}
