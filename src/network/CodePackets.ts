

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
    worldUpdate: 11,

    nickViaPlayerId: 12,
    skinViaPlayerId: 13,
    colorViaPlayerId: 14,
    stickerViaPlayerId: 15,

    clearNodes: 16,

    pong: 17,

    messageGlobal: 18,
    messagePrivat: 19,
  }
} as const

export default OPCODE;
