declare const firebase: any;

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {
    
    // add bgm to the scene
    @property(cc.AudioClip)
    bgm: cc.AudioClip = null;

    user = null;

    onLoad () {
        this.user = firebase.auth().currentUser;
    }

    async start () {
        // play bgm
        cc.audioEngine.playMusic(this.bgm, true);

        let win_num: number = -1;
        await firebase.database().ref('Users/' + this.user.uid).once('value').then(async(snapshot) => {
            if(snapshot){ 
                let datas = snapshot.val();
                if(datas){
                    win_num = Object.values(datas)[3] as number;
                }
            }
        })

        let updates = {};
        
        ++win_num;
        updates['win_num'] = win_num;
        firebase.database().ref('Users/' + this.user.uid).update(updates);
    }

    // update (dt) {}
}
