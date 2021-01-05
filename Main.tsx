export default class Main extends godot.Spatial {
  _input(e): void {
    if (godot.Engine.editor_hint) {
      return;
    }
    if (e instanceof godot.InputEventKey) {
      if (e.get_scancode() === godot.KEY_M && e.pressed) {
        if (godot.Input.get_mouse_mode() === godot.Input.MOUSE_MODE_CAPTURED) {
          godot.Input.set_mouse_mode(godot.Input.MOUSE_MODE_VISIBLE);
        } else {
          godot.Input.set_mouse_mode(godot.Input.MOUSE_MODE_CAPTURED);
        }
      }
    }
  }

  _ready(): void {
    return;
  }
}
