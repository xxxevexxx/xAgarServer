import type { RawData } from "ws"


export default class PacketReader {

  private readonly _buffer: Buffer
  private _offset: number

  constructor(data: RawData | Buffer) {
    this._buffer = this.toBuffer(data)
    this._offset = 0
  }

  get length() {
    return this._buffer.length
  }

  get offset() {
    return this._offset
  }

  get left() {
    return this._buffer.length - this._offset
  }

  readUInt8() {
    if (this.left < 1) return null
    const value = this._buffer.readUInt8(this._offset)
    this._offset += 1
    return value
  }

  readInt32() {
    if (this.left < 4) return null
    const value = this._buffer.readInt32LE(this._offset)
    this._offset += 4
    return value
  }

  readUInt32() {
    if (this.left < 4) return null
    const value = this._buffer.readUInt32LE(this._offset)
    this._offset += 4
    return value
  }

  readCoords() {
    const x = this.readInt32()
    const y = this.readInt32()
    if (x === null || y === null) return null

    return { x, y }
  }

  readVarUint() {
    let value = 0
    let shift = 0

    while (this.left > 0) {
      const byte = this.readUInt8()
      if (byte === null) return null

      value |= (byte & 0x7f) << shift
      if ((byte & 0x80) === 0) {
        return value >>> 0
      }
      shift += 7
    }

    return null
  }

  readString() {
    const length = this.readVarUint()
    if (length === null || this.left < length) return null

    const value = this._buffer.toString("utf8", this._offset, this._offset + length)
    this._offset += length
    return value
  }

  readOpcode() {
    if (this.length >= 4) {
      return this.readInt32()
    }

    return this.readUInt8()
  }

  private toBuffer(data: RawData | Buffer) {
    if (Buffer.isBuffer(data)) return data
    if (data instanceof ArrayBuffer) return Buffer.from(data)
    if (Array.isArray(data)) return Buffer.concat(data)
    return Buffer.from(data)
  }

}
