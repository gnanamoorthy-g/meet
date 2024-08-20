import Participant from './participant.js';
import MeetingRoom from './room.js';


const user = new Participant('Klaus','Kinski');
console.log(user,"user");
const meeting = new MeetingRoom(user);
console.log(meeting,"roomId");

const video = document.getElementById('video_player');

const constraints = {
    audio : true,
    video : true
};

navigator
.mediaDevices
.getUserMedia(constraints)
.then((stream) => {
    const videoTracks = stream.getVideoTracks();
    console.log(videoTracks,"videoTracks");
    stream.onremovetrack = () => {
        console.log("Stream ended");
    };
    video.srcObject = stream;
})
.catch((error) => {
    if (error.name === "OverconstrainedError") {
      console.error(
        `The resolution ${constraints.video.width.exact}x${constraints.video.height.exact} px is not supported by your device.`,
      );
    } else if (error.name === "NotAllowedError") {
      console.error(
        "You need to grant this page permission to access your camera and microphone.",
      );
    } else {
      console.error(`getUserMedia error: ${error.name}`, error);
    }
});
