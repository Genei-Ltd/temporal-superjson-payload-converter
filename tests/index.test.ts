import {
  METADATA_ENCODING_KEY,
  defaultPayloadConverter,
} from '@temporalio/common'
import { describe, expect, it } from 'vitest'
import { decode, encode } from '../src/encoding'
import {
  SUPERJSON_META_KEY,
  SuperJsonPayloadConverter,
  payloadConverter,
} from '../src/index'

describe('SuperJsonPayloadConverter', () => {
  const converter = new SuperJsonPayloadConverter()

  describe('serialization', () => {
    it('produces json/plain encoding', () => {
      const payload = converter.toPayload({ name: 'test' })

      expect(payload).toBeDefined()
      expect(payload!.metadata).toBeDefined()
      const encodingKey = payload!.metadata![METADATA_ENCODING_KEY]
      expect(encodingKey).toBeDefined()
      expect(decode(encodingKey)).toBe('json/plain')
    })

    it('does not add superjson-meta for plain JSON values', () => {
      const payload = converter.toPayload({ name: 'test', count: 42 })

      expect(payload).toBeDefined()
      expect(payload!.metadata![SUPERJSON_META_KEY]).toBeUndefined()
    })

    it('adds superjson-meta when needed for Date', () => {
      const payload = converter.toPayload({ createdAt: new Date('2024-01-01') })

      expect(payload).toBeDefined()
      expect(payload!.metadata![SUPERJSON_META_KEY]).toBeDefined()
    })

    it('adds superjson-meta when needed for Map', () => {
      const payload = converter.toPayload({
        items: new Map([['key', 'value']]),
      })

      expect(payload).toBeDefined()
      expect(payload!.metadata![SUPERJSON_META_KEY]).toBeDefined()
    })

    it('adds superjson-meta when needed for Set', () => {
      const payload = converter.toPayload({ tags: new Set(['a', 'b', 'c']) })

      expect(payload).toBeDefined()
      expect(payload!.metadata![SUPERJSON_META_KEY]).toBeDefined()
    })

    it('adds superjson-meta when needed for BigInt', () => {
      const payload = converter.toPayload({
        bigNumber: BigInt(9007199254740991),
      })

      expect(payload).toBeDefined()
      expect(payload!.metadata![SUPERJSON_META_KEY]).toBeDefined()
    })

    it('returns undefined for undefined value', () => {
      const payload = converter.toPayload(undefined)

      expect(payload).toBeUndefined()
    })
  })

  describe('deserialization', () => {
    it('restores Date when metadata is present', () => {
      const original = { createdAt: new Date('2024-01-01T00:00:00.000Z') }
      const payload = converter.toPayload(original)
      const restored = converter.fromPayload<typeof original>(payload!)

      expect(restored.createdAt).toBeInstanceOf(Date)
      expect(restored.createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z')
    })

    it('restores Map when metadata is present', () => {
      const original = {
        items: new Map([
          ['key1', 'value1'],
          ['key2', 'value2'],
        ]),
      }
      const payload = converter.toPayload(original)
      const restored = converter.fromPayload<typeof original>(payload!)

      expect(restored.items).toBeInstanceOf(Map)
      expect(restored.items.get('key1')).toBe('value1')
      expect(restored.items.get('key2')).toBe('value2')
    })

    it('restores Set when metadata is present', () => {
      const original = { tags: new Set(['a', 'b', 'c']) }
      const payload = converter.toPayload(original)
      const restored = converter.fromPayload<typeof original>(payload!)

      expect(restored.tags).toBeInstanceOf(Set)
      expect(restored.tags.has('a')).toBe(true)
      expect(restored.tags.has('b')).toBe(true)
      expect(restored.tags.has('c')).toBe(true)
    })

    it('restores BigInt when metadata is present', () => {
      const original = { bigNumber: BigInt('9007199254740991') }
      const payload = converter.toPayload(original)
      const restored = converter.fromPayload<typeof original>(payload!)

      expect(typeof restored.bigNumber).toBe('bigint')
      expect(restored.bigNumber).toBe(BigInt('9007199254740991'))
    })

    it('returns plain JSON when metadata is absent', () => {
      const payload = {
        metadata: {
          [METADATA_ENCODING_KEY]: encode('json/plain'),
        },
        data: encode(JSON.stringify({ name: 'test', count: 42 })),
      }

      const result = converter.fromPayload<{ name: string; count: number }>(
        payload,
      )

      expect(result).toEqual({ name: 'test', count: 42 })
    })

    it('throws ValueError when payload data is missing', () => {
      const payload = {
        metadata: {
          [METADATA_ENCODING_KEY]: encode('json/plain'),
        },
      }

      expect(() => converter.fromPayload(payload)).toThrow(
        'Payload data is missing',
      )
    })
  })

  describe('round-trip', () => {
    it('Date survives serialization', () => {
      const original = new Date('2024-06-15T12:30:00.000Z')
      const payload = converter.toPayload(original)
      const restored = converter.fromPayload<Date>(payload!)

      expect(restored).toBeInstanceOf(Date)
      expect(restored.toISOString()).toBe(original.toISOString())
    })

    it('Map survives serialization', () => {
      const original = new Map<string, number>([
        ['one', 1],
        ['two', 2],
        ['three', 3],
      ])
      const payload = converter.toPayload(original)
      const restored = converter.fromPayload<Map<string, number>>(payload!)

      expect(restored).toBeInstanceOf(Map)
      expect(restored.size).toBe(3)
      expect(restored.get('one')).toBe(1)
      expect(restored.get('two')).toBe(2)
      expect(restored.get('three')).toBe(3)
    })

    it('Set survives serialization', () => {
      const original = new Set([1, 2, 3, 4, 5])
      const payload = converter.toPayload(original)
      const restored = converter.fromPayload<Set<number>>(payload!)

      expect(restored).toBeInstanceOf(Set)
      expect(restored.size).toBe(5)
      expect([...restored]).toEqual([1, 2, 3, 4, 5])
    })

    it('BigInt survives serialization', () => {
      const original = BigInt('123456789012345678901234567890')
      const payload = converter.toPayload(original)
      const restored = converter.fromPayload<bigint>(payload!)

      expect(typeof restored).toBe('bigint')
      expect(restored).toBe(original)
    })

    it('complex nested structure survives serialization', () => {
      const original = {
        id: 'test-123',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        metadata: new Map<string, unknown>([
          ['tags', new Set(['important', 'urgent'])],
          ['count', BigInt(42)],
        ]),
        nested: {
          date: new Date('2024-06-15T12:00:00.000Z'),
        },
      }

      const payload = converter.toPayload(original)
      const restored = converter.fromPayload<typeof original>(payload!)

      expect(restored.id).toBe('test-123')
      expect(restored.createdAt).toBeInstanceOf(Date)
      expect(restored.createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z')
      expect(restored.metadata).toBeInstanceOf(Map)
      expect(restored.metadata.get('tags')).toBeInstanceOf(Set)
      expect(
        (restored.metadata.get('tags') as Set<string>).has('important'),
      ).toBe(true)
      expect(typeof restored.metadata.get('count')).toBe('bigint')
      expect(restored.nested.date).toBeInstanceOf(Date)
    })
  })

  describe('backwards compatibility', () => {
    it('deserializes legacy payloads without superjson-meta correctly', () => {
      const legacyPayload = {
        metadata: {
          [METADATA_ENCODING_KEY]: encode('json/plain'),
        },
        data: encode(
          JSON.stringify({
            name: 'legacy',
            value: 123,
            nested: { foo: 'bar' },
          }),
        ),
      }

      const result = converter.fromPayload<{
        name: string
        value: number
        nested: { foo: string }
      }>(legacyPayload)

      expect(result).toEqual({
        name: 'legacy',
        value: 123,
        nested: { foo: 'bar' },
      })
    })

    it('deserializes legacy array payloads correctly', () => {
      const legacyPayload = {
        metadata: {
          [METADATA_ENCODING_KEY]: encode('json/plain'),
        },
        data: encode(JSON.stringify([1, 2, 3, 'four', 'five'])),
      }

      const result = converter.fromPayload<(number | string)[]>(legacyPayload)

      expect(result).toEqual([1, 2, 3, 'four', 'five'])
    })

    it('deserializes legacy primitive payloads correctly', () => {
      const stringPayload = {
        metadata: { [METADATA_ENCODING_KEY]: encode('json/plain') },
        data: encode(JSON.stringify('hello')),
      }
      const numberPayload = {
        metadata: { [METADATA_ENCODING_KEY]: encode('json/plain') },
        data: encode(JSON.stringify(42)),
      }
      const boolPayload = {
        metadata: { [METADATA_ENCODING_KEY]: encode('json/plain') },
        data: encode(JSON.stringify(true)),
      }
      const nullPayload = {
        metadata: { [METADATA_ENCODING_KEY]: encode('json/plain') },
        data: encode(JSON.stringify(null)),
      }

      expect(converter.fromPayload<string>(stringPayload)).toBe('hello')
      expect(converter.fromPayload<number>(numberPayload)).toBe(42)
      expect(converter.fromPayload<boolean>(boolPayload)).toBe(true)
      expect(converter.fromPayload<null>(nullPayload)).toBe(null)
    })

    it('old workers can deserialize new payloads as plain JSON (graceful degradation)', () => {
      const newPayload = converter.toPayload({
        createdAt: new Date('2024-01-01'),
      })

      expect(newPayload).toBeDefined()
      expect(newPayload!.data).toBeDefined()

      const oldWorkerResult = defaultPayloadConverter.fromPayload<
        Record<string, unknown>
      >(newPayload!)

      expect(typeof oldWorkerResult.createdAt).toBe('string')
      expect(oldWorkerResult.createdAt).toBe('2024-01-01T00:00:00.000Z')
    })
  })
})

describe('payloadConverter (composite)', () => {
  it('handles undefined values', () => {
    const payload = payloadConverter.toPayload(undefined)
    expect(payload).toBeDefined()

    const restored = payloadConverter.fromPayload(payload)
    expect(restored).toBeUndefined()
  })

  it('handles binary data (Uint8Array)', () => {
    const original = new Uint8Array([1, 2, 3, 4, 5])
    const payload = payloadConverter.toPayload(original)
    expect(payload).toBeDefined()

    const restored = payloadConverter.fromPayload<Uint8Array>(payload)
    expect(restored).toBeInstanceOf(Uint8Array)
    expect([...restored]).toEqual([1, 2, 3, 4, 5])
  })

  it('handles complex types via SuperJson', () => {
    const original = {
      date: new Date('2024-01-01'),
      map: new Map([['key', 'value']]),
    }
    const payload = payloadConverter.toPayload(original)
    expect(payload).toBeDefined()

    const restored = payloadConverter.fromPayload<typeof original>(payload)
    expect(restored.date).toBeInstanceOf(Date)
    expect(restored.map).toBeInstanceOf(Map)
  })
})
