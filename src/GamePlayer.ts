import type { RawData, WebSocket } from "ws";
import type GameServer from "./GameServer.js"


export default class Player {

  private readonly _core: GameServer;

  private _alive: boolean
  private _socket: WebSocket

  private _nowScore: number
  private _maxScore: number

  private _playerId: number
  private _playerImg: number
  private _playerName: string
  private _playerColor: string

  private _ownerNodes: any[]
  private _visibleNodes: any[]

  private _mouseTarget: { x: number, y: number }
  private _cameraTarget: { x: number, y: number }

  private _viewBox: {
    topY: number, bottomY: number,
    leftX: number, rightX: number,
    width: number, height: number
  }

  constructor(core: GameServer, socket: WebSocket) {
    this._core = core

    this._alive = false
    this._socket = socket

    this._nowScore = 0
    this._maxScore = 0

    this._playerId = core.getNextPlayerId()
    this._playerImg = 0
    this._playerName = ""
    this._playerColor = ""

    this._ownerNodes = []
    this._visibleNodes = []

    this._mouseTarget = { x: 0, y: 0 }
    this._cameraTarget = { x: 0, y: 0 }

    this._viewBox = {
      topY: 0, bottomY: 0,
      leftX: 0, rightX: 0,
      width: 0, height: 0
    }

    this._core.onPlayerJoin(this)

    this._socket.on("message", (data: RawData) => {
      this.message(data)
    })

    this._socket.on("close", () => {
      this._core.onPlayerLeft(this)
    })
  }
  get alive() {
    return this._alive
  }

  set alive(value: boolean) {
    this._alive = value
  }

  get socket() {
    return this._socket
  }

  set socket(value: any) {
    this._socket = value
  }

  get nowScore() {
    return this._nowScore
  }

  set nowScore(value: number) {
    this._nowScore = value
  }

  get maxScore() {
    return this._maxScore
  }

  set maxScore(value: number) {
    this._maxScore = value
  }

  get playerId() {
    return this._playerId
  }

  set playerId(value: number) {
    this._playerId = value
  }

  get playerImg() {
    return this._playerImg
  }

  set playerImg(value: number) {
    this._playerImg = value
  }

  get playerName() {
    return this._playerName
  }

  set playerName(value: string) {
    this._playerName = value
  }

  get playerColor() {
    return this._playerColor
  }

  set playerColor(value: string) {
    this._playerColor = value
  }

  get ownerNodes() {
    return this._ownerNodes
  }

  set ownerNodes(value: any[]) {
    this._ownerNodes = value
  }

  get visibleNodes() {
    return this._visibleNodes
  }

  set visibleNodes(value: any[]) {
    this._visibleNodes = value
  }

  get mouseTarget() {
    return this._mouseTarget
  }

  set mouseTarget(value: { x: number, y: number }) {
    this._mouseTarget = value
  }

  get cameraTarget() {
    return this._cameraTarget
  }

  set cameraTarget(value: { x: number, y: number }) {
    this._cameraTarget = value
  }

  get viewBox() {
    return this._viewBox
  }

  set viewBox(value: {
    topY: number, bottomY: number,
    leftX: number, rightX: number,
    width: number, height: number
  }) {
    this._viewBox = value
  }

  message(data: RawData) {

  }

  update() {

  }
}
