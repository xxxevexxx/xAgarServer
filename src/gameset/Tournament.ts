import GameMode from "@gameset/GameMode"
import type GameServer from "@/GameServer"
import type Player from "@/entitie/anyEntitie/Player"


type TournamentState = "waiting" | "running" | "ended"


export default class Tournament extends GameMode {

  private _state: TournamentState

  constructor(core: GameServer) {
    super(core)
    this._state = "waiting"
  }

  get state() {
    return this._state
  }

  set state(value: TournamentState) {
    this._state = value
  }

  canPlayerSpawn(player: Player) {
    if (this._state !== "waiting") return false
    return super.canPlayerSpawn(player)
  }

  canPlayerRespawn(player: Player) {
    if (this._state !== "waiting") return false
    return super.canPlayerRespawn(player)
  }

}
