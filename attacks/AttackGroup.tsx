import { Invoker, Receiver } from "../command/index";
//@ts-ignore
import LightningAttack from "res://scenes/LightningAttack.tscn";

export default class AttackGroup extends godot.Spatial {
    public invoker: Invoker;
    public receiver: Receiver;
    
    constructor() {
        super();
        this.invoker = new Invoker();
        this.receiver = new Receiver();
    }
    handleAttack(data): void {
        if (data.type === "Lightning") {
            const lightning = (LightningAttack as godot.PackedScene);
            const lightningAOE = lightning.instance() as godot.Spatial;
            lightningAOE.set_translation(data.pos);
            this.add_child(lightningAOE);
        }
    }
}