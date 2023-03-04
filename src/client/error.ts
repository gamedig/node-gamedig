/**
 * A type that converts a union type to an intersection type.
 *
 * Converts { A | B | C } to { A & B & C }
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

/**
 * A type for extending class constructors.
 */
type Constructor = new (...args: any[]) => any;

/**
 * A type for dynamically returning extended class constructors.
 */
type Constructable<T extends Constructor> = new (...args: any[]) => T;

/**
 * A type that gets the keys of an object.
 */
type KeyOfObj<T> = T[keyof T];

/**
 * Errors that are thrown by the network.
 *
 */
enum NetworkError {
  UNKNOWN_NETWORK_DNS_ERROR = "UNKNOWN_NETWORK_DNS_ERROR",
  UNKNOWN_NETWORK_RCON_ERROR = "UNKNOWN_NETWORK_RCON_ERROR",
  UNKNOWN_NETWORK_TCP_ERROR = "UNKNOWN_NETWORK_TCP_ERROR",
  UNKNOWN_NETWORK_UDP_ERROR = "UNKNOWN_NETWORK_UDP_ERROR",
}
/**
 * Errors that are thrown by the client.
 *
 */
enum ClientError {
  UNKNOWN_CLIENT_BUILDER_ERROR = "UNKNOWN_CLIENT_BUILDER_ERROR",
  UNKNOWN_CLIENT_GAMEDIG_ERROR = "UNKNOWN_CLIENT_GAMEDIG_ERROR",
  UNKNOWN_CLIENT_LOGGER_ERROR = "UNKNOWN_CLIENT_LOGGER_ERROR",
  UNKNOWN_CLIENT_READER_ERROR = "UNKNOWN_CLIENT_READER_ERROR",
}
/**
 * Errors that are thrown by the protocol.
 *
 */
enum ProtocolError {
  UNKNOWN_PROTOCOL_ENGINE_ERROR = "UNKNOWN_PROTOCOL_ENGINE_ERROR",
  UNKNOWN_PROTOCOL_GAME_ERROR = "UNKNOWN_PROTOCOL_GAME_ERROR",
  UNKNOWN_PROTOCOL_BASE_ERROR = "UNKNOWN_PROTOCOL_BASE_ERROR",
}
/**
 * Errors that are thrown by the bin.
 *
 */
enum BinError {
  UNKNOWN_BIN_ERROR = "UNKNOWN_BIN_ERROR",
}

/**
 * Merges enums into a single object.
 * @param enums The enums to merge.
 * @returns The merged enum.
 */
export const mergeEnums = <T extends object>(enums: T[]) => {
  return enums.reduce((a, v) => ({ ...a, ...v }), {}) as UnionToIntersection<T>;
};

/**
 * All of the errors that are thrown by the library.
 */
export const libError = Object.freeze(
  mergeEnums([NetworkError, ClientError, ProtocolError, BinError])
);

/**
 * Gets the error message for the given error.
 * @param enumValue The error to get the message for.
 * @returns The error message.
 */
export const errorMessage = <T extends KeyOfObj<typeof libError>>(
  error: T,
  ...args: any[]
): string => {
  const argsObj = JSON.stringify(args.map((a, i) => ({ [i]: a })));

  return `[GAMEDIG_ERROR]::[${error}]:${argsObj}`;
};

/**
 * Builds an error class that extends the given base class.
 * @param base The base class to extend.
 * @returns The extended class.
 */
function buildError<T extends Constructor>(base: T): Constructable<T> {
  return class extends base {
    constructor(...args: any[]) {
      super(errorMessage(args[0], ...args.slice(1)));

      Error.captureStackTrace?.(this, this.constructor);
    }

    /**
     * Gets the name of the error.
     */
    get name() {
      return super.name;
    }
  };
}

/**
 * The Error class for the library.
 */
export const GameDigError = buildError(Error);

/**
 * The TypeError class for the library.
 */
export const GameDigTypeError = buildError(TypeError);

/**
 * The RangeError class for the library.
 */
export const GameDigRangeError = buildError(RangeError);
