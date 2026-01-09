/**
 * SuperJSON-based payload converter for Temporal workflows.
 *
 * This module provides a custom payload converter that uses SuperJSON to properly
 * serialize and deserialize complex JavaScript types that standard JSON cannot
 * handle, including:
 *
 * - Date objects
 * - Map and Set collections
 * - BigInt values
 * - Regular expressions
 * - And more (see SuperJSON documentation)
 *
 * The converter is backwards-compatible with the default JSON payload converter,
 * meaning old workers can still deserialize new payloads (with graceful degradation
 * for complex types).
 */
import {
  BinaryPayloadConverter,
  CompositePayloadConverter,
  METADATA_ENCODING_KEY,
  type Payload,
  type PayloadConverterWithEncoding,
  UndefinedPayloadConverter,
  ValueError,
} from '@temporalio/common'
import superjson, { type SuperJSONResult } from 'superjson'
import { decode, encode } from './encoding'

/**
 * Metadata key used to store SuperJSON type information in payloads.
 * When this key is present in payload metadata, the payload contains
 * complex types that require SuperJSON for proper deserialization.
 */
export const SUPERJSON_META_KEY = 'superjson-meta'

const ENCODING = 'json/plain'

/**
 * A payload converter that uses SuperJSON for serialization.
 *
 * SuperJSON extends JSON serialization to handle types like Date, Map, Set,
 * BigInt, and more. Type information is stored in the payload metadata,
 * allowing for accurate deserialization while maintaining backwards
 * compatibility with standard JSON payloads.
 *
 * @example
 * ```ts
 * import { SuperJsonPayloadConverter } from '@coloop-ai/temporal-superjson-payload-converter'
 *
 * const converter = new SuperJsonPayloadConverter()
 *
 * // Serialize a value with complex types
 * const payload = converter.toPayload({
 *   createdAt: new Date(),
 *   tags: new Set(['important', 'urgent']),
 *   metadata: new Map([['key', 'value']]),
 * })
 *
 * // Deserialize back to the original types
 * const value = converter.fromPayload(payload)
 * // value.createdAt is a Date instance
 * // value.tags is a Set instance
 * // value.metadata is a Map instance
 * ```
 */
export class SuperJsonPayloadConverter implements PayloadConverterWithEncoding {
  public readonly encodingType = ENCODING

  public toPayload<T>(value: T): Payload | undefined {
    if (value === undefined) return undefined

    const { json, meta } = superjson.serialize(value)

    const metadata: Record<string, Uint8Array> = {
      [METADATA_ENCODING_KEY]: encode(ENCODING),
    }

    if (meta !== undefined) {
      metadata[SUPERJSON_META_KEY] = encode(JSON.stringify(meta))
    }

    return {
      metadata,
      data: encode(JSON.stringify(json)),
    }
  }

  public fromPayload<T>(payload: Payload): T {
    if (!payload.data) {
      throw new ValueError('Payload data is missing')
    }

    const json = JSON.parse(decode(payload.data)) as SuperJSONResult['json']

    const metaRaw = payload.metadata?.[SUPERJSON_META_KEY]
    if (!metaRaw) {
      return json as T
    }

    const meta = JSON.parse(decode(metaRaw)) as SuperJSONResult['meta']
    return superjson.deserialize({ json, meta })
  }
}

/**
 * A pre-configured composite payload converter that handles:
 * - undefined values (via UndefinedPayloadConverter)
 * - binary data like Uint8Array (via BinaryPayloadConverter)
 * - all other values with SuperJSON support (via SuperJsonPayloadConverter)
 *
 * This is the recommended converter to use for most applications.
 *
 * @example
 * ```ts
 * import { payloadConverter } from '@coloop-ai/temporal-superjson-payload-converter'
 *
 * // Use with Worker.create
 * const worker = await Worker.create({
 *   // ...
 *   dataConverter: {
 *     payloadConverterPath: require.resolve('@coloop-ai/temporal-superjson-payload-converter'),
 *   },
 * })
 * ```
 */
export const payloadConverter = new CompositePayloadConverter(
  new UndefinedPayloadConverter(),
  new BinaryPayloadConverter(),
  new SuperJsonPayloadConverter(),
)
