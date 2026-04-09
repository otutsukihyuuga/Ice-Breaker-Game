import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT || 3000);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));

  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: { origin: "*" },
  });

  global.__io = io;

  io.on("connection", (socket) => {
    socket.on("session:join", (code) => {
      if (typeof code === "string") socket.join(code.toUpperCase());
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://127.0.0.1:${port} and http://localhost:${port}`);
  });
});
