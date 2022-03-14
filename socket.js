
/*
const express = require('express');
const app = express();
const http = require('http');
const { Server } = require("socket.io");

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

// app.get('/', (req, res) => {
//   res.send("Hello World");
// });

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('channel',(channel, member)=>{
      console.log(channel)
      socket.join(channel)
      socket.emit('connection to channel ' + channel)
      // setInterval(() => {
      //   socket.to(channel).emit('online', member)
      // }, 1000);
      
  })
  socket.on('message', (channel)=>{
      socket.to(channel).emit('message', "message has been sent in channel: " + channel)
  })

  socket.on('typing', (memberName, channel)=>{
    socket.to(channel).emit('typing', memberName)
})

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  })
});


io.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
  });


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3002;
}
httpServer.listen(port,function(err){
  if(err){
      console.log(err)
  }
  else{
  console.log("listening on port " + port)
  }
});
*/