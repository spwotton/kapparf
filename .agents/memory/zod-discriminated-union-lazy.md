---
name: Zod discriminatedUnion cannot hold z.lazy members
description: Why a recursive variant in a Zod discriminatedUnion throws "Cannot read properties of undefined (reading 'type')" and how to structure it.
---

# Zod discriminatedUnion + recursive (lazy) members

`z.discriminatedUnion("type", [...members])` inspects each member's `.shape[discriminator]`
**at construction time**. A `z.lazy(() => z.object(...))` (or any non-`ZodObject`) has no
`.shape`, so construction throws a raw `TypeError: Cannot read properties of undefined
(reading 'type')` from deep inside zod (`getDiscriminator`).

**Why it hides:** if the whole union is itself wrapped in `z.lazy`, that TypeError is thrown
the first time the lazy getter runs — i.e. the first time you parse a value that actually
reaches the union (a non-empty array element). `safeParse` does **not** swallow it (it is not
a `ZodError`), so it propagates as a 500. Empty arrays never invoke the element schema, and any
scene built in code and passed straight to the renderer (bypassing the schema) never triggers
it — so presets and empty scenes look fine while every real parse crashes.

**Fix:** make every union member a real `ZodObject`. Put the recursion on the child element,
not the parent:

```ts
const groupLayer = z.object({
  ...baseLayer,
  type: z.literal("group"),
  children: z.array(z.lazy((): z.ZodType<Layer> => layerSchema)), // lazy on the element
});

export const layerSchema: z.ZodType<Layer> = z.discriminatedUnion("type", [
  rectLayer, /* …other ZodObjects… */, groupLayer as unknown as typeof rectLayer,
]) as unknown as z.ZodType<Layer>; // union itself is eager, NOT wrapped in z.lazy
```

**How to apply:** any recursive/self-referential Zod schema that also needs a discriminated
union — keep the union eager and ZodObject-only; defer recursion on the inner array/field via
`z.lazy`. Always smoke-test parse with a NON-EMPTY array of each variant, not just `[]`.
