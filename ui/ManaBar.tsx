import Player from "../pawn/player/Player";

export default class HPBar extends godot.ColorRect {
  private playerInstance: Player;
  private maxSize: number;
  _ready(): void {
    this.playerInstance = Player._instance;
    this.maxSize = this.get_size().x;
  }

  _process(): void {
    this.set_size(
      new godot.Vector2(
        this.maxSize * (this.playerInstance.currentMana / this.playerInstance.maxMana),
        this.get_size().y,
      ),
    );
  }
}
