const socket = io();

let mode = "";
let currentRoom = "";
let myId = "";

// =====================
// JOIN
// =====================
function join() {
    const name = nameInput.value.trim();
    const country = countryInput.value.trim();

    if (!name || !country) {
        alert("Fill all fields!");
        return;
    }

    socket.emit("joinApp", { name, country }, (res) => {
        if (!res.success) return alert(res.message);

        login.classList.add("hidden");
        menu.classList.remove("hidden");
        welcome.innerText = `Hi ${name} from ${country}`;
    });
}
window.join = join;

// =====================
// NAVIGATION
// =====================
function openPublic() {
    mode = "public";
    openChat("Public Chat");
}
window.openPublic = openPublic;

function openPrivate() {
    mode = "private";
    usersDiv.classList.remove("hidden");
    serversDiv.classList.add("hidden");
    socket.emit("joinAppRefresh");
}
window.openPrivate = openPrivate;

function openServer() {
    mode = "server-select";
    serversDiv.classList.remove("hidden");
    usersDiv.classList.add("hidden");
}
window.openServer = openServer;

function back() {
    chat.classList.add("hidden");
    menu.classList.remove("hidden");
}
window.back = back;

// =====================
// CHAT
// =====================
function openChat(title) {
    menu.classList.add("hidden");
    chat.classList.remove("hidden");
    chatTitle.innerText = title;
    messages.innerHTML = "";
}

// =====================
// SEND MESSAGE
// =====================
function send() {
    const msg = msgInput.value.trim();
    if (!msg) return;

    if (mode === "public") {
        socket.emit("publicMessage", msg);
    }

    if (mode === "private") {
        socket.emit("privateMessage", { room: currentRoom, msg });
    }

    if (mode === "server") {
        socket.emit("serverMessage", { serverName: currentRoom, msg });
    }

    msgInput.value = "";
}
window.send = send;

// =====================
// ADD MESSAGE
// =====================
function addMsg(data) {
    const div = document.createElement("div");
    div.className = "msg " + (data.id === myId ? "me" : "other");
    div.innerText = data.user.name + ": " + data.msg;
    messages.appendChild(div);
}

// =====================
// SOCKET EVENTS
// =====================
socket.on("connect", () => {
    myId = socket.id;
});

socket.on("publicMessage", addMsg);
socket.on("privateMessage", addMsg);
socket.on("serverMessage", addMsg);

// USERS LIST
socket.on("userList", (users) => {
    usersDiv.innerHTML = "";

    Object.entries(users).forEach(([id, user]) => {
        if (id === myId) return;

        const div = document.createElement("div");
        div.className = "country-item";
        div.innerText = user.name + " (" + user.country + ")";

        div.onclick = () => {
            socket.emit("joinPrivate", { target: id });
        };

        usersDiv.appendChild(div);
    });
});

// PRIVATE JOIN
socket.on("privateJoined", (room) => {
    currentRoom = room;
    mode = "private";
    openChat("Private Chat");
});

// SERVERS
socket.on("serverList", (servers) => {
    serversDiv.innerHTML = "";

    servers.forEach(s => {
        const div = document.createElement("div");
        div.className = "country-item";
        div.innerText = s;

        div.onclick = () => {
            currentRoom = s;
            mode = "server";
            socket.emit("joinServer", s);
            openChat("Server: " + s);
        };

        serversDiv.appendChild(div);
    });
});

// =====================
// COUNTRY PICKER (FIXED)
// =====================
const countries = [
    "Indonesia",
    "United States",
    "Japan",
    "Germany",
    "France",
    "Lebanon"
];

function openCountryPicker() {
    countryModal.classList.remove("hidden");
    renderCountries();
}
window.openCountryPicker = openCountryPicker;

function renderCountries(filter = "") {
    countryOptions.innerHTML = "";

    countries
        .filter(c => c.toLowerCase().includes(filter.toLowerCase()))
        .forEach(c => {
            const div = document.createElement("div");
            div.className = "country-item";
            div.innerText = c;

            div.onclick = () => {
                countryInput.value = c;
                countryModal.classList.add("hidden");
            };

            countryOptions.appendChild(div);
        });
}

// =====================
// DOM SETUP (VERY IMPORTANT)
// =====================
document.addEventListener("DOMContentLoaded", () => {

    // INPUTS
    window.nameInput = document.getElementById("name");
    window.countryInput = document.getElementById("country");

    // COUNTRY MODAL
    window.countryModal = document.getElementById("countryModal");
    window.countryOptions = document.getElementById("countryOptions");

    // UI
    window.menu = document.getElementById("menu");
    window.login = document.getElementById("login");
    window.chat = document.getElementById("chat");
    window.chatTitle = document.getElementById("chatTitle");
    window.messages = document.getElementById("messages");
    window.msgInput = document.getElementById("msg");
    window.welcome = document.getElementById("welcome");
    window.usersDiv = document.getElementById("users");
    window.serversDiv = document.getElementById("servers");

    // SEARCH
    const search = document.getElementById("countrySearch");
    if (search) {
        search.addEventListener("input", (e) => {
            renderCountries(e.target.value);
        });
    }

    // CLOSE MODAL
    countryModal.addEventListener("click", (e) => {
        if (e.target.id === "countryModal") {
            countryModal.classList.add("hidden");
        }
    });

});
