import GameServer from "@/GameServer"
import type Player from "@/entitie/anyEntitie/Player"
import type NodeParent from "@/entitie/NodeParent";
import NodePlayer from "@/entitie/NodePlayer";


export default class GameMode {

  protected readonly _core: GameServer;

  constructor(core: GameServer) {
    this._core = core;
  }

  onRun() {
    // Called when a mode Run
  }

  onPlayerJoin(player: Player) {
    // Called player join server
  }

  onPlayerSpawn(player: Player, coords: { x: number, y: number }) {
    // Called player spawn on world
  }

  onPlayerDeath(player: Player, killer: NodeParent) {
    // Called player death in world
  }

  onPlayerLeft(player: Player) {
    for (const node of Array.from(player.ownerNodes)) {
      this._core.delNode(node)
    }
  }

  onTick() {
    // Called on every game tick
  }

  canPlayerSpawn(player: Player) {
    return !this.hasPlayerCells(player)
  }

  canPlayerRespawn(player: Player) {
    return this.canPlayerSpawn(player)
  }

  spawnCommand(player: Player): NodePlayer | null {
    if (!this.canPlayerSpawn(player)) return null
    return this._core.spawnPlayer(player)
  }

  respawnCommand(player: Player): NodePlayer | null {
    if (!this.canPlayerRespawn(player)) return null
    return this._core.spawnPlayer(player)
  }

  ejectCommand(player: Player) {
    this._core.getMovements().ejectPlayer(player)
  };

  splitCommand(player: Player) {
    this._core.getMovements().splitPlayer(player)
  };

  onNodeAdd(node: NodeParent) {
    // Called when a player cell is added
  };

  onNodeDel(node: NodeParent) {
    if (!(node instanceof NodePlayer)) return
    if (!node.player) return
    if (this.hasPlayerCells(node.player)) return

    node.player.alive = false
    if (node.killer) {
      this.onPlayerDeath(node.player, node.killer)
    }
  };

  onNodeMove(cell: NodeParent) {
    // Called when a player cell is moved
  };

  onEnd() {
    // Called when a mode End
  }

  protected hasPlayerCells(player: Player) {
    for (const node of player.ownerNodes) {
      if (node instanceof NodePlayer) return true
    }
    return false
  }

}
