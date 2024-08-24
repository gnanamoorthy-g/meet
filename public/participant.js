class Participant {
    static PREFIX = 'mup';
    static generateUserId() {
        let user_id = crypto.randomUUID().replace("-", "").substring(0, 12);
        return Participant.PREFIX + user_id;
    }
    constructor(firstName, lastName) {
        this.id = Participant.generateUserId();
        this.firstName = firstName;
        this.lastName = lastName;
        this.isMicEnabled = true;
        this.isCameraEnabled = false;
        this.isSharingScreen = false;
    }
};

export default Participant;