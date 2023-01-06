const roomCode = document.getElementById("room-code");

// roomCode.innerHTML = `<h1>${generateCode()}</h1>`;
var code  = Qs.parse(location.search, {ignoreQueryPrefix: true});

console.log(code.roomCode);
if (code.roomCode === undefined) {
  code.roomCode = generateCode();
}

roomCode.innerText = code.roomCode;
const socket = io();

socket.emit("joinRoom", code.roomCode);

// socket.on("gameReady", () => {
//   console.log("GAME READY!");
// });

socket.on("startGame", () => {
  window.location.pathname = "./gwent.html";
})

socket.on("roomFull", () => {
    window.alert("ROOM FULL!");
})

function generateCode(length = 5) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
