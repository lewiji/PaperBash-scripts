import NetworkPlayer from "../pawn/NetworkPlayer";

export default class UIMesh extends godot.MeshInstance {
  private _camera: godot.Camera;
  async _ready(): Promise<void> {
    this._camera = this.get_viewport().get_camera();

    await godot.yield(this.get_tree(), "idle_frame");
    await godot.yield(this.get_tree(), "idle_frame");

    (this.$("Viewport/Label") as godot.Label).set_text((this.get_parent() as NetworkPlayer).playerName);

    const gui_img = this.$(godot.Viewport).get_texture();
    const material = new godot.SpatialMaterial();
    material.flags_transparent = true;
    material.flags_unshaded = true;
    material.albedo_texture = gui_img;
    this.set_surface_material(0, material);
  }

  _process(): void {
    const cameraPos = this._camera.get_global_transform().origin;
    cameraPos.y = 0;
    this.look_at(cameraPos, godot.Vector3.UP);
    const rot = this.get_rotation_degrees();
    this.set_rotation_degrees(new godot.Vector3(-90, rot.y, rot.z));
  }
}
