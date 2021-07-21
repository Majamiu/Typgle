'use strict';
const express = require('express');
const app = express();
const path = require("path");
const http = require('http');
const port = 3000;
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
require('./socket.js')(io);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));


app.get("/", (req, res) => {
    res.render("index");
});

app.get("/chat", (req, res) => {
    res.render("chat");
});

app.get("/TermsAndConditions", (req, res) => {
  res.render("TermsAndConditions");
});

server.listen(port, () => {
  console.log('listening on *:3000');
});