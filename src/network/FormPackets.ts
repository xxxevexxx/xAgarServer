

export const FORMAT = {
  inc: {
    login: {
      opcode: "int32",
      nickname: "string(1-16)",
      password: "string(1-16)"
    },
    spawn: {
      opcode: "int32",
    },

    mouse: {
      opcode: "int32",
      x: "int32",
      y: "int32"
    },
    split: {
      opcode: "int32",
      x: "int32",
      y: "int32"
    },
    eject: {
      opcode: "int32",
      x: "int32",
      y: "int32"
    },

    respawn: {
      opcode: "int32",
    },

    ping: {
      opcode: "int32",
      payload: "string(1-16)"
    },

    messageGlobal: {
      opcode: "int32",
      message: "string(1-128)",
    },
    messagePrivat: {
      opcode: "int32",
      message: "string(1-128)",
      playerId: "int32",
    },
  },
  out: {
    setBorder: {
      opcode: "int32",
      x: "int32",
      y: "int32"
    },
    worldUpdate: {
      opcode: "int32",
      nodesUpdate: "NodeParent[]",
      nodesDelete: "number[]"
    },

    nickViaPlayerId: {
      opcode: "int32",
      playerId: "int32",
      nick: "string(1-16)",
    },
    skinViaPlayerId: {
      opcode: "int32",
      playerId: "int32",
      skin: "int32",
    },
    colorViaPlayerId: {
      opcode: "int32",
      playerId: "int32",
      color: "int32",
    },
    stickerViaPlayerId: {
      opcode: "int32",
      playerId: "int32",
      sticker: "int32",
    },

    clearNodes: {
      opcode: "int32",
    },

    pong: {
      opcode: "int32",
      payload: "string(1-16)"
    },

    messageGlobal: {
      opcode: "int32",
      message: "string(1-128)",
    },
    messagePrivat: {
      opcode: "int32",
      message: "string(1-128)",
      playerId: "int32",
    },
  }
} as const

export default FORMAT;
