import Participant from './participant.js';
import MeetingRoom from './room.js';

const timeElement = document.querySelector('.time');
timeElement.innerHTML = new Date();

const createMeetingBtn = document.querySelector('.create_meeting');
createMeetingBtn.addEventListener('click',(event) => {
    const user = new Participant("Klaus", "Kinski");
    console.log(user, "user");
    const meeting = new MeetingRoom(user);
    console.log(meeting, "roomId");
    const { protocol,host,pathname} = window.location;
    const targetUrl = `${protocol}//${host}${pathname}${meeting.room_id}`;
    window.location.replace(targetUrl);
});

const updateTime = () => {
    let curTime = new Date();
    timeElement.innerHTML = curTime;
};
const timeUpdateInterval = setInterval(updateTime,6000);
window.addEventListener('beforeunload',(event) => {
    clearInterval(timeUpdateInterval);
});

