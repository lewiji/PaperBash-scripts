import Entity from "../pawn/Entity";

export class Command {
  protected receiver: Entity;
  constructor(receiver) {
    this.receiver = receiver;
  }
  public execute(): void {
    throw new Error("Abstract method!");
  }
}

export class Invoker {
  private commands: Command[];

  constructor() {
    this.commands = [];
  }

  public store(cmd: Command) {
    this.commands.push(cmd);
  }

  public storeAndInvoke(cmd: Command) {
    this.commands.push(cmd);
    cmd.execute();
  }

  public invokeAll() {
    for (const cmd of this.commands) {
      cmd.execute();
    }
  }
}

export class Receiver extends godot.Node {
  public action(): void {
    console.log("Action is being called!");
  }
}
