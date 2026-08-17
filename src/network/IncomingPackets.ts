import type { RawData } from "ws"
import OPCODE from "@network/CodePackets"
import PacketReader from "@network/PacketReader"

type Coords = { x: number, y: number }

export type IncomingPacket =
  | { type: "login" }
  | { type: "spawn" }
  | { type: "respawn" }
  | { type: "mouse", coords: Coords }
  | { type: "split", coords: Coords | null }
  | { type: "eject", coords: Coords | null }
  | { type: "ping" }
  | { type: "messageGlobal" }
  | { type: "messagePrivat" }
  | { type: "unknown", opcode: number | null }


export default class IncomingPackets {

  static parse(data: RawData): IncomingPacket {
    const reader = new PacketReader(data)
    if (!reader.length) return { type: "unknown", opcode: null }

    const opcode = reader.readOpcode()
    if (opcode === null) return { type: "unknown", opcode: null }

    if (opcode === OPCODE.inc.login) return { type: "login" }
    if (opcode === OPCODE.inc.spawn) return { type: "spawn" }
    if (opcode === OPCODE.inc.respawn) return { type: "respawn" }
    if (opcode === OPCODE.inc.ping) return { type: "ping" }
    if (opcode === OPCODE.inc.messageGlobal) return { type: "messageGlobal" }
    if (opcode === OPCODE.inc.messagePrivat) return { type: "messagePrivat" }

    if (opcode === OPCODE.inc.mouse) {
      const coords = reader.readCoords()
      return coords ? { type: "mouse", coords } : { type: "unknown", opcode }
    }

    if (opcode === OPCODE.inc.split) {
      return { type: "split", coords: reader.readCoords() }
    }

    if (opcode === OPCODE.inc.eject) {
      return { type: "eject", coords: reader.readCoords() }
    }

    return { type: "unknown", opcode }
  }

}
