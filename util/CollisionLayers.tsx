class LayerData {
  public static layerNames3D = {};
}

export default function get3DCollisionLayers(): Record<string, number> {
  if (Object.keys(LayerData.layerNames3D).length === 0) {
    for (let i = 0; i < 20; i++) {
      const name = godot.ProjectSettings.get_setting(`layer_names/3d_physics/layer_${i + 1}`);
      if (name !== "") {
        LayerData.layerNames3D[name] = i;
      }
    }
    Object.freeze(LayerData.layerNames3D);
  }
  return LayerData.layerNames3D;
}
