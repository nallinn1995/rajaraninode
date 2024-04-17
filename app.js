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
 
  let connectedPlayers = [];
  function broadcastPlayerList() {
    io.emit("playerList", connectedPlayers);
  }
  socket.on("createroom", (playerObj) => {
    const roomId = uuidv4();
    socket.join(roomId);
    socket.emit("roomCreated", roomId);
  });

  socket.on('getPlayers', (roomId) => {
    console.log(`Received request for players in room: ${roomId}`);

    // Check if the room exists in the rooms object
    if (rooms[roomId] && rooms[roomId].players) {
        // Retrieve the list of players in the room
        const playersInRoom = rooms[roomId].players;

        // Emit the list of players back to the client who requested it
        socket.emit('playerList', playersInRoom);

        console.log(`Sent player list to client ${socket.id}:`, playersInRoom);
    } else {
        console.log(`Room ${roomId} does not exist or has no players`);
        socket.emit('playerList', []);
    }
});

socket.on("playUpdate",(playerObj) => {
    console.log(playerObj)
    for(let data of rooms[playerObj.roomId].players){
        if(playerObj.playerName == data.name){
            data["play"] = true
        }
    }
})



  socket.on("joinroom", ({ playerName, roomId, avatar, host }) => {
    // Make sure the socket joins the room
    socket.join(roomId);

    // Create the room if it doesn't exist
    rooms[roomId] = rooms[roomId] || { players: [] };

    // Check if the room already contains 4 players
    if (rooms[roomId].players.length < 4) {
        // Add the player to the room
        rooms[roomId].players.push({ roomId: roomId, name: playerName, avatar: avatar, host: host });
        
        // Broadcast to the room that a player has joined
        socket.to(roomId).emit("playerJoined", playerName);

        // Send the room ID to the player who joined
        socket.emit("roomid", roomId);
        socket.emit("roomMem", "Waiting for players to join");
        
        // Notify all players in the room about the updated list of players
        const uniquePlayerNames = new Set(
            rooms[roomId].players.map((player) => player)
        );
        io.to(roomId).emit(
            "playersList",
            Array.from(uniquePlayerNames)
        );
    } else {
        console.log("vvvvvvvvvvvvvvvvvv")
        // If the room already contains 4 players, notify the player that the room is full
        socket.emit("roomFull", true);
    }
});



});

httpServer.listen(3500, () => {
  console.log("Listening at 3500");
});
