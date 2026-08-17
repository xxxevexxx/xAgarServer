import GameMode from "@gameset/GameMode"
import type GameServer from "@/GameServer"
import type NodeParent from "@/entitie/NodeParent";
import NodeFood from "@/entitie/NodeFood";
import NodeVirus from "@/entitie/NodeVirus";
import NodeSource from "@/entitie/NodeSource";

type SpawnConfig = {
  spawnInterval: number
  spawnAmount: number
  startAmount: number
  minAmount: number
  maxAmount: number
  minMass: number
  maxMass: number
}


export default class Experiment extends GameMode {

  private _foodSpawnTick: number
  private _virusSpawnTick: number
  private _sourceSpawnTick: number

  constructor(core: GameServer) {
    super(core)
    this._foodSpawnTick = 0
    this._virusSpawnTick = 0
    this._sourceSpawnTick = 0
  }

  onRun() {
    const world = this._core.getConfig().world

    this.spawnFood(world.food.startAmount)
    this.spawnVirus(world.virus.startAmount)
    this.spawnSource(world.source.startAmount)
  }

  onTick() {
    this.maintainWorldNodes()
  }

  spawnFood(amount: number) {
    const config = this._core.getConfig().world.food
    const count = this.countFood()
    const spawnAmount = Math.min(amount, Math.max(0, config.maxAmount - count))

    for (let i = 0; i < spawnAmount; i++) {
      const node = new NodeFood(null, this._core.getNextNodeId(), 0)
      this.setupServerNode(node, config)
      node.color = this.randomColor()
      this._core.addNode(node)
    }
  }

  spawnVirus(amount: number) {
    const config = this._core.getConfig().world.virus
    const count = this.countVirus()
    const spawnAmount = Math.min(amount, Math.max(0, config.maxAmount - count))

    for (let i = 0; i < spawnAmount; i++) {
      const node = new NodeVirus(null, this._core.getNextNodeId(), 0)
      this.setupServerNode(node, config)
      node.color = { r: 51, g: 204, b: 51 }
      this._core.addNode(node)
    }
  }

  spawnSource(amount: number) {
    const config = this._core.getConfig().world.source
    const count = this.countSource()
    const spawnAmount = Math.min(amount, Math.max(0, config.maxAmount - count))

    for (let i = 0; i < spawnAmount; i++) {
      const node = new NodeSource(null, this._core.getNextNodeId(), 0)
      this.setupServerNode(node, config)
      node.color = { r: 120, g: 170, b: 255 }
      this._core.addNode(node)
    }
  }

  private maintainWorldNodes() {
    const world = this._core.getConfig().world

    this._foodSpawnTick = this.maintainNodePool(
      this.countFood(),
      world.food,
      this._foodSpawnTick,
      (amount) => this.spawnFood(amount),
    )

    this._virusSpawnTick = this.maintainNodePool(
      this.countVirus(),
      world.virus,
      this._virusSpawnTick,
      (amount) => this.spawnVirus(amount),
    )

    this._sourceSpawnTick = this.maintainNodePool(
      this.countSource(),
      world.source,
      this._sourceSpawnTick,
      (amount) => this.spawnSource(amount),
    )
  }

  private maintainNodePool(
    count: number,
    config: SpawnConfig,
    tick: number,
    spawn: (amount: number) => void,
  ) {
    if (count >= config.minAmount) return 0

    const nextTick = tick + 1
    if (nextTick < config.spawnInterval) return nextTick

    spawn(config.spawnAmount)
    return 0
  }

  private setupServerNode(node: NodeParent, config: SpawnConfig) {
    node.mass = this.randomInt(config.minMass, config.maxMass)
    node.coords = this._core.getRandomPosition(node)
    node.alive = true
  }

  private countFood() {
    return this._core.getStaticNodesFood().size + this._core.getMovingNodesFood().size
  }

  private countVirus() {
    return this._core.getStaticNodesVirus().size + this._core.getMovingNodesVirus().size
  }

  private countSource() {
    return this._core.getStaticNodesSource().size + this._core.getMovingNodesSource().size
  }

  private randomInt(min: number, max: number) {
    if (min >= max) return min | 0
    return (Math.random() * (max - min + 1) + min) | 0
  }

  private randomColor() {
    return {
      r: this.randomInt(64, 255),
      g: this.randomInt(64, 255),
      b: this.randomInt(64, 255),
    }
  }

}
