const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let users = {};
let servers = ["Global", "Gaming", "Indonesia"];

io.on("connection", (socket) => {

    // JOIN
    socket.on("joinApp", ({ name, country }, callback) => {
        const taken = Object.values(users).some(u => u.name === name);

        if (taken) {
            return callback({ success: false, message: "Name already taken" });
        }

        users[socket.id] = { name, country };

        callback({ success: true });

        io.emit("userList", users);
        socket.emit("serverList", servers);
    });

    // REFRESH USERS
    socket.on("joinAppRefresh", () => {
        socket.emit("userList", users);
    });

    // PUBLIC
    socket.on("publicMessage", (msg) => {
        io.emit("publicMessage", {
            user: users[socket.id],
            msg,
            id: socket.id
        });
    });

    // PRIVATE
    socket.on("joinPrivate", ({ target }) => {
        const room = [socket.id, target].sort().join("-");

        socket.join(room);

        const targetSocket = io.sockets.sockets.get(target);
        if (targetSocket) targetSocket.join(room);

        io.to(room).emit("privateJoined", room);
    });

    socket.on("privateMessage", ({ room, msg }) => {
        if (!room) return;

        io.to(room).emit("privateMessage", {
            user: users[socket.id],
            msg,
            id: socket.id,
            room
        });
    });

    // SERVER ROOM
    socket.on("joinServer", (serverName) => {
        socket.join(serverName);
        socket.emit("joinedServer", serverName);
    });

    socket.on("serverMessage", ({ serverName, msg }) => {
        io.to(serverName).emit("serverMessage", {
            user: users[socket.id],
            msg,
            id: socket.id
        });
    });

    // TYPING
    socket.on("typing", ({ room }) => {
        socket.to(room).emit("typing", { user: users[socket.id] });
    });

    socket.on("stopTyping", ({ room }) => {
        socket.to(room).emit("stopTyping");
    });

    socket.on("seen", ({ room }) => {
        socket.to(room).emit("seen");
    });

    // DISCONNECT
    socket.on("disconnect", () => {
        delete users[socket.id];
        io.emit("userList", users);
    });
});

server.listen(3000, () => {
    console.log("Running on http://localhost:3000");
});
