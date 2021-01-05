import Attack from "../attacks/Attack";
import Entity from "../pawn/Entity";
import { Command } from "./Command";

export default class DamageCommand extends Command {
  public attack: Attack;

  constructor(receiver: Entity, attack: Attack) {
    super(receiver);
    this.attack = attack;
  }

  public execute(): void {
    console.log("I'm maybe taking damage!");
    if (this.receiver && this.receiver.is_network_master()) {
      this.receiver.rpc("takeDamage", this.attack.get_global_transform().origin);
    }
  }
}
