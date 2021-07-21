const vueapp = Vue.createApp({
    data() {
        return {
            serverstatus: "",
            message: "",
            roomid: 0,
            MyMessages: [],
            discconet: false,
            chat: false,
            typing: false,
            Search: false,
            InQueue: false,
            LeaveIsOpen: false,
            ButtonText: "",
            Buttonicon: "",
            disconnect: false,
            OnlineUsers: 0
        };
    },
    mount() {
        document.querySelector('#app');
    },
    created() {
        // When both users are in the room, chat status becomes online, and users can chat.
        socket.on("ChatIsActive", (data) => {
            this.serverstatus = data.Message;
            this.chat = data.chatStatus;
            this.InQueue = false;
            this.LeaveIsOpen = true;
            this.ButtonText = "Leave";
            this.Buttonicon = "/images/leave.svg";
        });

        // The user received from the server room id so he could send messages there.
        socket.on("receiveID", (data) => {
            this.roomid = data;
        });
        // When user receive other other's message, the other user's message is pushed into array.
        socket.on("receive-message", (data) => {
            this.MyMessages.push({ who: "you", message: data, MessageID: this.CounterOfMessages });
            this.scrollToEnd();
        });
        // When the other user leaves the room, the user gets message that the stranger is disconnected.
        socket.on("Userleaved", (data) => {
            this.MyMessages.push({ who: "server", message: data });
            this.chat = false;
            this.message = "";
            this.LeaveIsOpen = false;
            this.Search = true;
            this.typing = false;
            this.ButtonText = "Search";
            this.Buttonicon = "/images/search.svg";
            this.scrollToEnd();
        });
        // User receives a signal when the other user is typing.
        socket.on("UserIsTyping", (data) => {
            this.typing = data.Typing;
            this.scrollToEnd();
        });
        // User receives a signal when the other user is stopping to type.
        socket.on("UserStopsToWrite", (data) => {
            this.typing = data.Typing;
            this.scrollToEnd();
        });
        // User receives a signal from server that he is in queue.
        socket.on("InQueue", () => {
            this.serverstatus = "Looking for someone you can chat with...";
            this.InQueue = true;
            this.ButtonText = "Cancel";
            this.Buttonicon = "/images/x.svg";
        });
        // When somebody joins/leaves the site, all users get a signal to update the users' counter.
        socket.on("UpdateUsersNumber", (data) => {
            this.OnlineUsers = data;
        });
    },
    watch: {
        // When user is typing something or he is stopping to type, he is sending a signal to the server.
        message(value) {
            value ? socket.emit("typing", { id: this.roomid }) : socket.emit("stopTyping", { id: this.roomid });
        }
    },
    methods: {
        checkForm: function (e) {
            e.preventDefault();
            // If chat status is on
            if (this.chat) {
                // If user's message isn't empty
                if (this.message != "") {
                    // User sending his message to the server so other user could receive it.
                socket.emit("send-message", { id: this.roomid, message: this.message });
                // Also, he is putting his own message into an array so that he could see what he wrote.
                this.MyMessages.push({ who: "me", message: this.message, MessageID: this.CounterOfMessages });
                }
                this.message = "";
                this.scrollToEnd();
            }
        },
        // Leave chat, search for a stranger, or cancel searching.
        LeaveOrSearchOrCancel: function () {
            // If user want to search for a stranger.
            if (this.Search) {
                this.InQueue = true; // Queue status is true, if user would decide to stop the search.
                this.MyMessages = [];
                this.serverstatus = "Looking for someone you can chat with...";
                this.ButtonText = "Cancel";
                this.Buttonicon = "/images/x.svg";
                this.Search = false;
                if (this.disconnect) { // If user was disconnected, he will be connected again to server.
                    this.disconnect = false;
                    socket.connect();
                    return;
                } else { // If user wasn't disconnected, he just will start the search for a stranger.
                    socket.emit("StartQueue");
                    return;
                }
            }

            if (this.LeaveIsOpen) { // If user want to leave the conversation
                Swal.fire({
                    title: "Are you sure you want to end this chat?",
                    icon: "question",
                    showCancelButton: true,
                    confirmButtonColor: "#d27373",
                    cancelButtonColor: "#74b075",
                    confirmButtonText: "Yes",
                    cancelButtonText: "No"
                }).then((result) => { // If user confirms to leave conversation.
                    if (result.isConfirmed) {
                        socket.emit("LeaveChat", { id: this.roomid }); // He is giving a signal for a server that he is leaving.
                        this.disconnect = true;
                        this.chat = false; // Chat status is off.
                        this.Search = true; // Search status is on now, if he user want to search for a other stranger.
                        this.MyMessages.push({ who: "server", message: "You have disconnected." });
                        this.message = "";
                        this.typing = false;
                        this.scrollToEnd();
                        this.ButtonText = "Search";
                        this.Buttonicon = "/images/search.svg";
                        this.LeaveIsOpen = false;
                        socket.disconnect();
                    }
                });
            }

            if (this.InQueue) { // If user wants to stop the search of a stranger.
                this.InQueue = false;
                this.MyMessages = [];
                this.serverstatus = "You're not anymore in the search of stranger.";
                this.ButtonText = "Search";
                this.Buttonicon = "/images/search.svg";
                this.Search = true;
                socket.emit("UserIsUnactive");
            }
        },
        scrollToEnd: function () { // Scroll to the end of conversation.
            var container = document.querySelector("#container");
            container.scrollTop = container.scrollHeight;
        }
    }
});
var socket = io();
vueapp.mount("#app");