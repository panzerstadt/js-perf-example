import { createGameRunner, onClose, onMessage } from "./game";
import * as consts from "./game/consts";
import { getConfig } from "./cli";
import { getLogger, initLogger } from "./logger";
import { getWriter } from "./game/data-writer";
import * as uws from "uWebSockets.js";

const args = getConfig();
consts.initFromEnv();
consts.initFromCLI(args);
initLogger(args);
getWriter(args);

const runner = createGameRunner();

getLogger().info(args, "starting server");

/* Non-SSL is simply App() */
uws
  .App()
  .ws("/*", {
    // /* There are many common helper features */
    // idleTimeout: 32,
    // maxBackpressure: 1024,
    // maxPayloadLength: 512,
    // compression: DEDICATED_COMPRESSOR_3KB,

    /* For brevity we skip the other events (upgrade, open, ping, pong, close) */
    close(ws, code, message) {
      onClose(ws);
    },
    open(ws) {
      runner(ws);
    },
    message: (ws, message, isBinary) => {
      onMessage(ws, Buffer.from(message).toString());
      /* You can do app.publish('sensors/home/temperature', '22C') kind of pub/sub as well */

      /* Here we echo the message back, using compression if available */
      //   let ok = ws.send(message, isBinary, true);
    },
  })
  .listen(args.port, (listenSocket) => {
    if (listenSocket) {
      getLogger().info("listening on", args.port);
      console.log("listening on", args.port);
    } else {
      getLogger().error("cannot start server");
      console.error("cannot start server");
    }
  });
