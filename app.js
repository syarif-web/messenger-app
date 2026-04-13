const socket = io();

let mode = "";
let currentRoom = "";
let myId = "";

// DOM elements
let nameInput, countryInput, countryModal, countryOptions;
let menu, login, chat, chatTitle, messages, msgInput, welcome;
let usersDiv, serversDiv;

// =====================
// COUNTRY LIST
// =====================
const countries = [
    "Indonesia",
    "United States",
    "Japan",
    "Germany",
    "France",
    "Lebanon",
    "Brazil",
    "Canada",
    "UK",
    "Italy",
    "Spain"
];

// =====================
// INIT (VERY IMPORTANT)
// =====================
document.addEventListener("DOMContentLoaded", () => {

    // GET ELEMENTS FIRST
    nameInput = document.getElementById("name");
    countryInput = document.getElementById("country");
    countryModal = document.getElementById("countryModal");
    countryOptions = document.getElementById("countryOptions");

    menu = document.getElementById("menu");
    login = document.getElementById("login");
    chat = document.getElementById("chat");
    chatTitle = document.getElementById("chatTitle");
    messages = document.getElementById("messages");
    msgInput = document.getElementById("msg");
    welcome = document.getElementById("welcome");
    usersDiv = document.getElementById("users");
    serversDiv = document.getElementById("servers");

    // ✅ CLICK HANDLER (FIXED)
    countryInput.addEventListener("click", () => {
        openCountryPicker();
    });

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

// =====================
// COUNTRY PICKER
// =====================
function openCountryPicker() {
    countryModal.classList.remove("hidden");
    renderCountries();
}

function renderCountries(filter = "") {
    countryOptions.innerHTML = "";

    const filtered = countries.filter(c =>
        c.toLowerCase().includes(filter.toLowerCase())
    );

    if (filtered.length === 0) {
        countryOptions.innerHTML = "<div class='country-item'>No results</div>";
        return;
    }

    filtered.forEach(c => {
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
// SEND
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
// MESSAGES
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

// USERS
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
