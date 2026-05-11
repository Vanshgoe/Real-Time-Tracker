const express = require("express");
const app = express();

const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

const path = require("path");

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index");
});

io.on("connection", (socket) => {

    console.log("User Connected:", socket.id);

    socket.on("send-location", (data) => {

        io.emit("receive-location", {
            id: socket.id,
            latitude: data.latitude,
            longitude: data.longitude
        });

    });

    socket.on("disconnect", () => {

        io.emit("user-disconnected", socket.id);

    });

});

server.listen(3000, () => {
    console.log("Server Running On Port 3000");
});