import Participant from "./participant.js";
import { random_name_generator } from "./utils.js";

const path = window.location.pathname;
const meeting_id = path.replace("/", "");

var socket;
var meeting_room;
const SOCKET_URL = "http://localhost:8005";
//const SOCKET_URL = "https://meet-socket-server.adaptable.app/";

let currentUser = JSON.parse(localStorage.getItem("user_info"));
if (!currentUser) {
  currentUser = new Participant(...random_name_generator());
  localStorage.setItem("user_info", JSON.stringify(currentUser));
}


const micBtn = document.querySelector('#mic_btn');
const videoBtn = document.querySelector('#video_btn');
const screenShareBtn = document.querySelector('#screen_share_btn');
const disconnectBtn = document.querySelector('#disconnect_btn');

micBtn.addEventListener('click',function(event){
  this.classList.toggle("btn-disabled");
  currentUser.isMicEnabled = !currentUser.isMicEnabled;
});

videoBtn.addEventListener('click',function(event){
  this.classList.toggle("btn-disabled");
  currentUser.isCameraEnabled = !currentUser.isCameraEnabled;
});

screenShareBtn.addEventListener('click',function(event){
  this.classList.toggle("btn-disabled");
  currentUser.isSharingScreen = !currentUser.isSharingScreen;
});

disconnectBtn.addEventListener('click',function(event){
  if(!socket) return;
  socket.emit("exit_user_from_room", {
    user: currentUser,
    meeting_id,
  });
  const { origin } = window.location;
  window.location.replace(origin);
});

const create_signaling_server = (user, meeting_room) => {
  socket = io(SOCKET_URL, { autoConnect: true });
  socket.on("connect", () => {
    console.log(socket, "socket");
    console.log(socket.id,"sessionID");

    socket.emit("poll_meeting",{ meeting_id, connectionId : socket.id });

    socket.on('get_meeting_room',(data)=>{
      let { room } = data;
      meeting_room = room;
      console.log(meeting_room,"room");
      if (socket.connected) {
        socket.emit("user_joined_meeting_room", {
          user,
          meeting_room,
        });
      }
    });
  });
  socket.on("disconnect", (reason) => {
    socket.emit("exit_user_from_room", {
      user: currentUser,
      meeting_room,
    });
    console.log(reason, "reason");
  });
  socket.on("notify_participants", (data) => {
    console.log(data, "notification");
    meeting_room = data;
    render_meeting(meeting_room);

  });
};
create_signaling_server(currentUser, meeting_room);

const video_self = document.getElementById("video_self");

const constraints = {
  audio: currentUser.isMicEnabled || false,
  video: currentUser.isCameraEnabled || true,
};

navigator.mediaDevices
  .getUserMedia(constraints)
  .then((stream) => {
    const videoTracks = stream.getVideoTracks();
    console.log(videoTracks, "videoTracks");
    stream.onremovetrack = () => {
      console.log("Stream ended");
    };
    video_self.srcObject = stream;
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

const render_meeting = (meeting) => {
  const container = document.getElementById("canvas_container");
  container.innerHTML = null;
  const {participants = []} = meeting;
  const otherParticipants = participants.filter(p => p.id !== currentUser.id);
  const participant_stream_nodes = [video_self];
  otherParticipants.forEach((participant, index) =>{
    if(participant.id === currentUser.id) return;
    const video = document.createElement('video');
    video.id = participant.id;
    video.crossOrigin = 'anonymous';
    video.autoplay = true;
    participant_stream_nodes.push(video);
  });
  container.append(...participant_stream_nodes);
}