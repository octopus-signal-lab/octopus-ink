// Refuses to start unless port 3008 is free, so Octopus Ink can never silently
// drift onto another project's port. See ../BLUEPRINT.md (port registry).
import net from "node:net";

const PORT = 3008;
const HOST = "127.0.0.1";

const server = net.createServer();

server.once("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(
      `\n[octopus-ink] Port ${PORT} is already in use.\n` +
        `This app must run on ${PORT} (see BLUEPRINT.md). Refusing to start to avoid port drift.\n` +
        `Free whatever is using ${PORT}, then run the command again.\n`
    );
    process.exit(1);
  }
  // Any other error: don't block startup.
  process.exit(0);
});

server.once("listening", () => {
  server.close(() => process.exit(0));
});

server.listen(PORT, HOST);
