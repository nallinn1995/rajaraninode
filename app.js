const express = require("express")();
const httpServer = require("http").Server(express);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(httpServer, {
  cors: true,
  origins: ["*"],
});
const rooms = {};
const users = {};

io.on("connection", (socket) => {
  

  let connectedPlayers = [];
  function broadcastPlayerList() {
    io.emit("playerList", connectedPlayers);
  }
  socket.on("createroom", (playerObj) => {
    const roomId = uuidv4();
    socket.join(roomId);
    socket.emit("roomCreated", roomId);
  });

  socket.on("getPlayers", (roomId) => {
    

    // Check if the room exists in the rooms object
    if (rooms[roomId] && rooms[roomId].players) {
      // Retrieve the list of players in the room
      const playersInRoom = rooms[roomId].players;

      // Emit the list of players back to the client who requested it
      socket.emit("playerList", playersInRoom);

      
    } else {
      
      socket.emit("playerList", []);
    }
  });

  socket.on("playUpdate", (playerObj) => {
    
    for (let data of rooms[playerObj.roomId].players) {
      if (playerObj.playerName == data.name) {
        data["play"] = true;
      }
    }
  });

  socket.on("joinroom", ({ playerName, roomId, avatar, host, playerId }) => {
    // Make sure the socket joins the room
    users[playerId] = socket.id;
    socket.join(roomId);

    // Create the room if it doesn't exist
    rooms[roomId] = rooms[roomId] || { players: [] };

    // Check if the room already contains 4 players
    if (rooms[roomId].players.length < 4) {
      // Add the player to the room
      rooms[roomId].players.push({
        roomId: roomId,
        name: playerName,
        avatar: avatar,
        host: host,
        playerId: playerId,
      });

      // Broadcast to the room that a player has joined
      socket.to(roomId).emit("playerJoined", playerName);

      // Send the room ID to the player who joined
      socket.emit("roomid", roomId);
      socket.emit("roomMem", "Waiting for players to join");

      // Notify all players in the room about the updated list of players
      const uniquePlayerNames = new Set(
        rooms[roomId].players.map((player) => player)
      );
      io.to(roomId).emit("playersList", Array.from(uniquePlayerNames));
    } else {
      
      // If the room already contains 4 players, notify the player that the room is full
      socket.emit("roomFull", true);
    }
  });

  socket.on("selectCard", (cardObj, playerId, roomid) => {
    console.log(rooms[roomid].players);
    let assignedRole = rooms[roomid].players.filter(p => p.hasOwnProperty('role') && p.role === cardObj.role);
    console.log(assignedRole);
    const recipientSocketId = users[playerId];
    console.log(recipientSocketId,"fdfdfd");
    if(assignedRole.length > 0){
      if (recipientSocketId) {
          // Emit the private message event to the recipient's socket only
          console.log("This role is already taken!!!!");
          socket.emit("isAssignedRole",true);
          socket.emit("updatedPlayerListCard", rooms[roomid].players);
          return;
      } else {
        // Handle case where user is not found
        console.log('User not found');
    }
    } else {
      console.log("This role is not taken!!!!");
      socket.emit("isAssignedRole",false);
      for (let data of rooms[roomid].players) {
        if (data.playerId == playerId) {
          data["selected"] = true;
          data["role"] = cardObj?.role;
        } 
      }
      console.log(rooms[roomid]);
      socket.emit("updatedPlayerListCard", rooms[roomid].players);
    }
    
  });


});

httpServer.listen(3500, () => {
  
});
