export default class TouchControls extends godot.Container {
  _ready(): void {
    if (!godot.OS.has_touchscreen_ui_hint()) {
      this.queue_free();
    }
  }
}
