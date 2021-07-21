"use strict";

var AvailableRooms = [];
var inconversation = [];
var id;
var indexOfEmptyRoom;

var UserWasInconversation = false;
var socketID;
var UserCounter = 0;

module.exports = (io) => {
    io.on("connection", (socket) => {

        // If somebody connects to the site, update the users' counter and send it to all users.
        UserCounter++;
        io.emit("UpdateUsersNumber", UserCounter);


        // Receive user's message and send message to other user.
        socket.on("send-message", (data) => {
            if (data.message != "") {
            socket.to(data.id).emit("receive-message", data.message);
            }
        });

        // If user is typing something, he sends signal to the other user so he could know, that stranger is typing.
        socket.on("typing", (data) => {
            socket.to(data.id).emit("UserIsTyping", { Typing: true });
        });

        // If user stops typing he is sending a signal to other user.

        socket.on("stopTyping", (data) => {
            socket.to(data.id).emit("UserStopsToWrite", { Typing: false });
        });



        // If user don't want to be in queue anymore, he deleting his lobby so nobody couldn't join him.

        socket.on("UserIsUnactive", (data) => {
            indexOfEmptyRoom = AvailableRooms.findIndex(({ OwnerOfRoom }) => OwnerOfRoom == socket.id);
            AvailableRooms.splice(indexOfEmptyRoom, 1);
        });

        // Before starting the queue, check if the user already doesn't have empty lobby.
        socket.on("StartQueue", () => {
            if (AvailableRooms.findIndex(({ OwnerOfRoom }) => OwnerOfRoom == socket.id) === -1) {
            StartingChat(socket); 
            } else {
                indexOfEmptyRoom = AvailableRooms.findIndex(({ OwnerOfRoom }) => OwnerOfRoom == socket.id);
                AvailableRooms.splice(indexOfEmptyRoom, 1);
                StartingChat(socket);
            }
        });


            StartingChat(socket);
 

        socket.on("disconnect", () => {
            // If somebody disconnects, update the users' counter and send it to all users.
            UserCounter--;
            io.emit("UpdateUsersNumber", UserCounter);

            socketID = socket.id;
            // If the user disconnects, and if he wasn't in conversation and was in queue - delete his lobby. 
            if (AvailableRooms.length > 0) {
                if (AvailableRooms.findIndex(({ OwnerOfRoom }) => OwnerOfRoom == socket.id) != -1) {
                    indexOfEmptyRoom = AvailableRooms.findIndex(({ OwnerOfRoom }) => OwnerOfRoom == socket.id);
                    AvailableRooms.splice(indexOfEmptyRoom, 1);

                    UserWasInconversation = false;
                } else { // If there is no empty available rooms, obviously, that user wasn't in queue and was alredy in conversation.
                    UserWasInconversation = true;
                }
            } else {
                UserWasInconversation = true;
            }
            if (UserWasInconversation) {
                // Checking which user left the conversation to get correct index of empty room.

                if (inconversation.findIndex(({ OwnerOfRoom }) => OwnerOfRoom == socketID) !== -1) {
                    indexOfEmptyRoom = inconversation.findIndex(({ OwnerOfRoom }) => OwnerOfRoom == socketID);
                } else {
                    indexOfEmptyRoom = inconversation.findIndex(({ OtherUser }) => OtherUser == socketID);
                }

                // If everything is fine with index - delete a empty room.
                if (indexOfEmptyRoom != -1) {
                    io.sockets.in(inconversation[indexOfEmptyRoom].room).emit("Userleaved", "Stranger has disconnected.");

                    inconversation.splice(indexOfEmptyRoom, 1);
                }

                UserWasInconversation = false;
            }
        });
    });

    function StartingChat(socket) {
        // Checking if there is any available room to join.
        if (AvailableRooms.length > 0) {
            const random = Math.floor(Math.random() * AvailableRooms.length);

            AvailableRooms[random].OtherUser = socket.id;

            inconversation.push(AvailableRooms[random]);

            socket.join(AvailableRooms[random].room);

            io.to(AvailableRooms[random].room).emit("ChatIsActive", {
                Message: "You're now chatting with a random stranger. Say hello!",
                chatStatus: true
            });
            socket.emit("receiveID", AvailableRooms[random].room); // Sending the room's id for the user so that he could send messages to other user.

            AvailableRooms.splice(random, 1);
        } else { // If there is no available room, then the user will create his own room where other could join.
            IDgenerator();

            AvailableRooms.push({
                room: id,
                OwnerOfRoom: socket.id,
                OtherUser: socket.id
            });

            socket.join(id);

            socket.emit("receiveID", id); // Sending the room's id for the user so that he could send messages to other users.

            socket.emit("InQueue"); // User's queue status is active.
        }
    }
    function IDgenerator() {
        id = "_" + Math.random().toString(36).substr(2, 9);
    }
};
