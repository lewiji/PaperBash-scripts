import Entity from "../pawn/Entity";
import { Command } from "./Command";

export default class AttackCommand extends Command {
  private data;
  constructor(receiver: godot.Node, data = {}) {
    super(receiver);
    this.data = data;
  }

  public execute(): void {
    if (this.receiver) {
      this.receiver.handleAttack(this.data);
    }
  }
}
