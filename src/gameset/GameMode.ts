import GameServer from "@/GameServer"
import type Player from "@/entitie/anyEntitie/Player"
import type NodeParent from "@/entitie/NodeParent";


export default class GameMode {

  private readonly _core: GameServer;

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
    // Called player left server
  }

  onTick() {
    // Called on every game tick
  }

  ejectCommand(player: Player) {
    // Called player press Eject
  };

  splitCommand(player: Player) {
    // Called player press Split
  };

  onNodeAdd(node: NodeParent) {
    // Called when a player cell is added
  };

  onNodeDel(node: NodeParent) {
    // Called when a player cell is removed
  };

  onNodeMove(cell: NodeParent) {
    // Called when a player cell is moved
  };

  onEnd() {
    // Called when a mode End
  }

}
