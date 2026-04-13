const socket = io();

let myId = "";

// ELEMENTS
const login = document.getElementById("login");
const chat = document.getElementById("chat");

const nameInput = document.getElementById("name");
const countrySelect = document.getElementById("country");
const joinBtn = document.getElementById("joinBtn");

const messages = document.getElementById("messages");
const msgInput = document.getElementById("msg");
const sendBtn = document.getElementById("sendBtn");
const typingDiv = document.getElementById("typing");

// JOIN
joinBtn.onclick = () => {
    const name = nameInput.value.trim();
    const country = countrySelect.value;

    if (!name || !country) {
        alert("Fill everything!");
        return;
    }

    socket.emit("join", { name, country });

    login.classList.add("hidden");
    chat.classList.remove("hidden");
};

// SEND
sendBtn.onclick = sendMessage;

msgInput.addEventListener("keypress", (e) => {
    socket.emit("typing");

    if (e.key === "Enter") {
        sendMessage();
        socket.emit("stopTyping");
    }
});

function sendMessage() {
    const msg = msgInput.value.trim();
    if (!msg) return;

    socket.emit("message", msg);
    msgInput.value = "";
}

// RECEIVE
socket.on("connect", () => {
    myId = socket.id;
});

socket.on("message", (data) => {
    const div = document.createElement("div");
    div.className = "msg";
    div.innerText = data.name + ": " + data.msg;
    messages.appendChild(div);
});

socket.on("system", (msg) => {
    const div = document.createElement("div");
    div.className = "system";
    div.innerText = msg;
    messages.appendChild(div);
});

// TYPING
socket.on("typing", (msg) => {
    typingDiv.innerText = msg;
});

socket.on("stopTyping", () => {
    typingDiv.innerText = "";
});
