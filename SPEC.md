# Encoding Structure

## Dimensions

We need to work with the dimensions in some order because multi-dimensional
arrays are nested.

We work with the dimensions in this order, bottom to top:

1. Length (bottom, most nested, most inner)
2. Height
3. Width (top, least nested, most outer)

This way it makes most sense to parse visually e.g.

```ts
const someStructure = [
  [
    // section 1
    [module1, module2, module3], // level 1
    [module4, module5, module6], // level 2
  ],
  [
    // section 2
    [module7, module8, module9], // level 1
  ],
]
```

This would be a house with two sections, a one-storey and a two-storey.

## Containers

There are container boxes...

These can be filled, like a dot-matrix

Then side-by-sided to compare if they fit together or not

Containers should be placed in adjacency/overlap such that module matrices fill
out in a complementary way.

### Example

`[0,0,1]` can fit with `[1,1,0]` to make `[1,1,1]`

A "module" becomes a container for "blocks"

## Modules vs. Blocks

Our data models would need re-arranging

### Blocks

- Much like legacy modules
- Dimensions

### Modules

- Containers for blocks
- Tags e.g. stairs, openings, layout, use etc
- Maybe an indexed block list and a JSON 3D array of those indices?

# Exercise

## Part One: Get some blocks

1. Call blocks from their Airtable via tRPC API route
2. Get the dimensions
3. Draw as box for now
4. Interaction to add blocks to scene from list

```ts
type BlockPos = {
  z: [number, number] // [min,max]
  y: [number, number]
  x: [number, number]
}
```

## Part Two: Play with them

1. First one starts at 0,0,0.
2. There is a base unit.
3. `BlockPos` max's computed from dimensions divided by base unit (min's 0's).
4. Must store collective min, max on each dimension (to know where we can go)
5. Also track dead space to fill out our final module box

# Insights

- Module configurator? You're configuring dot matrices of blocks
- Should we 3D array or should we `[x,y,z]` or `{ x, y, z }`?
  - Three.js doesn't 3D array
  - Either way it's a kind of grid system
  - `{ z, y, x }` is perhaps the easiest mental model
- Ah, it might actually be `{ z: [min,max], y: [min,max], x: [min,max]}`
- Perhaps x, y and z are arbitrary and can be rotate-shifted (so x is y, y is z,
  z is x)?
- It's all about https://threejs.org/docs/#api/en/math/Box3
