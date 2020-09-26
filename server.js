const express = require("express");
const app = express();
const server = require("http").Server(app);
//Socket is used for bidirectional communication and creating rooms
const io = require("socket.io")(server);
//Use peerJs server with express
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});
//Create secure room ids
const { v4: uuidV4 } = require("uuid");

//To catch synchronous errors
process.on('uncaughtException', (err) => {
  console.log('Uncaught exception shutting down...');
  console.log(err.name, err.msg, err.stack);
  process.exit(1);
});


app.use("/peerjs", peerServer);

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

//Connection executes when a user connects
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    //Join the user to given room id
    socket.join(roomId);
    //Tell other users of the room about the new user connected
    socket.to(roomId).broadcast.emit("user-connected", userId);
    //Tell other users of the room about the new user connected
    socket.on("disconnect", () => {
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
});


server.listen(process.env.PORT || 9000, () => {
  console.log("server started");
});

//To catch asynchronous errors
process.on('unhandledRejection', (err) => {
  console.log('Unhandled rejection shutting down...');
  console.log(err);
  //Server.close handles all pending requests or responses
  // and then process.exit() closes the server
  server.close(() => {
    process.exit(1);
  });
});