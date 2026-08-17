import GameServer from "@/GameServer";
import OPCODE from "@network/CodePackets"
import PacketWriter from "@network/PacketWriter"
import type NodeParent from "@entitie/NodeParent"

type NodeLike = NodeParent
type NodeIterable = Iterable<NodeLike>

type NodeOpcodes = {
  create: number
  update: number
  delete: number
  meta: number
}

export const UPDATE_MASK = {
  coords: 1 << 0,
  mass: 1 << 1,
} as const

export const META_MASK = {
  playerName: 1 << 0,
  playerImg: 1 << 1,
  playerColor: 1 << 2,
} as const

const UPDATE_MASK_ALL =
  UPDATE_MASK.coords |
  UPDATE_MASK.mass

const META_MASK_ALL =
  META_MASK.playerName |
  META_MASK.playerImg |
  META_MASK.playerColor


export default class Serialize {

  private readonly _core: GameServer;

  constructor(core: GameServer) {
    this._core = core;
  }

  createNode(node: NodeLike) {
    return this.buildNodePacket(this.resolveNodeOpcodes(node).create, this.createNodeEntry(node))
  }

  updateNode(node: NodeLike, mask: number = UPDATE_MASK_ALL) {
    return this.buildNodePacket(this.resolveNodeOpcodes(node).update, this.updateNodeEntry(node, mask))
  }

  deleteNode(nodeOrId: NodeLike | number) {
    const nodeId = typeof nodeOrId === "number" ? nodeOrId : nodeOrId.nodeId
    const opcode = typeof nodeOrId === "number"
      ? OPCODE.out.playerDelete
      : this.resolveNodeOpcodes(nodeOrId).delete

    return this.buildNodePacket(opcode, this.deleteNodeEntry(nodeId))
  }

  metaNode(node: NodeLike, mask: number = META_MASK_ALL) {
    return this.buildNodePacket(this.resolveNodeOpcodes(node).meta, this.metaNodeEntry(node, mask))
  }

  createNodes(nodes: NodeIterable) {
    return this.batchNodesByOpcode(nodes, (node) => this.resolveNodeOpcodes(node).create, (node) => this.createNodeEntry(node))
  }

  updateNodes(nodes: NodeIterable) {
    return this.batchNodesByOpcode(nodes, (node) => this.resolveNodeOpcodes(node).update, (node) => this.updateNodeEntry(node, node.dirtyMask))
  }

  deleteNodes(nodes: Iterable<NodeLike | number>) {
    return this.batchValuesByOpcode(
      nodes,
      (nodeOrId) => typeof nodeOrId === "number" ? OPCODE.out.playerDelete : this.resolveNodeOpcodes(nodeOrId).delete,
      (nodeOrId) => this.deleteNodeEntry(typeof nodeOrId === "number" ? nodeOrId : nodeOrId.nodeId),
    )
  }

  metaNodes(nodes: NodeIterable, mask: number = META_MASK_ALL) {
    return this.batchNodesByOpcode(nodes, (node) => this.resolveNodeOpcodes(node).meta, (node) => this.metaNodeEntry(node, mask))
  }

  worldSnapshot(nodes: NodeIterable) {
    const entries = Array.from(nodes, (node) => this.snapshotNode(node))

    return this.buildPacket(OPCODE.out.worldSnapshot, [
      PacketWriter.varUint(entries.length),
      ...entries,
    ])
  }

  clearSnapshot() {
    return this.buildPacket(OPCODE.out.clearSnapshot)
  }

  private createNodeEntry(node: NodeLike) {
    return [
      PacketWriter.varUint(node.nodeId),
      PacketWriter.varUint(node.playerId),
      PacketWriter.uint16(node.coords.x),
      PacketWriter.uint16(node.coords.y),
      PacketWriter.uint32(node.mass),
      PacketWriter.color(node.color),
    ]
  }

  private updateNodeEntry(node: NodeLike, mask: number = UPDATE_MASK_ALL) {
    const chunks: Buffer[] = [
      PacketWriter.varUint(node.nodeId),
      PacketWriter.uint8(mask),
    ]

    if (mask & UPDATE_MASK.coords) {
      chunks.push(PacketWriter.uint16(node.coords.x), PacketWriter.uint16(node.coords.y))
    }
    if (mask & UPDATE_MASK.mass) {
      chunks.push(PacketWriter.uint32(node.mass))
    }

    return chunks
  }

