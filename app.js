const socket = io();

let mode = "";
let currentRoom = "";
let myId = "";

// JOIN
function join() {
    const name = nameInput.value.trim();
    const country = countryInput.value.trim();

    if (!name || !country) return alert("Fill all fields!");

    socket.emit("joinApp", { name, country }, (res) => {
        if (!res.success) return alert(res.message);

        login.classList.add("hidden");
        menu.classList.remove("hidden");
        welcome.innerText = `Hi ${name} from ${country}`;
    });
}
window.join = join;

// NAV
function openPublic() {
    mode = "public";
    openChat("Public Chat");
}
window.openPublic = openPublic;

function openPrivate() {
    mode = "select-private";
    usersDiv.classList.remove("hidden");
    socket.emit("joinAppRefresh");
}
window.openPrivate = openPrivate;

// CHAT
function openChat(title) {
    menu.classList.add("hidden");
    chat.classList.remove("hidden");
    chatTitle.innerText = title;
    messages.innerHTML = "";
}

// SEND
function send() {
    const msg = msgInput.value;
    if (!msg) return;

    socket.emit("publicMessage", msg);
    msgInput.value = "";
}
window.send = send;

// MESSAGE
function addMsg(data) {
    const div = document.createElement("div");
    div.className = "msg " + (data.id === myId ? "me" : "other");
    div.innerText = data.user.name + ": " + data.msg;
    messages.appendChild(div);
}

// SOCKET
socket.on("connect", () => myId = socket.id);
socket.on("publicMessage", addMsg);

// COUNTRY
const countries = ["Indonesia","United States","Japan","Germany","France"];

function openCountryPicker() {
    countryModal.classList.remove("hidden");
    renderCountries();
}
window.openCountryPicker = openCountryPicker;

function renderCountries(filter="") {
    countryOptions.innerHTML = "";

    countries
    .filter(c=>c.toLowerCase().includes(filter.toLowerCase()))
    .forEach(c=>{
        const div = document.createElement("div");
        div.className="country-item";
        div.innerText=c;

        div.onclick=()=>{
            countryInput.value=c;
            countryModal.classList.add("hidden");
        };

        countryOptions.appendChild(div);
    });
}

// FIX EVENTS
document.addEventListener("DOMContentLoaded", () => {
    window.nameInput = document.getElementById("name");
    window.countryInput = document.getElementById("country");
    window.countryModal = document.getElementById("countryModal");
    window.countryOptions = document.getElementById("countryOptions");
    window.menu = document.getElementById("menu");
    window.login = document.getElementById("login");
    window.chat = document.getElementById("chat");
    window.chatTitle = document.getElementById("chatTitle");
    window.messages = document.getElementById("messages");
    window.msgInput = document.getElementById("msg");
    window.welcome = document.getElementById("welcome");
    window.usersDiv = document.getElementById("users");

    document.getElementById("countrySearch").addEventListener("input", e=>{
        renderCountries(e.target.value);
    });

    countryModal.addEventListener("click", e=>{
        if(e.target.id==="countryModal"){
            countryModal.classList.add("hidden");
        }
    });
});
