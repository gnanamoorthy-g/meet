import Participant from "./participant.js";
import MeetingRoom from "./room.js";

const timeElement = document.querySelector(".time");
timeElement.innerHTML = new Date();

var socket;
//const SOCKET_URL = "http://localhost:8005";
const SOCKET_URL = "https://meet-server-nine.vercel.app";
var createRoomTimer;

const createMeetingBtn = document.querySelector(".create_meeting");
createMeetingBtn.addEventListener("click", function (event) {
    const user = new Participant("Klaus", "Kinski");
    const meeting = new MeetingRoom(user);
    this.classList.toggle("button--loading");
    create_signaling_server(user, meeting);
    const { protocol, host, pathname } = window.location;
    const targetUrl = `${protocol}//${host}${pathname}${meeting.room_id}`;
    createRoomTimer = setTimeout(() => {
        window.location.replace(targetUrl);
    }, 5000);
});

const create_signaling_server = (user, meeting) => {
    socket = io(SOCKET_URL);
    socket.on("connect", () => {
        if (socket.connected) {
            socket.emit("user_joined_meeting_room", {
                user,
                meeting,
            });
        }
    });
    socket.on("notify_participants", (data) => {
        console.log(data, "notification");
    });
};

const updateTime = () => {
    let curTime = new Date();
    timeElement.innerHTML = curTime;
};
const timeUpdateInterval = setInterval(updateTime, 6000);
window.addEventListener("beforeunload", (event) => {
    socket.close();
    clearTimeout(createRoomTimer);
    clearInterval(timeUpdateInterval);
});
