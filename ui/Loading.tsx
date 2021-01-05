import { node } from "../decorators";
import setTimeout from "../util/setTimeout";

export default class LoadingScreen extends godot.CanvasLayer {
  @node
  private message: godot.RichTextLabel;
  @node
  private control: godot.Control;
  private defaultMessage = "[tornado radius=5 freq=2]Connecting...[/tornado]";

  public static _instance: LoadingScreen;

  constructor() {
    super();
    if (LoadingScreen._instance !== undefined) {
      return LoadingScreen._instance;
    }
    LoadingScreen._instance = this;
  }

  _ready(): void {
    this.control.set_visible(false);
    this.set_pause_mode(godot.Node.PAUSE_MODE_PROCESS);
  }

  show(msg = ""): void {
    if (msg === "") {
      msg = this.defaultMessage;
    }
    this.message.set_bbcode(msg);
    this.control.set_visible(true);
  }

  hide(): void {
    this.message.set_bbcode(this.defaultMessage);
    this.control.set_visible(false);
  }

  flashMessageAndClose(msg: string, timeout = 1): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(
        () => {
          this.message.set_bbcode(msg);

          setTimeout(
            () => {
              this.hide();
              resolve();
            },
            this,
            timeout,
          );
        },
        this,
        0.3,
      );
    });
  }
}
