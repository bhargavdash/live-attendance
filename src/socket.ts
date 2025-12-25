import WebSocket, { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET ?? "";

const wss = new WebSocketServer({ port: 8080 });

console.log("Websocket connection established on port: 8080");

interface User {
  userId: string,
  role: string
}

const userList: User[] = [];

wss.on("connection", (socket: WebSocket, request) => {
  try {
    const url = request.url;

    if (!url) {
      socket.send(
        JSON.stringify({
          success: false,
          error: "URL not found",
        })
      );
      return;
    }

    const queryParams = new URLSearchParams(url.split("?")[1]);
    const token = queryParams.get("token") ?? "";

    if (!token) {
      socket.send(
        JSON.stringify({
          success: false,
          error: "Token not found",
        })
      );
      socket.close();
      return;
    }

    const decodedToken = jwt.verify(token, JWT_SECRET) as { userId: string, role: string };

    if (!decodedToken || !decodedToken.userId) {
      socket.send(
        JSON.stringify({
          success: false,
          error: "Unauthorized token",
        })
      );
      socket.close();
      return;
    }

    const userId = decodedToken.userId;
    const role = decodedToken.role;
    userList.push({ userId, role });


    console.log("New user added, total: ", userList.length);

    socket.on("message", (msg: Buffer) => {
      console.log("Received: ", msg.toString("utf-8"));
    });

    socket.on("error", console.error);

    socket.send("Something");
  } catch (err) {
    console.log(err);
  }
});
