import Participant from "./participant.js";
import { random_name_generator } from "./utils.js";

const path = window.location.pathname;
const meeting_id = path.replace("/", "");

var socket;
var meeting_room;
let localStream;
let gifSrc = "https://tenor.com/en-GB/view/static-tv-static-gif-19838894";
var exitRoomTimer
const peerConnections = {}; // Key: connectionId, Value: RTCPeerConnection
const remoteStreams = {};   // Key: connectionId, Value: MediaStream

//const SOCKET_URL = "http://192.168.29.138:8005";
const SOCKET_URL = "https://meet-socket-server.adaptable.app/";

let currentUser = JSON.parse(localStorage.getItem("user_info"));
if (!currentUser) {
  let name = random_name_generator();
  currentUser = new Participant(...name);
  localStorage.setItem("user_info", JSON.stringify(currentUser));
}

const video_self = document.getElementById("video_self");
const micBtn = document.querySelector('#mic_btn');
const videoBtn = document.querySelector('#video_btn');
const screenShareBtn = document.querySelector('#screen_share_btn');
const disconnectBtn = document.querySelector('#disconnect_btn');

const displayMediaOptions = {
  video: {
    displaySurface: "browser",
  },
  audio: {
    suppressLocalAudioPlayback: false,
  },
  preferCurrentTab: false,
  selfBrowserSurface: "exclude",
  systemAudio: "include",
  surfaceSwitching: "include",
  monitorTypeSurfaces: "include",
};

micBtn.addEventListener('click',function(event){
  const icons = { active : "mic",inActive : "mic_off" };
  let span = this.querySelector('span');
  currentUser.isMicEnabled = !currentUser.isMicEnabled;
  const audioTrack = localStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
  this.classList.toggle("btn-disabled");
  span.innerHTML = audioTrack.enabled ? icons.active :  icons.inActive;
});

videoBtn.addEventListener('click',function(event){
  const icons = { active : "videocam",inActive : "videocam_off" };
  let span = this.querySelector('span');
  currentUser.isCameraEnabled = !currentUser.isCameraEnabled;
  const videoTracks = localStream.getVideoTracks()[0];
  videoTracks.enabled = !videoTracks.enabled;
  this.classList.toggle("btn-disabled");
  span.innerHTML = videoTracks.enabled ? icons.active :  icons.inActive;
});

screenShareBtn.addEventListener('click',async function(event){
  const icons = { active : "screen_share",inActive : "stop_screen_share" };
  currentUser.isSharingScreen = !currentUser.isSharingScreen;
  let mediaStream;
  if(currentUser.isSharingScreen){
    try{
      mediaStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      console.log(mediaStream,"mediaStream");
    }
    catch(err){
      console.error(`Error: ${err}`);
    }
  }
  let span = this.querySelector('span');
  this.classList.toggle("btn-disabled");
  span.innerHTML = currentUser.isSharingScreen ? icons.active :  icons.inActive;
});

disconnectBtn.addEventListener('click',function(event){
  if(!socket) return;
  socket.emit("exit_user_from_room", {
    user: currentUser,
    meeting_id,
  });
  const { origin } = window.location;
  exitRoomTimer = setTimeout(()=>{
    window.location.replace(origin);
  },1000);
});

const initializeLocalStream = async () => {
  const constraints = {
    audio: currentUser.isMicEnabled || true,
    video: currentUser.isCameraEnabled || false,
  };
  try {
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log("localStream is ::::: ", localStream);
    const videoTracks = localStream.getVideoTracks();
    console.log(videoTracks, "videoTracks");
    video_self.srcObject = localStream;
    if (localStream) {
      localStream.onremovetrack = () => {
        console.log("Stream ended");
      };
    }
  } catch (e) {
    console.log(e,"error");
  }
  
};

initializeLocalStream();

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

const createNewConnection = async (emitter,connection_id) => {
  let peerConnection;
  let remoteStream;
  peerConnection = peerConnections[connection_id];
  remoteStream = remoteStreams[connection_id];
  if(!peerConnection){
    peerConnection = new RTCPeerConnection(servers);
    remoteStream = new MediaStream();
    console.log("**** new RTC connection created for id ::  "+connection_id + " ****");
    peerConnections[connection_id] = peerConnection;
    remoteStreams[connection_id] = remoteStream;
  }

  if(localStream){
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track,localStream);
    });
  }

  peerConnection.ontrack = (event) => {
    console.log("********onTrack  create new rtc****",event);
    remoteStream = event.streams[0]
    const remoteVideo = document.getElementById(connection_id);
    if(remoteVideo) remoteVideo.srcObject = remoteStream;
  };
  
  peerConnection.onicecandidate = async (event) => {
    console.log("New ICE candidate:: ", event.candidate);
    if(event.candidate){
      console.log(" *** gathering candidate finished ***");
      emitter('on_new_ice_candidate',event.candidate,connection_id);
    }
  }

  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  emitter('send_offer',offer,connection_id);
}

