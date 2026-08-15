import NodeParent from "@entitie/NodeParent"


export default class NodePlayer extends NodeParent {

  constructor(player: any, nodeId: number, playerId: number) {
    super(player, nodeId, playerId)
    this.nodeType = 1
  }

}
