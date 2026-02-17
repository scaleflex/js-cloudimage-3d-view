import { describe, it, expect, vi } from 'vitest';
import { Mesh, BoxGeometry, MeshStandardMaterial, Group, Texture } from 'three';
import { disposeObject3D } from '../src/utils/dispose';

describe('disposeObject3D', () => {
  it('disposes geometry and material', () => {
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshStandardMaterial();
    const mesh = new Mesh(geometry, material);

    const geoDispose = vi.spyOn(geometry, 'dispose');
    const matDispose = vi.spyOn(material, 'dispose');

    disposeObject3D(mesh);

    expect(geoDispose).toHaveBeenCalled();
    expect(matDispose).toHaveBeenCalled();
  });

  it('disposes textures on material', () => {
    const texture = new Texture();
    const texDispose = vi.spyOn(texture, 'dispose');
    const material = new MeshStandardMaterial({ map: texture });
    const mesh = new Mesh(new BoxGeometry(1, 1, 1), material);

    disposeObject3D(mesh);

    expect(texDispose).toHaveBeenCalled();
  });

  it('handles material arrays', () => {
    const mat1 = new MeshStandardMaterial();
    const mat2 = new MeshStandardMaterial();
    const spy1 = vi.spyOn(mat1, 'dispose');
    const spy2 = vi.spyOn(mat2, 'dispose');

    const mesh = new Mesh(new BoxGeometry(1, 1, 1), [mat1, mat2]);
    disposeObject3D(mesh);

    expect(spy1).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();
  });

  it('traverses children in a group', () => {
    const group = new Group();
    const geo = new BoxGeometry(1, 1, 1);
    const mat = new MeshStandardMaterial();
    const mesh = new Mesh(geo, mat);
    group.add(mesh);

    const geoDispose = vi.spyOn(geo, 'dispose');
    const matDispose = vi.spyOn(mat, 'dispose');

    disposeObject3D(group);

    expect(geoDispose).toHaveBeenCalled();
    expect(matDispose).toHaveBeenCalled();
  });
});
