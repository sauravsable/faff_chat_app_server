require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDataBase = require("./database");
const PORT = process.env.PORT || 5000;
const Message = require("./models/messageModel");
const errorMiddleWare = require("./middleware/error");
const { indexMessageOnQdrant } = require('./utils/semantic');

const app = express();
const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer(app);

// socket io server cors
const io = new Server(httpServer, {
  cors: {
    origin: true,
    origin:["https://faff-chat-app-client-v4x6.vercel.app", "http://localhost:5173"],
    credentials: true,
  },
});

// cors
app.use(
  cors({
    origin: true,
    origin:["https://faff-chat-app-client-v4x6.vercel.app", "http://localhost:5173"],
    credentials: true,
  })
);

// express json
app.use(express.json());

// express sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: "none"
    },
  })
);

// cookie parser middleware
app.use(cookieParser());

// database connection
connectDataBase();

// get api for testing server running
app.get("/", (req, res) => {
  res.send("server is running");
});

// Routes
const userRoute = require("./routes/userRoute");
app.use("/api/v1", userRoute);

// Middleware for error
app.use(errorMiddleWare);

// Function to create unique room ID for 1-to-1 chat
function getRoomId(user1, user2) {
  return [user1, user2].sort().join("_"); // ensures same room for both users
}

// socket.io logic
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // join personal chat room
  socket.on("joinPrivateChat", async ({ senderId, receiverId }) => {
    try {
      const roomId = getRoomId(senderId, receiverId);
      socket.join(roomId);

      console.log(`User ${senderId} joined private room: ${roomId}`);

      const messages = (
        await Message.find({ roomId })
          .populate("senderId", "name")
          .sort({ timestamp: -1 })
          .limit(100)
      ).reverse();

      socket.emit("previousMessages", messages);
    } catch (error) {
      console.error("Error loading private messages:", error);
    }
  });

  // send private message
  socket.on("privateMessage", async ({ senderId, receiverId, text }) => {
    try {
      const roomId = getRoomId(senderId, receiverId);

      const newMessage = new Message({
        roomId,
        senderId,
        receiverId,
        text,
        timestamp: new Date(),
      });

      await newMessage.save();

      indexMessageOnQdrant({
        rooomId: roomId,
        text: newMessage.text,
        senderId: newMessage.senderId,
        receiverId: newMessage.receiverId,
        timestamp: new Date(),
      }).catch((err) => console.error("qdrant index failed:", err));
  
      const populatedMessage = await newMessage.populate("senderId", "name");

      // emit only to the private room
      io.to(roomId).emit("message", populatedMessage);
    } catch (error) {
      console.error("Error saving private message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// listen to server
httpServer.listen(PORT, () => {
  console.log(`server is running on ${PORT}`);
});
