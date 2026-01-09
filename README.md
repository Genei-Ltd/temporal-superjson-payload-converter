# @coloop-ai/temporal-superjson-payload-converter

[![npm version](https://img.shields.io/npm/v/@coloop-ai/temporal-superjson-payload-converter.svg)](https://www.npmjs.com/package/@coloop-ai/temporal-superjson-payload-converter)
[![npm downloads](https://img.shields.io/npm/dm/@coloop-ai/temporal-superjson-payload-converter.svg)](https://www.npmjs.com/package/@coloop-ai/temporal-superjson-payload-converter)
[![License: MIT](https://img.shields.io/npm/l/@coloop-ai/temporal-superjson-payload-converter.svg)](https://github.com/Genei-Ltd/temporal-superjson-payload-converter/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)

A [SuperJSON](https://github.com/blitz-js/superjson)-based payload converter for [Temporal](https://temporal.io) workflows. Properly serialize and deserialize complex JavaScript types that standard JSON cannot handle.

## Why?

Temporal's default JSON payload converter cannot handle many common JavaScript types:

- `Date` objects become strings
- `Map` and `Set` become empty objects `{}`
- `BigInt` throws an error
- `RegExp` becomes empty objects `{}`

This package solves these problems by using SuperJSON, which stores type information in the payload metadata and restores the original types during deserialization.

## Supported types

- `Date`
- `Map`
- `Set`
- `BigInt`
- `RegExp`
- `undefined`
- `Error` (and subclasses)
- `URL`
- Typed arrays (`Int8Array`, `Uint8Array`, etc.)
- And [more](https://github.com/blitz-js/superjson#superjson)

## Installation

```bash
npm install @coloop-ai/temporal-superjson-payload-converter
```

## Quick start

The payload converter must be configured in **all** of these places:

1. Worker creation
2. Client creation
3. Workflow bundling (if using `bundleWorkflowCode`)
4. Test environments

### Worker setup

```ts
import { Worker } from '@temporalio/worker'

const worker = await Worker.create({
  // ... other options
  dataConverter: {
    payloadConverterPath:
      require.resolve('@coloop-ai/temporal-superjson-payload-converter'),
  },
})
```

### Client setup

```ts
import { Client } from '@temporalio/client'

const client = new Client({
  connection,
  namespace: 'your-namespace',
  dataConverter: {
    payloadConverterPath:
      require.resolve('@coloop-ai/temporal-superjson-payload-converter'),
  },
})
```

### Workflow bundling

```ts
import { bundleWorkflowCode } from '@temporalio/worker'

const workflowBundle = await bundleWorkflowCode({
  workflowsPath: require.resolve('./workflows'),
  payloadConverterPath:
    require.resolve('@coloop-ai/temporal-superjson-payload-converter'),
})
```

### Test environments

```ts
import { TestWorkflowEnvironment } from '@temporalio/testing'

const env = await TestWorkflowEnvironment.createTimeSkipping({
  client: {
    dataConverter: {
      payloadConverterPath:
        require.resolve('@coloop-ai/temporal-superjson-payload-converter'),
    },
  },
})
```

## ESM projects

In ESM projects, use `createRequire` to get access to `require.resolve`:

```ts
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const worker = await Worker.create({
  // ... other options
  dataConverter: {
    payloadConverterPath:
      require.resolve('@coloop-ai/temporal-superjson-payload-converter'),
  },
})
```

## Example

Once configured, complex types just work:

```ts
// workflow.ts
import { proxyActivities } from '@temporalio/workflow'

const activities = proxyActivities({
  startToCloseTimeout: '10 seconds',
})

export async function myWorkflow(input: {
  createdAt: Date
  tags: Set<string>
  metadata: Map<string, unknown>
}) {
  // input.createdAt is a Date instance
  // input.tags is a Set instance
  // input.metadata is a Map instance
  console.log(input.createdAt.toISOString())
  console.log(input.tags.has('important'))
  console.log(input.metadata.get('key'))
}
```

```ts
// client.ts
await client.workflow.start('myWorkflow', {
  taskQueue: 'my-queue',
  workflowId: 'my-workflow-id',
  args: [
    {
      createdAt: new Date(),
      tags: new Set(['important', 'urgent']),
      metadata: new Map([['key', 'value']]),
    },
  ],
})
```

## Backwards compatibility

This converter is backwards-compatible with payloads created by the default JSON converter. It can deserialize both:

- Legacy payloads without SuperJSON metadata (treated as plain JSON)
- New payloads with SuperJSON metadata (full type restoration)

**Note:** Old workers using the default converter can still read new payloads, but complex types will be degraded (e.g., `Date` becomes an ISO string, `Map` becomes an array of entries).

## API

### `payloadConverter`

A pre-configured composite converter that handles:

- `undefined` values
- Binary data (`Uint8Array`)
- All other values with SuperJSON support

This is the default export and is what gets used when you specify `payloadConverterPath`.

### `SuperJsonPayloadConverter`

The underlying SuperJSON converter class. You can use this directly if you need to compose your own converter:

```ts
import {
  CompositePayloadConverter,
  UndefinedPayloadConverter,
} from '@temporalio/common'
import { SuperJsonPayloadConverter } from '@coloop-ai/temporal-superjson-payload-converter'

export const payloadConverter = new CompositePayloadConverter(
  new UndefinedPayloadConverter(),
  // Add your custom converters here
  new SuperJsonPayloadConverter(),
)
```

### `SUPERJSON_META_KEY`

The metadata key (`'superjson-meta'`) used to store type information. Exported for advanced use cases.

## Scripts

- `npm run build` - Build the package
- `npm run tc` - Type-check without emitting
- `npm run lint` - Run ESLint
- `npm run test` - Run tests with Vitest
- `npm run format` - Check formatting with Prettier

## License

MIT License. See [LICENSE](./LICENSE) for details.
