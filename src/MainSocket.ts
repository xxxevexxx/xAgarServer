import Controller from "@/Controller"
import { WebSocket, type RawData } from "ws"
import { performance } from "node:perf_hooks"


export default class MainSocket {
  private _controller: Controller

  private _client!: WebSocket

  private _uptime: number
  private _running: boolean
  private _loopTimer: NodeJS.Timeout | null = null
  private _accumulator = 0
  private _lastTime = 0
  private _tickId = 0

  private _incomingEvents: Set<any>
  private _outgoingEvents: Set<any>

  constructor(controller: Controller) {
    this._controller = controller

    this._uptime = performance.now()
    this._running = false

    this._incomingEvents = new Set()
    this._outgoingEvents = new Set()
  }

  listen() {
    this._client = new WebSocket("");

    this._client.on("open", () => {
      this.onSocketRun()
    });

    this._client.on("message", (event: RawData) => {
      this.addIncomingEvents(event)
    });

    this._client.on("close", () => {
      this.onSocketEnd()
    });

    this._client.on("error", (error: Error) => {
      this.onSocketError(error)
    });
  }

  startLoop() {
    if (this._loopTimer) return
    this.listen()
    this._running = true
    this._accumulator = 0
    this._lastTime = performance.now()

    const frame = () => {
      if (!this._running) {
        this._loopTimer = null
        return
      }

      const now = performance.now()
      let delta = now - this._lastTime
      this._lastTime = now

      if (delta > 250) delta = 250

      this._accumulator += delta

      let ticks = 0
      while (this._accumulator >= this._controller.tickMs && ticks < this._controller.tickMcu) {
        this._accumulator -= this._controller.tickMs
        this.tick()
        ticks++
      }

      if (ticks === this._controller.tickMcu) {
        this._accumulator = 0
      }

      const delay = Math.max(0, this._controller.tickMs - this._accumulator)
      this._loopTimer = setTimeout(frame, delay)
    }

    this._loopTimer = setTimeout(frame, this._controller.tickMs)
  }

  stopLoop() {
    this._running = false

    if (this._loopTimer) {
      clearTimeout(this._loopTimer)
      this._loopTimer = null
    }
  }

  private tick() {
    this._tickId++;
  }

  private onSocketRun() {
    console.log(`Socket startup`)
  }

  private onSocketEnd() {
    console.log(`Socket shutdown`)
  }

  private onSocketError(error: Error) {
    console.error(error)
  }

  addIncomingEvents(event: any) {
    this._incomingEvents.add(event)
  }

  addOutgoingEvents(event: any) {
    this._outgoingEvents.add(event)
  }
}
