import Participant from "./participant.js";
import { random_name_generator } from "./utils.js";

const path = window.location.pathname;
const meeting_id = path.replace("/", "");

var socket;
var meeting_room;
let localStream;
let remoteStream;
let peerConnection;
const SOCKET_URL = "http://localhost:8005";
//const SOCKET_URL = "https://meet-socket-server.adaptable.app/";

let currentUser = JSON.parse(localStorage.getItem("user_info"));
if (!currentUser) {
  currentUser = new Participant(...random_name_generator());
  localStorage.setItem("user_info", JSON.stringify(currentUser));
}

const video_self = document.getElementById("video_self");
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

const initializeLocalStream = async () => {
  const constraints = {
    audio: currentUser.isMicEnabled || false,
    video: currentUser.isCameraEnabled || true,
  };
  localStream = await navigator.mediaDevices.getUserMedia(constraints);
  const videoTracks = localStream.getVideoTracks();
  console.log(videoTracks, "videoTracks");
  video_self.srcObject = localStream;
  localStream.onremovetrack = () => {
    console.log("Stream ended");
  };
};

const processIceCandidate = (sdp_func,candidate,connectionId) =>{
  if(sdp_func && sdp_func instanceof Function) sdp_func(candidate,connectionId);
}

const handleIncomingSDP = async (sdp_func, message, from) => {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection(servers);
    remoteStream = new MediaStream();
    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      const remoteVideo = document.getElementById(from);
      if (remoteVideo) {
        remoteVideo.srcObject = remoteStream;
      } else {
        const newVideo = document.createElement("video");
        newVideo.id = from;
        newVideo.srcObject = remoteStream;
        newVideo.autoplay = true;
        document.getElementById("canvas_container").appendChild(newVideo);
      }
    };
  }
  if (message.offer) {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(message.offer)
    );
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    sdp_func(JSON.stringify({ answer: peerConnection.localDescription }), from);
  } else if (message.answer) {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(message.answer)
    );
  } else if (message.iceCandidate) {
    try {
      await peerConnection.addIceCandidate(
        new RTCIceCandidate(message.iceCandidate)
      );
    } catch (e) {
      console.error("Error adding received ICE candidate", e);
    }
  }
};

const createOffer = async (sdp_func,connectionId) =>{
  peerConnection = new RTCPeerConnection(servers);
  remoteStream = new MediaStream();

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track,localStream);
  });

  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
    const remoteVideo = document.getElementById(connectionId);
    if(remoteVideo) remoteVideo.srcObject = remoteStream;
  };

  peerConnection.onicecandidate = async (event) => {
    if(event.candidate){
      console.log("New ICE candidate:: ", event.candidate);
      let candidate = JSON.stringify({iceCandidate : event.candidate});
      processIceCandidate(sdp_func,candidate,connectionId);
    }
  }

  peerConnection.onnegotiationneeded = async (event) => {
    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log("offer :: ", offer);
    if(sdp_func && sdp_func instanceof Function){
      sdp_func(JSON.stringify({offer : peerConnection.localDescription}),connectionId);
    }
  };
}

const initMeeting = async (meeting_room,sdp_func, connectionId,) => {
  await initializeLocalStream();
  createOffer(sdp_func,connectionId);
}

const render_meeting = (meeting) => {
  const container = document.getElementById("canvas_container");
  container.innerHTML = null;
  const {participants = []} = meeting;
  const otherParticipants = participants.filter(p => p.id !== currentUser.id);
  const participant_stream_nodes = [video_self];
  otherParticipants.forEach((participant, index) =>{
    if(participant.id === currentUser.id) return;
    const video = document.createElement('video');
    video.id = participant.connectionId;
    video.crossOrigin = 'anonymous';
    video.autoplay = true;
    participant_stream_nodes.push(video);
  });
  container.append(...participant_stream_nodes);
}

const servers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun.l.google.com:5349" },
  ],
};

const create_signaling_server = (user, meeting_room) => {
  socket = io(SOCKET_URL, { autoConnect: true });

  var SDP_function = (data, connection_id) =>{
    socket.emit("SDP_PROCESS",{
      message : data,
      meeting_id : meeting_id,
      to : connection_id
    })
  };

  socket.on("connect", () => {
    console.log(socket, "socket");
    console.log(socket.id,"sessionID");

    socket.emit("poll_meeting",{ meeting_id, connectionId : socket.id });

    socket.on('get_meeting_room',(data)=>{
      let { room } = data;
      meeting_room = room;
      console.log(meeting_room,"room");
      initMeeting(meeting_room,SDP_function,socket.id);
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

  socket.on("sync_meeting_info",(data) => {
    console.log(data, "meeting_synced for self");
    meeting_room = data;
    render_meeting(meeting_room);
  });

  socket.on("notify_participants", (data) => {
    let { meeting, new_connection_id, joined_user} = data;
    console.log(" *** new user :: " + joined_user.firstName + "  joined");
    console.log(data, "notification");
    meeting_room = meeting;
    createOffer(SDP_function,new_connection_id);
    render_meeting(meeting_room);

  });
  socket.on("SDP_PROCESS", async (data) =>{
    let { message , from} = data;
    message = JSON.parse(message);
    if(message.offer){

    }
    console.log(data,"On server event --");
    await handleIncomingSDP(SDP_function,message, from);
  })
};

create_signaling_server(currentUser, meeting_room);

window.addEventListener("beforeunload", (event) => {
  socket.close();
});