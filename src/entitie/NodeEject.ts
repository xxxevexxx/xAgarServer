import NodeParent from "@entitie/NodeParent"
import type Player from "@/entitie/anyEntitie/Player"


export default class NodeEject extends NodeParent {

  constructor(player: Player | null, nodeId: number, playerId: number) {
    super(player, nodeId, playerId)
    this.nodeType = 2
  }

}
