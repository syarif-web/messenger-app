const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// ✅ Stable socket setup
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

// ✅ Serve files from current folder
app.use(express.static(__dirname));

const users = new Map();

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // ======================
    // JOIN
    // ======================
    socket.on("join", ({ name, country }) => {
        users.set(socket.id, { name, country });

        console.log(`${name} joined from ${country}`);

        io.emit("system", `${name} from ${country} joined the chat`);
    });

    // ======================
    // MESSAGE
    // ======================
    socket.on("message", (msg) => {
        const user = users.get(socket.id);

        if (!user) {
            console.log("User not found for message");
            return;
        }

        console.log("Message:", msg);

        io.emit("message", {
            name: user.name,
            msg,
            id: socket.id
        });
    });

    // ======================
    // TYPING
    // ======================
    socket.on("typing", () => {
        const user = users.get(socket.id);
        if (!user) return;

        socket.broadcast.emit("typing", `${user.name} is typing...`);
    });

    socket.on("stopTyping", () => {
        socket.broadcast.emit("stopTyping");
    });

    // ======================
    // DISCONNECT
    // ======================
    socket.on("disconnect", () => {
        const user = users.get(socket.id);

        if (user) {
            io.emit("system", `${user.name} left the chat`);
            users.delete(socket.id);
        }

        console.log("User disconnected:", socket.id);
    });
});

// ======================
// START SERVER
// ======================
server.listen(3000, () => {
    console.log("Running on http://localhost:3000");
});
