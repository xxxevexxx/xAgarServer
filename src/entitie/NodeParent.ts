import type Player from "@/entitie/anyEntitie/Player"

const NODE_UPDATE_MASK = {
  coords: 1 << 0,
  mass: 1 << 1,
} as const


export default abstract class NodeParent {

  private _alive: boolean
  private _player: Player | null
  private _killer: NodeParent | null

  private _nodeId: number
  private _nodeType: number
  private _playerId: number

  private _mass: number
  private _angle: number
  private _color: { r: number, g: number, b: number }
  private _coords: { x: number, y: number }
  private _dirtyMask: number

  private _moveEngineTicks: number
  private _moveEngineSpeed: number
  private _moveEngineBoost: number
  private _moveEngineDecay: number

  constructor(player: Player | null, nodeId: number, playerId: number) {
    this._alive = false
    this._player = player
    this._killer = null

    this._nodeId = nodeId
    this._nodeType = 0
    this._playerId = playerId

    this._mass = 0
    this._angle = 0
    this._color = { r: 255, g: 255, b: 255 }
    this._coords = { x: 0, y: 0 }
    this._dirtyMask = NODE_UPDATE_MASK.coords | NODE_UPDATE_MASK.mass

    this._moveEngineTicks = 0;
    this._moveEngineSpeed = 0;
    this._moveEngineBoost = 0;
    this._moveEngineDecay = .75;
  }

  get alive() {
    return this._alive
  }

  set alive(value: boolean) {
    this._alive = value
  }

  get player() {
    return this._player
  }

  set player(value: Player | null) {
    this._player = value
  }

  get killer() {
    return this._killer
  }

  set killer(value: NodeParent | null) {
    this._killer = value
  }

  get nodeId() {
    return this._nodeId
  }

  set nodeId(value: number) {
    this._nodeId = value
  }

  get nodeType() {
    return this._nodeType
  }

  set nodeType(value: number) {
    this._nodeType = value
  }

  get playerId() {
    return this._playerId
  }

  set playerId(value: number) {
    this._playerId = value
  }

  get mass() {
    return this._mass
  }

  set mass(value: number) {
    if (this._mass === value) return
    this._mass = value
    this._dirtyMask |= NODE_UPDATE_MASK.mass
  }

  get angle() {
    return this._angle
  }

  set angle(value: number) {
    this._angle = value
  }

  get color() {
    return this._color
  }

  set color(value: { r: number, g: number, b: number }) {
    this._color = value
  }

  get coords() {
    return this._coords
  }

  set coords(value: { x: number, y: number }) {
    if (this._coords.x === value.x && this._coords.y === value.y) return
    this._coords = value
    this._dirtyMask |= NODE_UPDATE_MASK.coords
  }

  get dirtyUpdate() {
    return this._dirtyMask !== 0
  }

  set dirtyUpdate(value: boolean) {
    this._dirtyMask = value ? NODE_UPDATE_MASK.coords | NODE_UPDATE_MASK.mass : 0
  }

  get dirtyMask() {
    return this._dirtyMask
  }

  set dirtyMask(value: number) {
    this._dirtyMask = value
  }

  get radius() {
    return Math.ceil(Math.sqrt(100 * Math.max(0, this._mass)))
  }

  get moveEngineTicks() {
    return this._moveEngineTicks
  }

  set moveEngineTicks(value: number) {
    this._moveEngineTicks = value
  }

  get moveEngineSpeed() {
    return this._moveEngineSpeed
  }

  set moveEngineSpeed(value: number) {
    this._moveEngineSpeed = value
  }

  set moveEngineBoost(value: number) {
    this._moveEngineBoost = value
  }

  get moveEngineBoost() {
    return this._moveEngineBoost
  }

  set moveEngineDecay(value: number) {
    this._moveEngineDecay = value
  }

  get moveEngineDecay() {
    return this._moveEngineDecay
  }
}
