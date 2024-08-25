import Participant from "./participant.js";
import MeetingRoom from "./room.js";

const timeElement = document.querySelector(".time");
timeElement.innerHTML = new Date();

var socket;
const SOCKET_URL = "http://192.168.29.138:8005";
//const SOCKET_URL = "https://meet-socket-server.adaptable.app/";
var createRoomTimer;

let currentUser = JSON.parse(localStorage.getItem("user_info"));
if (!currentUser) {
  currentUser = new Participant(...random_name_generator());
  localStorage.setItem("user_info", JSON.stringify(currentUser));
}

const createMeetingBtn = document.querySelector(".create_meeting");
createMeetingBtn.addEventListener("click", function (event) {
  const meeting_room = new MeetingRoom(currentUser);
  this.classList.toggle("button--loading");
  create_signaling_server(currentUser,meeting_room);
  const { protocol, host, pathname } = window.location;
  const targetUrl = `${protocol}//${host}${pathname}${meeting_room.room_id}`;
  createRoomTimer = setTimeout(() => {
    window.location.replace(targetUrl);
  }, 2500);
});

const create_signaling_server = (user,meeting_room) => {
  socket = io(SOCKET_URL, { autoConnect: true });
  socket.on("connect", () => {
    console.log(socket, "socket");
    if (socket.connected) {
      socket.emit("create_room", { meeting_room });
    }
  });
  socket.on("disconnect", (reason) => {
    if(meeting_room)
    socket.emit("exit_user_from_room", {
        user,
      meeting_room,
    });
    console.log(reason, "reason");
  });
};

const updateTime = () => {
  let curTime = new Date();
  timeElement.innerHTML = curTime;
};
const timeUpdateInterval = setInterval(updateTime, 60000);
window.addEventListener("beforeunload", (event) => {
  if(socket) socket.close();
  clearTimeout(createRoomTimer);
  clearInterval(timeUpdateInterval);
});
