/// <reference types="vite/client" />

// Ensure this file is treated as a module so the 'three' block below is a true
// module augmentation (not an ambient module declaration that overrides Three's typings).
import 'three';

declare module 'three-mesh-bvh' {
  import * as THREE from 'three';

  export class MeshBVH {
    constructor(geometry: THREE.BufferGeometry, options?: unknown);
  }

  export class MeshBVHVisualizer extends THREE.Mesh {
    constructor(mesh: THREE.Mesh, depth?: number);
  }

  export const acceleratedRaycast: (
    raycaster: THREE.Raycaster,
    intersects: THREE.Intersection[]
  ) => void;

  export const computeBoundsTree: (options?: unknown) => unknown;
  export const disposeBoundsTree: () => void;
}

declare module 'three' {
  interface BufferGeometry {
    computeBoundsTree(options?: unknown): unknown;
    disposeBoundsTree(): void;
    boundsTree?: unknown;
  }
}
