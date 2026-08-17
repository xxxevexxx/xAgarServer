export default class PacketWriter {

  static color(value: { r: number, g: number, b: number }) {
    return Buffer.from([
      this.normalizeByte(value.r),
      this.normalizeByte(value.g),
      this.normalizeByte(value.b),
    ])
  }

  static string(value: string) {
    const data = Buffer.from(value, "utf8")
    return Buffer.concat([this.varUint(data.length), data])
  }

  static uint8(value: number) {
    const buf = Buffer.allocUnsafe(1)
    buf.writeUInt8(this.normalizeByte(value), 0)
    return buf
  }

  static uint16(value: number) {
    const buf = Buffer.allocUnsafe(2)
    buf.writeUInt16LE(this.normalizeUInt16(value), 0)
    return buf
  }

  static uint32(value: number) {
    const buf = Buffer.allocUnsafe(4)
    buf.writeUInt32LE(this.normalizeUInt32(value), 0)
    return buf
  }

  static int32(value: number) {
    const buf = Buffer.allocUnsafe(4)
    buf.writeInt32LE(this.normalizeInt32(value), 0)
    return buf
  }

  static float32(value: number) {
    const buf = Buffer.allocUnsafe(4)
    buf.writeFloatLE(Number.isFinite(value) ? value : 0, 0)
    return buf
  }

  static varUint(value: number) {
    let current = this.normalizeUInt32(value)
    const bytes: number[] = []

    do {
      let next = current & 0x7f
      current >>>= 7
      if (current !== 0) {
        next |= 0x80
      }
      bytes.push(next)
    } while (current !== 0)

    return Buffer.from(bytes)
  }

  private static normalizeByte(value: number) {
    if (!Number.isFinite(value)) return 0
    return Math.max(0, Math.min(255, value | 0))
  }

  private static normalizeUInt16(value: number) {
    if (!Number.isFinite(value)) return 0
    return Math.max(0, Math.min(0xffff, value | 0))
  }

  private static normalizeUInt32(value: number) {
    if (!Number.isFinite(value)) return 0
    return Math.max(0, value >>> 0)
  }

  private static normalizeInt32(value: number) {
    if (!Number.isFinite(value)) return 0
    if (value > 0x7fffffff) return 0x7fffffff
    if (value < -0x80000000) return -0x80000000
    return value | 0
  }

}
