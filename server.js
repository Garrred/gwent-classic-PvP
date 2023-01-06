const express = require("express");
const socketio = require("socket.io");
const http = require("http");
// const cors = require("cors");
const { userJoin, userExit, getUser, getUsersInRoom } = require("./utils/users");
const path = require("path");

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, "public")));
// app.use(cors());

io.on("connection", (socket) => {
  socket.on("joinRoom", room => {
    let numberOfUsersInRoom = getUsersInRoom(room).length;
    
    const {error ,newUser }= userJoin({
      id: socket.id,
      name: numberOfUsersInRoom === 0 ? "Player 1" : "Player 2",
      room: room,
    });
    if(error) {
      socket.emit("roomFull", "");
      // console.log("ROOM FULL!");
      return;
    }
    
    socket.join(newUser.room);
    if (numberOfUsersInRoom === 1) {
      io.to(newUser.room).emit("gameReady", "");
      io.to(newUser.room).emit("startGame", "");
    }

    // io.to(newUser.room).emit("playerJoin", "");
    console.log(numberOfUsersInRoom);
    // io.to(newUser.room).emit("roomData", {
    //   room: newUser.room,
    //   users: getUsersInRoom(newUser.room),
    // });
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
    const user = userExit(socket.id);
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
