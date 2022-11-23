export const defaultDimensions = {
  width: 3,
  length: 1,
  height: 3,
}

export const getInitialTransforms = (flip: boolean) => {
  return {
    position: {
      x: 0,
      y: defaultDimensions.height / 2,
      z: flip ? defaultDimensions.length / 2 : -defaultDimensions.length / 2,
    },
    rotation: {
      x: 0,
      y: 0,
      z: 0,
    },
    scale: {
      x: 1,
      y: 1,
      z: flip ? -1 : 1,
    },
  }
}
