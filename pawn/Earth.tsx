import { node } from "../decorators";

export default class Earth extends godot.Spatial {
  @node
  private earthMesh: godot.MeshInstance;
  @node
  private cloudMesh: godot.MeshInstance;
  @node
  private moonMesh: godot.MeshInstance;
  @node
  private moonOrbit: godot.Spatial;
  private newEnergy: number;

  _process(dt: number): void {
    const earthRot = this.earthMesh.get_rotation();
    earthRot.y += 0.01 * dt;
    this.earthMesh.set_rotation(earthRot);

    const cloudRot = this.cloudMesh.get_rotation();
    cloudRot.y += 0.015 * dt;
    this.cloudMesh.set_rotation(cloudRot);

    const moonOrbitRot = this.moonOrbit.get_rotation();
    moonOrbitRot.y += 0.02 * dt;
    moonOrbitRot.x += 0.03 * dt;
    this.moonOrbit.set_rotation(moonOrbitRot);

    const shroomRot = this.moonMesh.get_rotation();
    shroomRot.y += 0.08 * dt;
    this.moonMesh.set_rotation(shroomRot);

    this.rotate(this.get_global_transform().basis.y.normalized(), 0.01 * dt);

    const mat = this.cloudMesh.get_surface_material(0) as godot.SpatialMaterial;

    if (
      this.newEnergy === undefined ||
      godot.stepify(mat.get_emission_energy(), 0.01) === godot.stepify(this.newEnergy, 0.01)
    ) {
      this.newEnergy = Math.min(0.3, godot.fposmod(godot.randf(), 0.6));
    }
    mat.set_emission_energy(godot.lerp(mat.get_emission_energy(), this.newEnergy, 0.005));
  }
}
