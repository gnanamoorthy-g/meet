class MeetingRoom {
    constructor(user) {
        this.room_id = crypto.randomUUID();
        this.participants = [];
        this.isRecordingEnabled = false;
        this.createdBy = user
    }

    addParticipant(participant) {
        this.participants.push(participant);
    }

    exitParticipant(participant){
        this.participants = this.participants.filter(p => p.id !== participant.id);
    }
};

export default MeetingRoom;