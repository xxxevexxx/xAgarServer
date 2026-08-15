import GameServer from "@/GameServer";


export default class Commandes {

  private readonly _core: GameServer;

  constructor(core: GameServer) {
    this._core = core;
  }

}
