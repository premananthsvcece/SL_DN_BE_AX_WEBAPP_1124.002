import { Server } from "socket.io";

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const users = {};

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Store the username and room when the user joins a room
    socket.on("joinRoom", ({ username, room }) => {
      users[socket.id] = { username, room };
      socket.join(room); // Join the specified room
      console.log(`${username} joined ${room}.`);

      // Broadcast to the room that a new user has joined
      socket.to(room).emit("chatMessage", {
        username: "System",
        text: `${username} has joined the room.`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    });

    // Listen for chat messages and broadcast them to the room
    socket.on("chatMessage", (msg) => {
      const user = users[socket.id] || {
        username: "Anonymous",
        room: "General",
      };
      const room = user.room;

      console.log(`Message from ${user.username} in ${room}: ${msg.text}`);
      io.to(room).emit("chatMessage", {
        username: user.username,
        text: msg.text,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    });

    // Handle disconnection and clean up user data
    socket.on("disconnect", () => {
      const user = users[socket.id];
      if (user) {
        const { username, room } = user;
        socket.to(room).emit("chatMessage", {
          username: "System",
          text: `${username} has left the room.`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
        console.log(`${username} disconnected.`);
        delete users[socket.id];
      }
    });
  });

  return io;
};

export default initializeSocket;
