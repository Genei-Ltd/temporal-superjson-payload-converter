const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

/** Encode a string to UTF-8 bytes */
export const encode = (s: string): Uint8Array => textEncoder.encode(s)

/** Decode UTF-8 bytes to a string */
export const decode = (b: Uint8Array): string => textDecoder.decode(b)
