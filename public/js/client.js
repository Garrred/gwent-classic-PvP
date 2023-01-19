const roomCode = document.getElementById("room-code");

// var xhr = new XMLHttpRequest();
// xhr.open("GET", "https://gwent-classic-pvp.netlify.app", true);
// xhr.withCredentials = true;
// xhr.setRequestHeader('Access-Control-Allow-Origin', 'https://gwent-classic-pvp.netlify.app');
// xhr.onreadystatechange = function() {
//   if (xhr.readyState === 4 && xhr.status === 200) {
//     // Handle the response
//   }
// };
// xhr.send();



var xhr = new XMLHttpRequest();
xhr.open("GET", "https://gwent-classic-pvp.netlify.app/", true);
xhr.withCredentials = true;
xhr.setRequestHeader('Access-Control-Allow-Origin', 'https://gwent-classic-pvp.netlify.app');
xhr.onreadystatechange = function() {
  if (xhr.readyState === 4 && xhr.status === 200) {
    var origin = xhr.getResponseHeader('Access-Control-Allow-Origin');
    if (origin === 'https://gwent-classic-pvp.netlify.app') {
      console.log("Access-Control-Allow-Origin: " + origin);
    }
  }
};
xhr.send();






// roomCode.innerHTML = `<h1>${generateCode()}</h1>`;
var code  = Qs.parse(location.search, {ignoreQueryPrefix: true});

console.log(code.roomCode);
if (code.roomCode === undefined) {
  code.roomCode = generateCode();
}

roomCode.innerText = code.roomCode;
// const socket = io();
const socket = io("https://gwent-classic-pvp.herokuapp.com/");

socket.emit("joinRoom", code.roomCode);

// socket.on("gameReady", () => {
//   console.log("GAME READY!");
// });

socket.on("setId", ( id, num ) => {
  sessionStorage.setItem("playerId", id);
  sessionStorage.setItem("playerNum", num);
  sessionStorage.setItem("roomCode", code.roomCode);
  // console.log("Player ID: " + id);
  // console.log("Player Number: " + num);
})


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
