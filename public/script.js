import Participant from "./participant.js";
import MeetingRoom from "./room.js";
import { random_name_generator } from "./utils.js";

const path = window.location.pathname;
const meeting_id = path.replace("/", "");
console.log(meeting_id);

var socket;
//const SOCKET_URL = "http://localhost:8005";
const SOCKET_URL = "https://meet-server-nine.vercel.app";

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

const meeting = new MeetingRoom();
meeting.room_id = meeting_id;

let currentUser = JSON.parse(localStorage.getItem("user_info"));
if (!currentUser) {
  currentUser = new Participant(...random_name_generator());
  localStorage.setItem("user_info", JSON.stringify(currentUser));
}
create_signaling_server(currentUser, meeting);
const video = document.getElementById("video_player");

const constraints = {
  audio: true,
  video: true,
};

navigator.mediaDevices
  .getUserMedia(constraints)
  .then((stream) => {
    const videoTracks = stream.getVideoTracks();
    console.log(videoTracks, "videoTracks");
    stream.onremovetrack = () => {
      console.log("Stream ended");
    };
    video.srcObject = stream;
  })
  .catch((error) => {
    if (error.name === "OverconstrainedError") {
      console.error(
        `The resolution ${constraints.video.width.exact}x${constraints.video.height.exact} px is not supported by your device.`
      );
    } else if (error.name === "NotAllowedError") {
      console.error(
        "You need to grant this page permission to access your camera and microphone."
      );
    } else {
      console.error(`getUserMedia error: ${error.name}`, error);
    }
  });

window.addEventListener("beforeunload", (event) => {
  socket.close();
});