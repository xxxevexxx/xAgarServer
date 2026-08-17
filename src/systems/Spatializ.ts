import type GameServer from "@/GameServer"
import type NodeParent from "@entitie/NodeParent"

type Bounds = {
  topY: number
  bottomY: number
  leftX: number
  rightX: number
}


export default class Spatializ {

  private readonly _core: GameServer
  private readonly _cellSize: number
  private readonly _cells: Map<string, Set<NodeParent>>
  private readonly _nodeCells: Map<NodeParent, Set<string>>

  constructor(core: GameServer) {
    this._core = core
    this._cellSize = Math.max(256, this._core.getConfig().viewBase | 0)
    this._cells = new Map()
    this._nodeCells = new Map()
  }

  addNode(node: NodeParent) {
    this.removeNode(node)

    const keys = this.getCellKeys(this.getNodeBounds(node))
    this._nodeCells.set(node, keys)

    for (const key of keys) {
      let bucket = this._cells.get(key)
      if (!bucket) {
        bucket = new Set()
        this._cells.set(key, bucket)
      }
      bucket.add(node)
    }
  }

  updateNode(node: NodeParent) {
    this.addNode(node)
  }

  removeNode(node: NodeParent) {
    const keys = this._nodeCells.get(node)
    if (!keys) return

    for (const key of keys) {
      const bucket = this._cells.get(key)
      if (!bucket) continue

      bucket.delete(node)
      if (!bucket.size) {
        this._cells.delete(key)
      }
    }

    this._nodeCells.delete(node)
  }

  queryBounds(bounds: Bounds) {
    const result = new Set<NodeParent>()
    const keys = this.getCellKeys(bounds)

    for (const key of keys) {
      const bucket = this._cells.get(key)
      if (!bucket) continue

      for (const node of bucket) {
        if (!this.boundsIntersect(bounds, this.getNodeBounds(node))) continue
        result.add(node)
      }
    }

    return result
  }

  private getNodeBounds(node: NodeParent): Bounds {
    return {
      topY: node.coords.y - node.radius,
      bottomY: node.coords.y + node.radius,
      leftX: node.coords.x - node.radius,
      rightX: node.coords.x + node.radius,
    }
  }

  private getCellKeys(bounds: Bounds) {
    const keys = new Set<string>()
    const left = this.toCell(bounds.leftX)
    const right = this.toCell(bounds.rightX)
    const top = this.toCell(bounds.topY)
    const bottom = this.toCell(bounds.bottomY)

    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        keys.add(`${x}:${y}`)
      }
    }

    return keys
  }

  private toCell(value: number) {
    return Math.floor(value / this._cellSize)
  }

  private boundsIntersect(a: Bounds, b: Bounds) {
    if (b.topY > a.bottomY) return false
    if (b.bottomY < a.topY) return false
    if (b.leftX > a.rightX) return false
    if (b.rightX < a.leftX) return false
    return true
  }

}
