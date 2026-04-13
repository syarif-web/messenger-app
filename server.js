const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// STATIC
app.use(express.static("public"));

// DATA
const users = new Map(); // socket.id -> { name, country }
const servers = ["Global", "Gaming", "Indonesia"];

// HELPERS
function getUser(socket) {
    return users.get(socket.id);
}

function broadcastUsers() {
    const obj = Object.fromEntries(users);
    io.emit("userList", obj);
}

// SOCKET CONNECTION
io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    // =========================
    // JOIN APP
    // =========================
    socket.on("joinApp", ({ name, country }, callback) => {
        if (!name || !country) {
            return callback({ success: false, message: "Missing data" });
        }

        const nameTaken = [...users.values()].some(u => u.name === name);
        if (nameTaken) {
            return callback({ success: false, message: "Name already taken" });
        }

        users.set(socket.id, { name, country });

        callback({ success: true });

        broadcastUsers();
        socket.emit("serverList", servers);
    });

    // =========================
    // REFRESH USERS
    // =========================
    socket.on("joinAppRefresh", () => {
        broadcastUsers();
    });

    // =========================
    // PUBLIC CHAT
    // =========================
    socket.on("publicMessage", (msg) => {
        const user = getUser(socket);
        if (!user || !msg) return;

        io.emit("publicMessage", {
            user,
            msg,
            id: socket.id
        });
    });

    // =========================
    // PRIVATE CHAT
    // =========================
    socket.on("joinPrivate", ({ target }) => {
        if (!target) return;

        const room = [socket.id, target].sort().join("-");

        socket.join(room);

        const targetSocket = io.sockets.sockets.get(target);
        if (targetSocket) {
            targetSocket.join(room);
        }

        io.to(room).emit("privateJoined", room);
    });

    socket.on("privateMessage", ({ room, msg }) => {
        const user = getUser(socket);
        if (!room || !msg || !user) return;

        io.to(room).emit("privateMessage", {
            user,
            msg,
            id: socket.id,
            room
        });
    });

    // =========================
    // SERVER ROOMS
    // =========================
    socket.on("joinServer", (serverName) => {
        if (!servers.includes(serverName)) return;

        socket.join(serverName);

        socket.emit("joinedServer", serverName);
    });

    socket.on("serverMessage", ({ serverName, msg }) => {
        const user = getUser(socket);
        if (!serverName || !msg || !user) return;

        io.to(serverName).emit("serverMessage", {
            user,
            msg,
            id: socket.id
        });
    });

    // =========================
    // OPTIONAL FEATURES
    // =========================
    socket.on("typing", ({ room }) => {
        socket.to(room).emit("typing", { user: getUser(socket) });
    });

    socket.on("stopTyping", ({ room }) => {
        socket.to(room).emit("stopTyping");
    });

    socket.on("seen", ({ room }) => {
        socket.to(room).emit("seen");
    });

    // =========================
    // DISCONNECT
    // =========================
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);

        users.delete(socket.id);
        broadcastUsers();
    });
});

// START SERVER
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
