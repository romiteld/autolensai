/**
 * Perlin Noise Implementation
 * Based on Stefan Gustavson's implementation
 * Used for realistic 3D lava surface deformation
 */

// Permutation table - 256 random values repeated for overflow handling
const permutation = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
  140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
  247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
  57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
  74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
  60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
  65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
  200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
  52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
  207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
  119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
  129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
  218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
  81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
  184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
  222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
];

// Double the permutation table to avoid overflow
const p: number[] = new Array(512);
const perm: number[] = new Array(512);

// Initialize permutation arrays
for (let i = 0; i < 256; i++) {
  p[i] = permutation[i];
  p[256 + i] = permutation[i];
  perm[i] = permutation[i];
  perm[256 + i] = permutation[i];
}

// Noise object with exact implementation as specified
export const noise = {
  /**
   * Seed the noise function with a new random seed
   * @param seed - Random seed value
   */
  seed: function(seed: number): void {
    if (seed > 0 && seed < 1) {
      // Scale the seed out of the [0,1] range
      seed *= 65536;
    }

    seed = Math.floor(seed);
    if (seed < 256) {
      seed |= seed << 8;
    }

    // Shuffle the permutation table based on seed
    for (let i = 0; i < 256; i++) {
      let v: number;
      if (i & 1) {
        v = p[i] ^ (seed & 255);
      } else {
        v = p[i] ^ ((seed >> 8) & 255);
      }

      perm[i] = perm[i + 256] = v;
    }
  },

  /**
   * 3D Perlin noise function
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param z - Z coordinate
   * @returns Noise value between -1 and 1
   */
  perlin3: function(x: number, y: number, z: number): number {
    // Find unit cube that contains point
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    // Find relative x, y, z of point in cube
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    // Compute fade curves for each of x, y, z
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    // Hash coordinates of the 8 cube corners
    const A = perm[X] + Y;
    const AA = perm[A] + Z;
    const AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y;
    const BA = perm[B] + Z;
    const BB = perm[B + 1] + Z;

    // And add blended results from 8 corners of cube
    return this.lerp(w, 
      this.lerp(v, 
        this.lerp(u, 
          this.grad(perm[AA], x, y, z),
          this.grad(perm[BA], x - 1, y, z)
        ),
        this.lerp(u, 
          this.grad(perm[AB], x, y - 1, z),
          this.grad(perm[BB], x - 1, y - 1, z)
        )
      ),
      this.lerp(v, 
        this.lerp(u, 
          this.grad(perm[AA + 1], x, y, z - 1),
          this.grad(perm[BA + 1], x - 1, y, z - 1)
        ),
        this.lerp(u, 
          this.grad(perm[AB + 1], x, y - 1, z - 1),
          this.grad(perm[BB + 1], x - 1, y - 1, z - 1)
        )
      )
    );
  },

  /**
   * Fade function as specified: t * t * t * (t * (t * 6 - 15) + 10)
   * @param t - Input value
   * @returns Faded value
   */
  fade: function(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  },

  /**
   * Linear interpolation between two values
   * @param t - Interpolation factor (0-1)
   * @param a - Start value
   * @param b - End value
   * @returns Interpolated value
   */
  lerp: function(t: number, a: number, b: number): number {
    return a + t * (b - a);
  },

  /**
   * Calculate gradient based on hash value
   * @param hash - Hash value
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param z - Z coordinate
   * @returns Gradient value
   */
  grad: function(hash: number, x: number, y: number, z: number): number {
    // Convert low 4 bits of hash code into 12 gradient directions
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
};

/**
 * Layered noise function for complex terrain-like lava surface
 * Uses multiple octaves of Perlin noise for realistic deformation
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param z - Z coordinate
 * @returns Combined noise value
 */
export const sampleNoise = (x: number, y: number, z: number): number => {
  // Configuration as specified in requirements
  const octaves = 20;
  const persistence = 0.6;
  const lacunarity = 2;
  const scale = 1 / 8;

  let total = 0;
  let amplitude = 1;
  let frequency = scale;
  let maxValue = 0; // Used for normalizing result

  // Generate multiple layers of noise
  for (let i = 0; i < octaves; i++) {
    total += noise.perlin3(
      x * frequency,
      y * frequency,
      z * frequency
    ) * amplitude;

    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  // Normalize the result to [-1, 1] range
  return total / maxValue;
};

// Type definitions for better TypeScript support
export interface NoiseInterface {
  seed: (seed: number) => void;
  perlin3: (x: number, y: number, z: number) => number;
  fade: (t: number) => number;
  lerp: (t: number, a: number, b: number) => number;
  grad: (hash: number, x: number, y: number, z: number) => number;
}

export type SampleNoiseFunction = (x: number, y: number, z: number) => number;

// Initialize with a default seed
noise.seed(Math.random());