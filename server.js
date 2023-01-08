const express = require("express");
const socketio = require("socket.io");
const http = require("http");
// const cors = require("cors");
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
const server = http.createServer(app);
const io = socketio(server);

var players = {};
// var readyCounts = {};
var roomInfo = {};

app.use(express.static(path.join(__dirname, "public")));
// app.use(cors());
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
      nilfgaardSpecial: 0,
      scoiataelSpecial: 0,
      firstPlayerNum: 0,
    };
  }
    socket.join(roomCode);
    io.to(roomCode).emit("AAA");
  });
  socket.on(
    "waitForPlayerAndCheckSpecial",
    (id, checkNilfgaard, checkScoiatael) => {
      try {
        console.log("Waiting for player...: " + id);
        // send "PlayerReady" to room if both players are ready
        const user = getUser(id);

        if (user) {
          console.log("Player ready!");

          if (checkNilfgaard) {
            roomInfo[user.room].nilfgaardSpecial++;
          }
          if (checkScoiatael) {
            roomInfo[user.room].scoiataelSpecial++;
          }

          // if (!readyCounts[user.room]) {
          //   readyCounts[user.room] = 0;
          // }
          // if (++readyCounts[user.room] === 2) {

          roomInfo[user.room].firstPlayerNum = Math.floor(Math.random() * 2);
          if (++roomInfo[user.room].readyCounts === 2) {
            io.to(user.room).emit(
              "allPlayersReady",
              roomInfo[user.room].nilfgaardSpecial > 0,
              roomInfo[user.room].scoiataelSpecial !== 1,
              roomInfo[user.room].scoiataelSpecial === 1 ? null : roomInfo[user.room].firstPlayerNum
            );
            console.log("All players ready!");
          }
        }
      } catch (error) {
        console.error("Error while handling waitForPlayer message:", error);
      }
    }
  );

  socket.on("setFirstPlayer", (id, firstPlayerNum) => {
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

  // socket.on("sendMessage", (payload, callback) => {
  //   const user = getUser(socket.id);
  //   io.to(user.room).emit("message", {
  //     user: user.name,
  //     text: payload.message,
  //   });
  //   callback();
  // });

  socket.on("disconnect", () => {
    const user = userExit(id);
    // if (user)
    //   io.to(user.room).emit("roomData", {
    //     room: user.room,
    //     users: getUsersInRoom(user.room),
    //   });
  });
});

// //serve static assets in production
// if (process.env.NODE_ENV === "production") {
//   //set static folder
//   app.use(express.static("client/build"));
//   app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
//   });
// }

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
