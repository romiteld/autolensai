/**
 * Perlin Noise Implementation for AutoLensAI
 * Based on Stefan Gustavson's improved Perlin noise algorithm
 * Optimized for real-time 3D lava animation with automotive aesthetics
 */

// Type definitions
type Vec3 = [number, number, number];
type GradientFunction = (hash: number, x: number, y: number, z: number) => number;

/**
 * Permutation table for pseudo-random gradient selection
 */
const PERMUTATION_TABLE: number[] = [
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

/**
 * Perlin Noise Generator Class
 */
class PerlinNoise {
  private perm: number[] = new Array(512);
  private permMod12: number[] = new Array(512);
  
  constructor(seed?: number) {
    this.seed(seed);
  }

  /**
   * Initialize the permutation table with optional seed
   */
  seed(seed?: number): void {
    const p = [...PERMUTATION_TABLE];
    
    // Apply seed-based shuffling if provided
    if (seed !== undefined) {
      // Simple seeded random number generator
      let s = seed;
      const random = (): number => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
      
      // Fisher-Yates shuffle with seeded random
      for (let i = p.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
      }
    }
    
    // Double the permutation table and compute mod 12 values
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  /**
   * 3D Perlin noise function
   * @param x X coordinate
   * @param y Y coordinate
   * @param z Z coordinate
   * @returns Noise value between -1 and 1
   */
  perlin3(x: number, y: number, z: number): number {
    // Find unit cube containing the point
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const zi = Math.floor(z) & 255;
    
    // Find relative position in cube
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);
    
    // Compute fade curves
    const u = fade(xf);
    const v = fade(yf);
    const w = fade(zf);
    
    // Hash coordinates of the 8 cube corners
    const aaa = this.perm[this.perm[this.perm[xi] + yi] + zi];
    const aba = this.perm[this.perm[this.perm[xi] + yi + 1] + zi];
    const aab = this.perm[this.perm[this.perm[xi] + yi] + zi + 1];
    const abb = this.perm[this.perm[this.perm[xi] + yi + 1] + zi + 1];
    const baa = this.perm[this.perm[this.perm[xi + 1] + yi] + zi];
    const bba = this.perm[this.perm[this.perm[xi + 1] + yi + 1] + zi];
    const bab = this.perm[this.perm[this.perm[xi + 1] + yi] + zi + 1];
    const bbb = this.perm[this.perm[this.perm[xi + 1] + yi + 1] + zi + 1];
    
    // Calculate gradient dot products
    const x1 = lerp(
      grad(aaa, xf, yf, zf),
      grad(baa, xf - 1, yf, zf),
      u
    );
    const x2 = lerp(
      grad(aba, xf, yf - 1, zf),
      grad(bba, xf - 1, yf - 1, zf),
      u
    );
    const y1 = lerp(x1, x2, v);
    
    const x3 = lerp(
      grad(aab, xf, yf, zf - 1),
      grad(bab, xf - 1, yf, zf - 1),
      u
    );
    const x4 = lerp(
      grad(abb, xf, yf - 1, zf - 1),
      grad(bbb, xf - 1, yf - 1, zf - 1),
      u
    );
    const y2 = lerp(x3, x4, v);
    
    // Final interpolation
    return lerp(y1, y2, w);
  }
}

/**
 * Fade function for smooth interpolation
 * Uses 6t^5 - 15t^4 + 10t^3 for C2 continuity
 */
function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Linear interpolation between two values
 */
function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

/**
 * Gradient function for 3D Perlin noise
 * Uses 12 gradient directions for better isotropy
 */
function grad(hash: number, x: number, y: number, z: number): number {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

/**
 * Sample layered noise with octaves for complex patterns
 * Optimized for automotive-themed lava animation
 */
function sampleNoise(
  noise: PerlinNoise,
  x: number,
  y: number,
  z: number,
  octaves: number = 16,
  persistence: number = 0.6,
  lacunarity: number = 2.0,
  scale: number = 0.125
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = scale;
  let maxValue = 0;
  
  // Layer multiple octaves for detailed surface
  for (let i = 0; i < octaves; i++) {
    value += noise.perlin3(
      x * frequency,
      y * frequency,
      z * frequency
    ) * amplitude;
    
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }
  
  // Normalize to [-1, 1] range
  return value / maxValue;
}

/**
 * Specialized noise sampler for automotive lava effect
 * Creates flowing, aerodynamic patterns
 */
function automotiveLavaNoise(
  noise: PerlinNoise,
  x: number,
  y: number,
  time: number,
  config?: {
    flowSpeed?: number;
    turbulence?: number;
    smoothness?: number;
  }
): number {
  const {
    flowSpeed = 0.3,
    turbulence = 0.5,
    smoothness = 0.8
  } = config || {};
  
  // Create flowing motion along x-axis (like car aerodynamics)
  const flowX = x + time * flowSpeed;
  
  // Base noise with high octaves for detail
  const baseNoise = sampleNoise(
    noise,
    flowX * smoothness,
    y * smoothness,
    time * 0.1,
    18, // High octave count for premium detail
    0.6,
    2.0,
    0.125
  );
  
  // Add turbulence for dynamic surface
  const turbulenceNoise = sampleNoise(
    noise,
    flowX * 2,
    y * 2,
    time * 0.2,
    8,
    0.4,
    2.5,
    0.25
  ) * turbulence;
  
  // Combine for final effect
  return baseNoise + turbulenceNoise * 0.3;
}

// Create singleton instance
const noise = new PerlinNoise();

// Export types
export type { PerlinNoise, Vec3 };

// Export functions and instance
export {
  noise,
  sampleNoise,
  automotiveLavaNoise,
  fade,
  lerp,
  grad,
  PerlinNoise as PerlinNoiseGenerator
};