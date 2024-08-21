class MeetingRoom {
    constructor(user) {
        this.room_id = crypto.randomUUID();
        this.participants = [];
        this.addParticipant(user);
        this.isRecordingEnabled = false;
        this.createdBy = user
    }

    addParticipant(participant) {
        this.participants.push(participant);
    }
};

export default MeetingRoom;