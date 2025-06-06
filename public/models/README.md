# 3D Models Directory

This directory contains 3D models for the AutoLensAI platform.

## Directory Structure

```
public/models/
├── cars/
│   ├── sedans/       # Sedan car models
│   ├── suvs/         # SUV and crossover models
│   ├── sports/       # Sports car models
│   ├── luxury/       # Luxury vehicle models
│   └── electric/     # Electric vehicle models
└── README.md
```

## Supported Formats

### Recommended Formats (Best Performance)
1. **GLB/GLTF** (preferred)
   - `.glb` - Binary GLTF (single file, faster loading)
   - `.gltf` - Text-based GLTF with separate assets
   - Best compression and web optimization
   - Supports PBR materials, animations, textures

### Alternative Formats
2. **FBX** - `.fbx`
   - Industry standard, good detail
   - Larger file sizes
   - Requires conversion for optimal web use

3. **OBJ** - `.obj` (with `.mtl` material file)
   - Simple format, widely supported
   - No animation support
   - Requires separate texture files

### Not Recommended for Web
- **STL** - Too basic, no materials/textures
- **3DS** - Outdated format
- **BLEND** - Blender native, not web-optimized

## File Size Guidelines

- **Target**: Under 5MB per model
- **Maximum**: 10MB per model
- **Textures**: 1024x1024 or 2048x2048 max
- **Polygons**: 10k-50k triangles (depends on detail needed)

## Naming Convention

Use descriptive names with vehicle details:
```
{brand}_{model}_{year}_{variant}.{extension}

Examples:
- tesla_model_3_2023_standard.glb
- bmw_x5_2024_msport.glb
- ford_mustang_2023_gt.glb
```

## Integration

Models placed here will be automatically available at:
`/models/cars/{category}/{filename}`

The 3D components in the app will load these models for:
- Hero section background animations
- Interactive car showcases
- Vehicle detail pages
- 360° viewers