  private deleteNodeEntry(nodeId: number) {
    return [PacketWriter.varUint(nodeId)]
  }

  private metaNodeEntry(node: NodeLike, mask: number = META_MASK_ALL) {
    const player = node.player
    if (!player) {
      return [
        PacketWriter.varUint(node.nodeId),
        PacketWriter.uint8(0),
        PacketWriter.varUint(node.playerId),
      ]
    }

    const chunks: Buffer[] = [
      PacketWriter.varUint(node.nodeId),
      PacketWriter.uint8(mask),
      PacketWriter.varUint(node.playerId),
    ]

    if (mask & META_MASK.playerName) {
      chunks.push(PacketWriter.string(player?.playerName ?? ""))
    }
    if (mask & META_MASK.playerImg) {
      chunks.push(PacketWriter.varUint(player?.playerImg ?? 0))
    }
    if (mask & META_MASK.playerColor) {
      chunks.push(PacketWriter.string(player?.playerColor ?? ""))
    }

    return chunks
  }

  private batchNodesByOpcode(
    nodes: NodeIterable,
    getOpcode: (node: NodeLike) => number,
    getEntry: (node: NodeLike) => Buffer[],
  ) {
    return this.batchValuesByOpcode(nodes, getOpcode, getEntry)
  }

  private batchValuesByOpcode<T>(
    values: Iterable<T>,
    getOpcode: (value: T) => number,
    getEntry: (value: T) => Buffer[],
  ) {
    const batches = new Map<number, Buffer[][]>()

    for (const value of values) {
      const opcode = getOpcode(value)
      const batch = batches.get(opcode)
      if (batch) {
        batch.push(getEntry(value))
      } else {
        batches.set(opcode, [getEntry(value)])
      }
    }

    const packets: Buffer[] = []
    for (const [opcode, entries] of batches) {
      packets.push(this.buildPacket(opcode, [
        PacketWriter.varUint(entries.length),
        ...entries.flat(),
      ]))
    }

    return Buffer.concat(packets)
  }

  private buildNodePacket(opcode: number, chunks: Buffer[]) {
    return this.buildPacket(opcode, chunks)
  }

  private snapshotNode(node: NodeLike) {
    const player = node.player

    return Buffer.concat([
      PacketWriter.uint8(node.nodeType),
      PacketWriter.varUint(node.nodeId),
      PacketWriter.varUint(node.playerId),
      PacketWriter.uint16(node.coords.x),
      PacketWriter.uint16(node.coords.y),
      PacketWriter.uint32(node.mass),
      PacketWriter.color(node.color),
      PacketWriter.uint8(player ? 1 : 0),
      PacketWriter.string(player?.playerName ?? ""),
      PacketWriter.varUint(player?.playerImg ?? 0),
      PacketWriter.string(player?.playerColor ?? ""),
    ])
  }

  private buildPacket(opcode: number, chunks: Buffer[] = []) {
    return Buffer.concat([PacketWriter.uint8(opcode), ...chunks])
  }

  private resolveNodeOpcodes(node: NodeLike): NodeOpcodes {
    switch (node.nodeType) {
      case 1:
        return {
          create: OPCODE.out.playerCreate,
          update: OPCODE.out.playerUpdate,
          delete: OPCODE.out.playerDelete,
          meta: OPCODE.out.playerMeta,
        }
      case 2:
        return {
          create: OPCODE.out.ejectCreate,
          update: OPCODE.out.ejectUpdate,
          delete: OPCODE.out.ejectDelete,
          meta: OPCODE.out.ejectMeta,
        }
      case 3:
        return {
          create: OPCODE.out.foodCreate,
          update: OPCODE.out.foodUpdate,
          delete: OPCODE.out.foodDelete,
          meta: OPCODE.out.foodMeta,
        }
      case 4:
        return {
          create: OPCODE.out.virusCreate,
          update: OPCODE.out.virusUpdate,
          delete: OPCODE.out.virusDelete,
          meta: OPCODE.out.virusMeta,
        }
      case 5:
        return {
          create: OPCODE.out.sourceCreate,
          update: OPCODE.out.sourceUpdate,
          delete: OPCODE.out.sourceDelete,
          meta: OPCODE.out.sourceMeta,
        }
      default:
        throw new Error(`Unknown nodeType: ${node.nodeType}`)
    }
  }

}
