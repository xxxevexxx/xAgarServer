

export const OPCODE = {
  inc: {
    login: 0,
    spawn: 1,

    mouse: 2,
    split: 3,
    eject: 4,

    respawn: 5,

    ping: 7,

    messageGlobal: 8,
    messagePrivat: 9,
  },
  out: {
    setBorder: 10,
    worldSnapshot: 11,

    nickViaPlayerId: 12,
    skinViaPlayerId: 13,
    colorViaPlayerId: 14,
    stickerViaPlayerId: 15,

    clearSnapshot: 16,

    pong: 17,

    messageGlobal: 18,
    messagePrivat: 19,

    playerCreate: 50,
    playerUpdate: 51,
    playerDelete: 52,
    playerMeta: 53,

    sourceCreate: 54,
    sourceUpdate: 55,
    sourceDelete: 56,
    sourceMeta: 57,

    virusCreate: 58,
    virusUpdate: 59,
    virusDelete: 60,
    virusMeta: 61,

    ejectCreate: 62,
    ejectUpdate: 63,
    ejectDelete: 64,
    ejectMeta: 65,

    foodCreate: 66,
    foodUpdate: 67,
    foodDelete: 68,
    foodMeta: 69,
  }
} as const

export default OPCODE;
