import Player from "../pawn/player/Player";

export default class FireButton extends godot.TouchScreenButton {
  private firing: boolean;
  _ready() {
    this.connect("pressed", () => {
      if (!this.firing) {
        this.firing = true;
        if (Player._instance.is_network_master()) {
          Player._instance.rpc("invokeAttackCommand");
        }
      }
    });

    this.connect("released", () => {
      this.firing = false;
    });
  }
}
