const express = require("express");
const socketio = require("socket.io");
// const http = require("http");
const cors = require("cors");
const {
  userJoin,
  userExit,
  getUser,
  getUsersInRoom,
  getAllUsers,
} = require("./utils/users");
const path = require("path");

const PORT = process.env.PORT || 3000;

const app = express();
// const server = http.createServer(app);
const io = socketio();

var players = {};
var roomInfo = {};

// app.use(express.static(path.join(__dirname, "../public")));
// app.use(cors());

// app.use(cors({
//   origin: 'https://gwent-classic-pvp.netlify.app', // replace this with the origin that the client is sending
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type']
// }));

app.use(function(req, res, next) {
  var origin = req.headers.origin;
  if (origin === 'https://gwent-classic-pvp.netlify.app') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  next();
});


app.get('/', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "https://gwent-classic-pvp.netlify.app");
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
//   res.header("Access-Control-Allow-Headers", "Content-Type");
//   next();
// });

let id = 0;

io.on("connection", (socket) => {
  const playerId = id++;
  socket.on("joinRoom", (room) => {
    let numberOfUsersInRoom = getUsersInRoom(room).length;

    const { error, newUser } = userJoin({
      id: playerId,
      name: numberOfUsersInRoom === 0 ? "Player 1" : "Player 2",
      room: room,
    });
    if (error) {
      socket.emit("roomFull");
      // console.log("ROOM FULL!");
      return;
    }

    socket.emit("setId", playerId, numberOfUsersInRoom);
    // console.log("New player joined: " + playerId);

    socket.join(newUser.room);
    console.log("Client joined room:", newUser.room);
    if (numberOfUsersInRoom === 1) {
      io.to(newUser.room).emit("startGame");
    }

    io.to(newUser.room).emit("playerJoin", "");
    console.log(numberOfUsersInRoom);
  });

  socket.on("playerRejoin", (roomCode) => {
    if (!roomInfo[roomCode]) {
      roomInfo[roomCode] = {
        readyCounts: 0,
        player1_deck: null,
        player2_deck: null,
        player1_cardNames: null,
        player2_cardNames: null,
      };
    }
    socket.join(roomCode);
    io.to(roomCode).emit("AAA");
  });

  socket.on("setFirstPlayer", (id) => {
    const user = getUser(id);
    if (!user) return;

    io.to(user.room).emit("setFirstPlayer", Math.floor(Math.random() * 2));
  });

  socket.on("readyToStart", (player_deck, playerNum, id) => {
    const user = getUser(id);
    if (!user) return;

    console.log("Player ready!");
    if (playerNum === 0) {
      roomInfo[user.room].player1_deck = player_deck;
    } else {
      roomInfo[user.room].player2_deck = player_deck;
    }
    if (++roomInfo[user.room].readyCounts === 2) {
      io.to(user.room).emit("allPlayersReady", roomInfo[user.room].player1_deck, roomInfo[user.room].player2_deck, Math.floor(Math.random() * 2));
      console.log("All players ready!");
      roomInfo[user.room].readyCounts = 0;
    }
  });

  socket.on("updateHand", (id, playerNum, cardNames, newRound) => {
    const user = getUser(id);
    if (!user) return;

    // console.log("Player ready!");
    if (playerNum === 0) {
      roomInfo[user.room].player1_cardNames = cardNames;
    } else {
      roomInfo[user.room].player2_cardNames = cardNames;
    }

    if (!newRound) {
      sendCardNames();
    }
    else if (++roomInfo[user.room].readyCounts === 2) {
      sendCardNames();
      roomInfo[user.room].readyCounts = 0;
    }
    
    function sendCardNames() {
      io.to(user.room).emit("updateHand", roomInfo[user.room].player1_cardNames, roomInfo[user.room].player2_cardNames, newRound);
      roomInfo[user.room].player1_cardNames = null;
      roomInfo[user.room].player2_cardNames = null;
    }
  });

  socket.on("passRound", (id) => {    
    const user = getUser(id);
    if (user) io.to(user.room).emit("passRound");
  });

  socket.on("moveCard", (id, cardName, playerNum) => {
    const user = getUser(id);
    if (user) io.to(user.room).emit("moveCard", cardName, playerNum);
  });

  socket.on("finishedMove", (id) => {
    const user = getUser(id);
    if (user) io.to(user.room).emit("finishedMove");
  });

  socket.on("placeCard", (id, playerNum, type, cardName, rowIdx, specialCardName) => {
    const user = getUser(id);
    if (user) io.to(user.room).emit("placeCard", playerNum, type, cardName, rowIdx, specialCardName);
  });
  
  socket.on("activateLeader", (playerServerId, playerNum) => {
    const user = getUser(playerServerId);
    if (user) io.to(user.room).emit("activateLeader", playerNum);
  });


  socket.on("initGameState", (gameState) => {
    const user = getUser(socket.id);
    if (user) io.to(user.room).emit("initGameState", gameState);
  });

  socket.on("updateGameState", (gameState) => {
    const user = getUser(socket.id);
    if (user) io.to(user.room).emit("updateGameState", gameState);
  });

  socket.on("test", () => {
    console.log("TEST SUCCEEDED!");
  });

  socket.on("disconnect", () => {
    const user = userExit(id);
  });
});

// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

io.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function printSize(obj) {
  const serializedData = JSON.stringify(obj);
  const dataSize = Buffer.byteLength(serializedData);
  console.log(`Data size: ${dataSize} bytes`);
}