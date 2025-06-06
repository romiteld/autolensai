# Procedural Lava Mesh Animation Component

This component implements the exact procedural mesh animation specified in the requirements for AutoLensAI's hero section.

## Component Overview

### `MeshAnim`
The core component that creates a 100x100 vertex grid mesh with:
- **Dynamic z-coordinate calculation** using actual Perlin noise from `@/common/utils/noise`
- **Real-time vertex position and color updates** with `useFrame`
- **BufferGeometry** with position, color, normal, and index attributes
- **Proper triangle generation** for mesh surfaces

### `ProceduralLavaBackground`
A wrapper component that sets up the Three.js Canvas and lighting for the hero section.

## Implementation Details

### Grid Configuration
```typescript
grid: { width: 100, height: 100, sep: 0.2 }
```
- Creates a 100x100 vertex grid as specified
- Separation of 0.2 units between vertices
- Total of 10,000 vertices with 19,602 triangles

### Rotation
```typescript
rotation: [-Math.PI / 2, 0, 0]
```
- Makes Z-axis upward as required
- Positions the mesh as a horizontal plane

### Animation
```typescript
anim: { init: 0, update: (t) => t + 0.002 }
```
- Time increment of 0.002 for smooth motion
- Uses `useRef` for animation time tracking

### Noise Functions

#### `zOfFXYT(x, y, t)`
- Uses `automotiveLavaNoise` from the existing noise utility
- Combines three layers of noise for complex terrain:
  - Primary displacement with flow speed 0.3
  - Secondary displacement with different parameters
  - Detail noise for fine variations

#### `colorOfFXYZT(x, y, z, t)`
- Dynamic automotive-inspired lava color palette
- Colors based on height and noise variations
- Temperature-based color shifts for realism

### Buffer Management
- **useMemo** for vertex buffers and index buffers
- **useRef** for animation time, position, and color buffer attributes
- **needsUpdate = true** on buffer attributes for real-time updates

## Usage

### Basic Usage
```tsx
import { MeshAnim } from '@/common/components/animations/procedural-lava';

// Inside a Canvas component
<MeshAnim />
```

### Hero Section Integration
```tsx
import { ProceduralLavaBackground } from '@/common/components/animations/procedural-lava';

// Replace the current AnimationCanvas with:
<ProceduralLavaBackground 
  className="opacity-40" 
  intensity="medium" 
  showMultipleLayers={true} 
/>
```

### Custom Configuration
```tsx
<MeshAnim
  position={[0, -3, 0]}
  rotation={[-Math.PI / 2, 0, 0]}
  grid={{ width: 150, height: 150, sep: 0.15 }}
  zOfFXYT={(x, y, t) => {
    // Custom displacement function
    return automotiveLavaNoise(noise, x, y, t) * 5;
  }}
  colorOfFXYZT={(x, y, z, t) => {
    // Custom color function
    return { r: 1, g: 0.5, b: 0 };
  }}
  anim={{ init: 0, update: (t) => t + 0.001 }}
/>
```

## Performance Configurations

### Intensity Levels
- **Low**: 50x50 grid (2,500 vertices)
- **Medium**: 100x100 grid (10,000 vertices) - Default
- **High**: 150x150 grid (22,500 vertices)

### Multiple Layers
- `showMultipleLayers={false}` - Single mesh for better performance
- `showMultipleLayers={true}` - Three layered meshes for depth

## Technical Features

### Proper 3D Mesh
- True BufferGeometry with deforming vertices
- Not a particle system - actual connected triangulated surface
- Proper normal calculation for realistic lighting
- Double-sided rendering for visibility from all angles

### Advanced Noise Integration
- Uses the existing sophisticated Perlin noise system
- Automotive-themed flow patterns
- Multiple octaves for complex surface detail
- Turbulence and smoothness controls

### Real-time Animation
- 60fps target with automatic performance scaling
- Hardware-accelerated Three.js rendering
- Efficient buffer updates only when needed
- Memory-optimized vertex calculations

## Integration with Existing System

The component integrates seamlessly with AutoLensAI's existing architecture:
- Uses the established noise utility (`@/common/utils/noise`)
- Follows the same export pattern as other animation components
- Compatible with the existing Canvas setup in `3d-effects.tsx`
- Maintains the automotive design theme

## Exports

```typescript
export { ProceduralLava, ProceduralLavaBackground, MeshAnim } from './procedural-lava';
```

All components are available through the main animations index file.