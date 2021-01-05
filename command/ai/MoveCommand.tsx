import Entity from "../../pawn/Entity";
import NPC from "../../pawn/NPC";
import { Command, Invoker, Receiver } from "../Command";

export default class MoveCommand extends Command {
  constructor(receiver: NPC) {
    super(receiver);
    this.receiver = receiver;
  }

  public execute(): void {
    console.log("I'm moving!");
    if (this.receiver) {
    }
  }
}
