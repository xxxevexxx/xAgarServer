import NodeParent from "@entitie/NodeParent"
import type Player from "@/entitie/anyEntitie/Player"


export default class NodePlayer extends NodeParent {

  constructor(player: Player, nodeId: number, playerId: number) {
    super(player, nodeId, playerId)
    this.nodeType = 1
  }

}
