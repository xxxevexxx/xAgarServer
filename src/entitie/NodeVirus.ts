import NodeParent from "@entitie/NodeParent"


export default class NodeVirus extends NodeParent {

  constructor(player: any, nodeId: number, playerId: number) {
    super(player, nodeId, playerId)
    this.nodeType = 4
  }

}
