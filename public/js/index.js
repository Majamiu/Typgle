const vueapp = Vue.createApp({
    data() {
        return {
            OnlineUsers: 0,
            CheckBoxText: "",
            CheckBox: false,
            disable: true
        };
    },
    methods: {
        Checked: function () {
            // Checking if user pressed check box to agree with all conditions and terms.
            if (this.CheckBoxText == "") {
                this.CheckBoxText = "Checked";
                this.disable = false;
                // If User was already pressed check box
            } else {
                this.CheckBoxText = "";
                this.disable = true;
            }
        },
        // This is turning on tab to agree with conditions & terms.
        CheckBoxOn: function () {
            this.CheckBox = true;
        },
        // If user agreed to all conditions and terms he is redirected to /chat
        CheckIfCheckBoxChecked: function () {
            if (this.CheckBoxText != "") {
                this.CheckBox = false;
                location.replace("/chat");
            }
        }
    },
    // When a new user joins the site, all users gets a signal which helps to update users count
    created() {
        socket.on("UpdateUsersNumber", (data) => {
            this.OnlineUsers = data;
        });
    }
});
var socket = io();
vueapp.mount("#app");
