const express = require("express")();
const httpServer = require("http").Server(express);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(httpServer, {
  cors: true,
  origins: ["*"],
});
const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected");
  // socket.emit("message","I just connected");
  // socket.broadcast.emit("message","Hi this message is send to everyone except sender");
  // io.emit("This is send to everyone");
  // socket.join("Here is a unique ID for the room");
  // socket.to("UNIQUE ID").emit("message","This message will send to everyone in the room except the sender");
  // io.to("UNIQUE ID").emit("This message will ne send to everyone in the room ");
  // Array to store connected players
  let connectedPlayers = [];

  // Function to broadcast updated player list to all clients
  function broadcastPlayerList() {
    io.emit("playerList", connectedPlayers);
  }
  socket.on("createroom", (nickname) => {
    console.log(nickname);
    const roomId = uuidv4();
    socket.join(roomId);
    socket.emit("roomCreated", roomId);
  });

  socket.on("joinroom", ({ playerName, roomId }) => {
    socket.join(roomId);
    rooms[roomId] = rooms[roomId] || { players: [] };
    rooms[roomId].players.push({ id: socket.id, name: playerName });
    socket.to(roomId).emit("playerJoined", playerName);
    socket.emit("roomid", roomId);
    // Emitting player list to the current player
    // Emitting unique player list to the current player
    const uniquePlayerNames = new Set(
      rooms[roomId].players.map((player) => player.name)
    );
    io.to(roomId).emit(
      "playersList",
      Array.from(uniquePlayerNames)
    );
  });
});

httpServer.listen(3500, () => {
  console.log("Listening at 3500");
});
