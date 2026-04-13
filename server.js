const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const users = new Map();

io.on("connection", (socket) => {

    socket.on("join", ({ name, country }) => {
        users.set(socket.id, { name, country });

        io.emit("system", `${name} from ${country} joined the chat`);
    });

    socket.on("message", (msg) => {
        const user = users.get(socket.id);
        if (!user) return;

        io.emit("message", {
            name: user.name,
            msg,
            id: socket.id
        });
    });

    socket.on("typing", () => {
        const user = users.get(socket.id);
        if (!user) return;

        socket.broadcast.emit("typing", `${user.name} is typing...`);
    });

    socket.on("stopTyping", () => {
        socket.broadcast.emit("stopTyping");
    });

    socket.on("disconnect", () => {
        const user = users.get(socket.id);
        if (user) {
            io.emit("system", `${user.name} left the chat`);
            users.delete(socket.id);
        }
    });
});

server.listen(3000, () => {
    console.log("Running on http://localhost:3000");
});
