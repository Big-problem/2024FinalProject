declare const firebase: any;

const {ccclass, property} = cc._decorator;

@ccclass
export default class Menu extends cc.Component {

    // add bgm to the scene
    @property(cc.AudioClip)
    bgm: cc.AudioClip = null;

    user = null;
    start () {
        this.user = firebase.auth().currentUser;
        cc.find('Persist').getComponent('Persist').user = this.user;
        // if there is no bgm playing, play bgm
        cc.audioEngine.playMusic(this.bgm, true);

        this.open_ranking();
    }

    // update (dt) {}

    async StartMatching() {
        // stop music
        cc.audioEngine.stopMusic();
        cc.director.loadScene('Main');
        // firebase.database().ref('WaitingPlayer/').once('value').then(async(snapshot) => {
        //     if(snapshot){ 
        //         let waitingPlayer = snapshot.val();
        //         let userID = this.user.uid;
        //         let userName = this.user.displayName;
        //         if(waitingPlayer){ // 成功匹配
        //             let rivalId = Object.keys(waitingPlayer)[0];
        //             let rivalName = Object.values(Object.values(waitingPlayer)[0])[0];
        //             console.debug(rivalId, rivalName)
                    
        //             let updates = {}; // 建立對戰房間
        //             updates[rivalId] = {rivalName: rivalName, status: 'waiting'};
        //             updates[userID] = {userName: userName, status: 'enter'};

        //             let roomId = (rivalId + this.user.uid);

        //             cc.find('Persist').getComponent('Persist').player = 'A';
        //             cc.find('Persist').getComponent('Persist').roomId = roomId;
        //             cc.find('Persist').getComponent('Persist').rivalId = rivalId;

        //             await firebase.database().ref('Rooms/' + roomId).set(updates);

        //             await firebase.database().ref('WaitingPlayer/' + rivalId).remove(); // 從等待列表移除

        //         }
        //         else{ // 沒人在等
        //             firebase.database().ref('WaitingPlayer/' + userID).set({
        //                 userName: userName
        //             });
        //             cc.find('Persist').getComponent('Persist').player = 'A';
        //             console.debug("Waiting...");

        //             //TODO: 監聽Rooms, 若讀到自己的userID, change the status to 'enter'
        //             firebase.database().ref('Rooms').on('value', snapshot => {
        //                 // firebase.database().ref('Rooms/').once('value').then(async(snapshot) => {
        //                 const roomData = snapshot.val();
        //                 if(roomData){
        //                     for(let [key, value] of Object.entries(roomData)){
        //                         console.debug(Object.keys(value)[0], Object.keys(value)[1]);
        //                         if(Object.keys(value)[0] === this.user.uid){
        //                             firebase.database().ref('Rooms/' + key + '/' + this.user.uid).update({
        //                                 status: 'enter'
        //                             });
        //                         }
        //                         else if(Object.keys(value)[1] === this.user.uid){
        //                             firebase.database().ref('Rooms/' + key + '/' + this.user.uid).update({
        //                                 status: 'enter'
        //                             });
        //                         }
        //                     }
        //                 }
        //             })
        //         }   
        //     }
        // }).catch((error) => {
        //     console.error("Error reading database:", error);
        // })
    }

    async open_ranking() {
        
        const ranking = [];
        await firebase.database().ref('Users/').once('value').then(async(snapshot) => {
            if(snapshot){
                let datas = snapshot.val();
                if(datas){ 
                    Object.entries(datas).forEach(([key, value]: [any, any]) => {
                        ranking.push({
                            name: value.username,
                            win_num: value.win_num
                        })
                    })
                    // console.debug(ranking);
                    ranking.sort((a, b) => b.win_num - a.win_num);
                    console.debug("Ranking: ", ranking);
                }
            }
        })
        
        // something.active = true;
    }
}
