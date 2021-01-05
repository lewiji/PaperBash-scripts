const setTimeout = (
  callback: (args) => void,
  context: godot.Node,
  timeout: number,
  dont_pause = false,
  ...args: Array<any>
): Promise<void> => {
  return new Promise((resolve) => {
    const timer = new godot.Timer();
    if (dont_pause) {
      timer.set_pause_mode(godot.Node.PAUSE_MODE_PROCESS);
    }
    timer.set_wait_time(timeout);
    timer.set_autostart(true);
    timer.set_one_shot(true);

    timer.connect(godot.Timer.timeout, () => {
      if (callback) {
        callback(args);
      }
      resolve();
      timer.queue_free();
    });

    context.add_child(timer);
  });
};

export default setTimeout;