const acceptAnswerForOffer = async (answer,emitter,connection_id) => {
  console.log(" **** sdp answer received ::",answer);
  let peerConnection;
  let remoteStream;
  peerConnection = peerConnections[connection_id];
  remoteStream = remoteStreams[connection_id];

  if(!peerConnection){
    peerConnection = new RTCPeerConnection(servers);
    remoteStream = new MediaStream();
    console.log("**** new RTC connection created for id ::  "+connection_id + " ****");
    peerConnections[connection_id] = peerConnection;
    remoteStreams[connection_id] = remoteStream;
  }

  peerConnection.ontrack = (event) => {
    console.log("********onTrack --answer received****",event);
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
    const remoteVideo = document.getElementById(connection_id);
    if(remoteVideo) remoteVideo.srcObject = remoteStream;
  };

  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

  peerConnection.onicecandidate = async (event) => {
    console.log("New ICE candidate:: ", event.candidate);
    if(event.candidate){
      console.log(" *** gathering candidate finished ***");
      emitter('on_new_ice_candidate',event.candidate,connection_id);
    }
  };
}

const createAnswerForOffer = async (offer,emitter,connection_id) =>{
  console.log(" **** offer received ::",offer);
  let peerConnection;
  let remoteStream;
  peerConnection = peerConnections[connection_id];
  remoteStream = remoteStreams[connection_id];
  if(!peerConnection){
    peerConnection = new RTCPeerConnection(servers);
    remoteStream = new MediaStream();
    console.log("**** new RTC connection created for id ::  "+connection_id + " ****");
    peerConnections[connection_id] = peerConnection;
    remoteStreams[connection_id] = remoteStream;
  }

  if(localStream){
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track,localStream);
    });
  }

  peerConnection.ontrack = (event) => {
    console.log("********onTrack --created answer****",event);
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
    const remoteVideo = document.getElementById(connection_id);
    if (remoteVideo) remoteVideo.srcObject = remoteStream;
  };

  await peerConnection.setRemoteDescription( new RTCSessionDescription(offer));

  peerConnection.onicecandidate = async (event) => {
    console.log("New ICE candidate:: ", event.candidate);
    if(event.candidate){
      console.log(" *** gathering candidate finished ***");
      emitter('on_new_ice_candidate',event.candidate,connection_id);
    }
  };

  let answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  console.log("answer :: ", answer);
  emitter("send_answer", answer, connection_id);
}

const addIceCandidate = (candidate, connection_id) => {
  console.log(" **** new ice candidate received ::",candidate);
  let peerConnection;
  let remoteStream;
  peerConnection = peerConnections[connection_id];
  remoteStream = remoteStreams[connection_id];

  if(!peerConnection){
    peerConnection = new RTCPeerConnection(servers);
    remoteStream = new MediaStream();
    console.log("**** new RTC connection created for id ::  "+connection_id + " ****");
    peerConnections[connection_id] = peerConnection;
    remoteStreams[connection_id] = remoteStream;
  }
  peerConnection.addIceCandidate( new RTCIceCandidate(candidate));
}

const create_signaling_server = (user, meeting_room) => {
  socket = io(SOCKET_URL, { autoConnect: true });

  var signalEmitter = (event,data, connection_id) =>{
    socket.emit(event,{
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

  socket.on("notify_participants_about_joined_user", (data) => {
    let { meeting, new_connection_id, joined_user} = data;
    console.log(" *** new user :: " + joined_user.firstName + "  joined");
    meeting_room = meeting;
    render_meeting(meeting_room);
    if(joined_user.id === currentUser.id) return;
    createNewConnection(signalEmitter,new_connection_id);
  });

  socket.on("notify_participants_about_exited_user", (data) => {
    let { meeting, exited_connection_id, exited_user} = data;
    console.log(" *** user :: " + exited_user.firstName + "  left");
    meeting_room = meeting;
    render_meeting(meeting_room);
  });

  socket.on("receive_offer",(data) => {
    console.log(" *** offer received :: ",data);
    let { message , from} = data;
    createAnswerForOffer(message,signalEmitter,from);
  });

  socket.on("receive_answer",(data) => {
    console.log(" *** answer received :: ",data);
    let { message , from} = data;
    acceptAnswerForOffer(message,signalEmitter,from);
  });

  socket.on("receive_ice_candidate", (data) => {
    console.log(" *** ice candidate received :: ",data);
    let { candidate , from} = data;
    addIceCandidate(candidate, from);
  });
};

create_signaling_server(currentUser, meeting_room);

window.addEventListener("beforeunload", (event) => {
  socket.close();
  clearTimeout(exitRoomTimer);
});