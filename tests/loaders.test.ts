import { describe, it, expect, vi } from 'vitest';
import { detectFormat, getLoader } from '../src/loaders/loader-registry';

// Mock the Three.js addon loaders
vi.mock('three/addons/loaders/GLTFLoader.js', () => ({
  GLTFLoader: vi.fn().mockImplementation(() => ({
    load: vi.fn((url, onLoad, onProgress, onError) => {
      onLoad({ scene: { isGroup: true }, animations: [{ name: 'Walk' }] });
    }),
    setDRACOLoader: vi.fn(),
  })),
}));

vi.mock('three/addons/loaders/DRACOLoader.js', () => ({
  DRACOLoader: vi.fn().mockImplementation(() => ({
    setDecoderPath: vi.fn(),
  })),
}));

vi.mock('three/addons/loaders/OBJLoader.js', () => ({
  OBJLoader: vi.fn().mockImplementation(() => ({
    load: vi.fn((url, onLoad) => {
      const group = {
        isGroup: true,
        traverse: vi.fn((cb: any) => cb({ isMesh: false })),
      };
      onLoad(group);
    }),
    setMaterials: vi.fn(),
  })),
}));

vi.mock('three/addons/loaders/MTLLoader.js', () => ({
  MTLLoader: vi.fn().mockImplementation(() => ({
    load: vi.fn((url, onLoad) => {
      onLoad({ preload: vi.fn() });
    }),
  })),
}));

vi.mock('three/addons/loaders/STLLoader.js', () => ({
  STLLoader: vi.fn().mockImplementation(() => ({
    load: vi.fn((url, onLoad) => {
      const { BufferGeometry, Float32BufferAttribute } = require('three');
      const geom = new BufferGeometry();
      // Provide position data so mergeVertices can operate
      geom.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
      onLoad(geom);
    }),
  })),
}));

vi.mock('three/addons/loaders/FBXLoader.js', () => ({
  FBXLoader: vi.fn().mockImplementation(() => ({
    load: vi.fn((url, onLoad) => {
      const { Group } = require('three');
      const group = new Group();
      group.animations = [{ name: 'Idle' }];
      onLoad(group);
    }),
  })),
}));

describe('detectFormat', () => {
  it('detects .glb extension', () => {
    expect(detectFormat('model.glb')).toBe('.glb');
  });

  it('detects .gltf extension', () => {
    expect(detectFormat('path/to/model.gltf')).toBe('.gltf');
  });

  it('detects .obj extension', () => {
    expect(detectFormat('model.obj')).toBe('.obj');
  });

  it('strips query string', () => {
    expect(detectFormat('model.glb?v=123')).toBe('.glb');
  });

  it('strips hash fragment', () => {
    expect(detectFormat('model.glb#section')).toBe('.glb');
  });

  it('handles URL with both query and hash', () => {
    expect(detectFormat('https://example.com/model.gltf?v=1#top')).toBe('.gltf');
  });

  it('returns empty string for no extension', () => {
    expect(detectFormat('https://cdn.example.com/models/12345')).toBe('');
  });

  it('detects .stl extension', () => {
    expect(detectFormat('part.stl')).toBe('.stl');
  });

  it('detects .fbx extension', () => {
    expect(detectFormat('character.fbx')).toBe('.fbx');
  });

  it('is case-insensitive', () => {
    expect(detectFormat('model.GLB')).toBe('.glb');
  });
});

describe('getLoader', () => {
  it('returns GLTF loader for .glb', async () => {
    const loader = await getLoader('model.glb');
    expect(loader).toBeTruthy();
    expect(loader!.extensions).toContain('.glb');
  });

  it('returns GLTF loader for .gltf', async () => {
    const loader = await getLoader('model.gltf');
    expect(loader).toBeTruthy();
    expect(loader!.extensions).toContain('.gltf');
  });

  it('returns OBJ loader for .obj', async () => {
    const loader = await getLoader('model.obj');
    expect(loader).toBeTruthy();
    expect(loader!.extensions).toContain('.obj');
  });

  it('returns default GLTF loader for unknown extension', async () => {
    const loader = await getLoader('https://cdn.com/model');
    expect(loader).toBeTruthy();
    expect(loader!.extensions).toContain('.glb');
  });

  it('returns STL loader for .stl', async () => {
    const loader = await getLoader('part.stl');
    expect(loader).toBeTruthy();
    expect(loader!.extensions).toContain('.stl');
  });

  it('returns FBX loader for .fbx', async () => {
    const loader = await getLoader('character.fbx');
    expect(loader).toBeTruthy();
    expect(loader!.extensions).toContain('.fbx');
  });

  it('returns null for unsupported extension', async () => {
    const loader = await getLoader('model.dwg');
    expect(loader).toBeNull();
  });
});

describe('GLTFFormatLoader', () => {
  it('loads a GLB file and returns model + animations', async () => {
    const loader = (await getLoader('model.glb'))!;
    const result = await loader.load('model.glb', { draco: true });

    expect(result.model).toBeTruthy();
    expect(result.animations).toHaveLength(1);
    expect(result.animations[0].name).toBe('Walk');
  });

  it('configures DRACOLoader when draco enabled', async () => {
    const { DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js');
    const loader = (await getLoader('model.glb'))!;
    await loader.load('model.glb', { draco: true });

    expect(DRACOLoader).toHaveBeenCalled();
  });
});

describe('OBJFormatLoader', () => {
  it('loads an OBJ file', async () => {
    const loader = (await getLoader('model.obj'))!;
    const result = await loader.load('model.obj', {});

    expect(result.model).toBeTruthy();
    expect(result.animations).toHaveLength(0);
  });
});

describe('STLFormatLoader', () => {
  it('loads an STL file and wraps geometry in a Group', async () => {
    const loader = (await getLoader('part.stl'))!;
    const result = await loader.load('part.stl', {});

    expect(result.model).toBeTruthy();
    expect(result.model.isGroup).toBe(true);
    expect(result.animations).toHaveLength(0);
  });
});

describe('FBXFormatLoader', () => {
  it('loads an FBX file and returns model + animations', async () => {
    const loader = (await getLoader('character.fbx'))!;
    const result = await loader.load('character.fbx', {});

    expect(result.model).toBeTruthy();
    expect(result.animations).toHaveLength(1);
    expect(result.animations[0].name).toBe('Idle');
  });
});
