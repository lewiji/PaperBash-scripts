//@ts-ignore
import Body_one from "res://resources/bodies/Body1_mat.tres";
//@ts-ignore
import Body_two from "res://resources/bodies/Body2_mat.tres";
//@ts-ignore
import Batboy from "res://resources/enemies/batboy_shader.tres";
//@ts-ignore
import Beholda from "res://resources/enemies/beholda_shader.tres";
//@ts-ignore
import Queen from "res://resources/enemies/queen_shader.tres";
//@ts-ignore
import Weirdo from "res://resources/enemies/weirdo_shader.tres";

//@ts-ignore
import Explosions from "res://scenes/Explosions.tscn";
//@ts-ignore
import Attack from "res://scenes/Attack.tscn";
//@ts-ignore
import FireAttack from "res://scenes/FireAttack.tscn";

const mats = [Body_one, Body_two, Batboy, Beholda, Queen, Weirdo];
const scenes = [Explosions, FireAttack, Attack];

export default class MaterialCache extends godot.Spatial {
  _ready(): void {
    this.translate(new godot.Vector3(0, 2, 0));
    mats.forEach((mat) => {
      const mesh_instance = new godot.MeshInstance();
      mesh_instance.set_mesh(new godot.QuadMesh());
      mesh_instance.set_material_override(mat);
      (mesh_instance.get_mesh() as godot.QuadMesh).set_size(new godot.Vector2(0.001, 0.001));
      this.add_child(mesh_instance);
    });

    scenes.forEach((scene) => {
      const packed_scene = scene as godot.PackedScene;
      const scene_instance = packed_scene.instance();
      this.add_child(scene_instance);
      scene_instance.set_process(false);
      scene_instance.set_physics_process(false);
      const light = scene_instance.get_node(godot.Light);
      if (light) {
        light.queue_free();
      }
    });

    this.set_scale(new godot.Vector3(0.001, 0.001, 0.001));
  }
}
