declare const firebase: any;

import Info from "./Info";
import KeyboardManager from "./KeyboardManager";
import Shake from "./Shake";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    @property(cc.Prefab)
    heavyBandit: cc.Prefab = null;
    @property(cc.Prefab)
    heavyBanditEnemy: cc.Prefab = null;
    @property(cc.Prefab)
    kunoichiEnemy: cc.Prefab = null;
    @property(cc.Prefab)
    kunoichi: cc.Prefab = null;
    @property(cc.Prefab)
    fireWizard: cc.Prefab = null;
    @property(cc.Prefab)
    fireWizardEnemy: cc.Prefab = null;

    @property(cc.SpriteFrame)
    level1Sprite: cc.SpriteFrame = null;
    @property(cc.SpriteFrame)
    level2Sprite: cc.SpriteFrame = null;
    @property(cc.SpriteFrame)
    level3Sprite: cc.SpriteFrame = null;
    @property(cc.SpriteFrame)
    level4Sprite: cc.SpriteFrame = null;
    @property(cc.SpriteFrame)
    level5Sprite: cc.SpriteFrame = null;

    @property(cc.Button)
    HeavyBanditBtn: cc.Button = null;
    @property(cc.Button)
    KunoichiBtn: cc.Button = null;
    @property(cc.Button)
    fireWizardBtn: cc.Button = null;
    @property(cc.Button)
    levelUpBtn: cc.Button = null;

    @property(cc.Node)
    enemy_base:cc.Node=null;

    @property(cc.Node)
    base:cc.Node=null;

    @property(cc.Node)
    blood:cc.Node=null;

    // add bgm to the scene
    @property(cc.AudioClip)
    bgm: cc.AudioClip = null;

    // add waiting bgm to the scene
    @property(cc.AudioClip)
    waiting_bgm: cc.AudioClip = null;

    @property(cc.Node)
    camera: cc.Node = null;

    user = null;
    roomId = null;
    rivalId = null;
    rivalName = null;

    money: number = 0;
    moneyLimitForEachLevel: number[] = [300, 400, 500, 600, 700];
    moneyUpdateSpeed: number = 5;

    level: number = 1;
    maxLevel: number = 5;
    expNeedForEachLevel: number[] = [100, 150, 200, 250, 300];
    currentExp: number = 0;
    costForExp: number = 10;

    heavyBanditCost: number = 10;
    kunoichiCost: number = 20;
    fireWizardCost: number = 40;

    isHeavyBanditCoolDown: boolean = false;
    isKunoichiCoolDown: boolean = false;
    isFireWizardCoolDown: boolean = false;
    heavyBanditCoolDownTime: number = 0;
    kunoichiCoolDownTime: number = 0;
    fireWizardCoolDownTime: number = 0;
    heavyBanditCoolDownDuration: number = 2;
    kunoichiCoolDownDuration: number = 4;
    fireWizardCoolDownDuration: number = 3;

    gameStart: boolean = false;
    alliance_arr: cc.Node[] = [];
    enemy_arr: cc.Node[] = [];

    invincible: boolean = false; // false為玩家A，true為玩家B
    index: number = 0; // 玩家A召喚的 > 0, 玩家B召喚的 < 0
    gameOver: boolean = false;

    blood_exist: boolean = false;

    onLoad () {
        this.user = firebase.auth().currentUser;
        cc.director.getPhysicsManager().enabled = true;
        this.base.getComponent(Info).index=100000;
        this.base.x = 1600;
        this.enemy_base.getComponent(Info).index=-100000;
        this.enemy_base.x = -640;
        this.alliance_arr.push(this.base);
        this.enemy_arr.push(this.enemy_base);
        // 看碰撞體
        // cc.director.getPhysicsManager().debugDrawFlags = cc.PhysicsManager.DrawBits.e_aabbBit |
        //     // cc.PhysicsManager.DrawBits.e_pairBit |
        //     // cc.PhysicsManager.DrawBits.e_centerOfMassBit |
        //     cc.PhysicsManager.DrawBits.e_jointBit |
        //     cc.PhysicsManager.DrawBits.e_shapeBit
        //     ;
    }
    listen1() { // 玩家A, 負責計算
        cc.audioEngine.stopMusic();
        cc.audioEngine.playMusic(this.bgm, true);
        this.index = 1;
        const playerA = firebase.database().ref('Rooms/' + this.roomId + '/' + this.user.uid).on('child_added', snapshot => {
            if(!this.gameStart) return;
            let message = snapshot.val();
            //let type = Object.keys(message)[1];
            let id: number = Object.values(message)[1] as number;
            let time: number = Object.values(message)[3] as number;
            let index: number = Object.values(message)[0] as number;
            let mode: string = Object.values(message)[2] as string;
            // console.log('Enemy: ', type, ' time: ', time, ' index: ', index, ' mode: ', mode);
            if(mode === 'castleHurt'){
                if(index === 100000){
                    this.scheduleOnce(() => {
                        const life_percent = id / this.base.getComponent(Info).default_life;
                        this.base.children[1].getComponent(cc.Sprite).fillRange = life_percent;
                        if (life_percent < 0.667 && life_percent > 0.333) {
                            this.base.getComponent(cc.Animation).play('little_fire');
                        }
                        else if (life_percent < 0.333) {
                            this.base.getComponent(cc.Animation).play('big_fire');
                        }
                        this.getComponent(Shake).play();
                        if(!this.blood_exist) this.SoManyBlood()
                    }, ((time+300)-Date.now())/1000)
                }
                else{
                    this.scheduleOnce(() => {
                        const life_percent = id / this.enemy_base.getComponent(Info).default_life;
                        this.enemy_base.children[1].getComponent(cc.Sprite).fillRange = life_percent;
                        if (life_percent < 0.667 && life_percent > 0.333) {
                            this.enemy_base.getComponent(cc.Animation).play('little_fire');
                        }
                        else if (life_percent < 0.333) {
                            this.enemy_base.getComponent(cc.Animation).play('big_fire');
                        }
                    }, ((time+300)-Date.now())/1000)
                }
            }
            //if(type === 'minion'){
            else if(mode === 'die'){
                console.debug("GG: ", index)
                if(index === 100000) {
                    this.scheduleOnce(() => {
                        firebase.database().ref('Rooms/' + this.roomId).remove(); // 移除對戰房間
                        firebase.database().ref('Rooms/' + this.roomId + '/' + this.user.uid).off('child_added', playerA);
                        this.gameOver = true;
                        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN);
                        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP);
                        // stop bgm
                        cc.audioEngine.stopMusic();
                        this.getComponent(Shake).stop = true;
                        this.scheduleOnce(() => {
                            this.camera.x = 760;
                        }, 0.6);
                        this.base.getComponent(cc.Animation).play('explode');
                        this.scheduleOnce(() => {
                            cc.director.loadScene('Lose');
                        }, 3);
                    }, ((time+300)-Date.now())/1000)
                }
                else if(index === -100000){
                    this.scheduleOnce(() => {
                        firebase.database().ref('Rooms/' + this.roomId).remove(); // 移除對戰房間
                        firebase.database().ref('Rooms/' + this.roomId + '/' + this.user.uid).off('child_added', playerA);
                        this.gameOver = true;
                        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN);
                        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP);
                        // stop bgm
                        cc.audioEngine.stopMusic();
                        this.getComponent(Shake).stop = true;
                        this.scheduleOnce(() => {
                            this.camera.x = -750;
                        }, 0.6);
                        this.enemy_base.getComponent(cc.Animation).play('explode');
                        this.scheduleOnce(() => {
                            cc.director.loadScene('win');
                        }, 3);
                    }, ((time+300)-Date.now())/1000)
                }
                else if(index > 0) {
                    for(let i of this.alliance_arr) {
                        if(i.getComponent(Info).index === index){
                            this.scheduleOnce(() => {
                                i.getComponent(Info).die();
                            }, ((time+300)-Date.now())/1000)
                        }
                    }
                }
                else {
                    for(let i of this.enemy_arr) {
                        if(i.getComponent(Info).index === index){
                            this.scheduleOnce(() => {
                                i.getComponent(Info).die();
                            }, ((time+300)-Date.now())/1000)
                        }
                    }
                }
            }
            else if(mode === 'gen'){
                if(id === 1){
                    this.scheduleOnce(() => {
                        this.HeavyBandit(index);
                    }, ((time+500)-Date.now())/1000);
                }
                else if(id === 2){
                    this.scheduleOnce(() => {
                        this.Kunoichi(index);
                    }, ((time+500)-Date.now())/1000);
                }
                else if(id === 3){
                    this.scheduleOnce(() => {
                        this.FireWizard(index);
                    }, ((time+500)-Date.now())/1000);
                } 
            }
            else if(mode === 'genEnemy'){
                if(id === 1){
                    this.scheduleOnce(() => {
                        this.HeavyBanditEnemy(index);
                    }, ((time+500)-Date.now())/1000);
                }
                else if(id === 2){
                    this.scheduleOnce(() => {
                        this.KunoichiEnemy(index);
                    }, ((time+500)-Date.now())/1000);
                } 
                else if(id === 3){
                    this.scheduleOnce(() => {
                        this.FireWizardEnemy(index);
                    }, ((time+500)-Date.now())/1000);
                }
            }
            //}
            
            
        })

        if(!this.gameStart){
            console.debug("listen1:",this.base,this.enemy_base);
            this.gameStart = true;
            cc.find('ColorBlack').active = false;
            cc.find('Canvas/Main Camera/heavyBanditBtn').active = true;
            cc.find('Canvas/Main Camera/kunoichiBtn').active = true;
            cc.find('Canvas/Main Camera/fireWizardBtn').active = true;
            cc.find('Canvas/Main Camera/levelUpBtn').active = true;
            cc.find('Canvas/Main Camera/background').active = true;
            cc.find('Canvas/Main Camera/Navbar').active = true;
            cc.find('Canvas/Main Camera/level').active = true;
            cc.find('Canvas/Main Camera/levelProgressBar').active = true;
            cc.find('Canvas/Main Camera/levelProgressBarBg').active = true;
            cc.find('Canvas/Main Camera/Coin').active = true;
            cc.find('Canvas/Main Camera/coinCount').active = true;
            this.getComponent(KeyboardManager).enableKeyboard();
        }
    }
    listen2() { // 玩家B, 不負責計算
        cc.audioEngine.stopMusic();
        cc.audioEngine.playMusic(this.bgm, true);
        this.index = -1
        this.invincible = true;
        this.alliance_arr[0].getComponent(Info).index=-100000;
        this.enemy_arr[0].getComponent(Info).index=100000;
        // console.debug("RoomID: ", this.roomId, ' rivalID: ', this.rivalId, 'rivalName: ', this.rivalName)
        const playerB = firebase.database().ref('Rooms/' + this.roomId + '/' + this.rivalId).on('child_added', snapshot => {
            if(!this.gameStart) return;
            let message = snapshot.val();
           // let type = Object.keys(message)[1];
            let id: number = Object.values(message)[1] as number;
            let time: number = Object.values(message)[3] as number;
            let index: number = Object.values(message)[0] as number;
            let mode: string = Object.values(message)[2] as string;
            // console.log('Enemy: ', type, ' time: ', time, ' index: ', index, ' mode: ', mode);
            if(mode === 'castleHurt'){
                if(index === -100000){
                    this.scheduleOnce(() => {
                        console.debug("CASTLE HURT");
                        const life_percent = id / this.base.getComponent(Info).default_life;
                        this.base.children[1].getComponent(cc.Sprite).fillRange = life_percent;
                        if (life_percent < 0.667 && life_percent > 0.333) {
                            this.base.getComponent(cc.Animation).play('little_fire');
                        }
                        else if (life_percent < 0.333) {
                            this.base.getComponent(cc.Animation).play('big_fire');
                        }
                        if(!this.blood_exist) this.SoManyBlood()
                        this.getComponent(Shake).play();
                    }, ((time+300)-Date.now())/1000)
                }
                else{
                    this.scheduleOnce(() => {
                        const life_percent = id / this.enemy_base.getComponent(Info).default_life;
                        this.enemy_base.children[1].getComponent(cc.Sprite).fillRange = life_percent;
                        if (life_percent < 0.667 && life_percent > 0.333) {
                            this.enemy_base.getComponent(cc.Animation).play('little_fire');
                        }
                        else if (life_percent < 0.333) {
                            this.enemy_base.getComponent(cc.Animation).play('big_fire');
                        }
                    }, ((time+300)-Date.now())/1000)
                }
            }
            //if(type === 'minion'){
            if(mode === 'die'){
                console.debug("GG: ", index)
                if(index === 100000) {
                    this.scheduleOnce(() => {
                        firebase.database().ref('Rooms/' + this.roomId + '/' + this.rivalId).off('child_added', playerB);
                        this.gameOver = true;
                        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN);
                        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP);
                        // stop bgm
                        cc.audioEngine.stopMusic();
                        this.getComponent(Shake).stop = true;
                        this.scheduleOnce(() => {
                            this.camera.x = -750;
                        }, 0.6);
                        this.enemy_base.getComponent(cc.Animation).play('explode');
                        this.scheduleOnce(() => {
                            cc.director.loadScene('win');
                        }, 3);
                    }, ((time+300)-Date.now())/1000)
                }
                else if(index === -100000){
                    this.scheduleOnce(() => {
                        firebase.database().ref('Rooms/' + this.roomId + '/' + this.rivalId).off('child_added', playerB);
                        this.gameOver = true;
                        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN);
                        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP);
                        // stop bgm
                        cc.audioEngine.stopMusic();
                        this.getComponent(Shake).stop = true;
                        this.scheduleOnce(() => {
                            this.camera.x = 760;
                        }, 0.6);
                        this.base.getComponent(cc.Animation).play('explode');
                        this.scheduleOnce(() => {
                            cc.director.loadScene('Lose');
                        }, 3);
                    }, ((time+300)-Date.now())/1000)
                } 
                else if(index > 0) {
                    for(let i of this.enemy_arr) {
                        console.debug(i.getComponent(Info).index);
                        if(i.getComponent(Info).index === index){
                            this.scheduleOnce(() => {
                                i.getComponent(Info).die();
                            }, ((time+300)-Date.now())/1000)
                        }
                    }
                }
                else {
                    for(let i of this.alliance_arr) {
                        if(i.getComponent(Info).index === index){
                            this.scheduleOnce(() => {
                                i.getComponent(Info).die();
                            }, ((time+300)-Date.now())/1000)
                        }
                    }
                }
            }
            else if(mode === 'gen'){
                if(id === 1){ 
                    this.scheduleOnce(() => {
                        this.HeavyBanditEnemy(index);
                    }, ((time+500)-Date.now())/1000);
                }
                else if(id === 2){
                    // console.debug("FUCK")
                    this.scheduleOnce(() => {
                        this.KunoichiEnemy(index);
                    }, ((time+500)-Date.now())/1000);
                }
                else if(id === 3){
                    this.scheduleOnce(() => {
                        this.FireWizardEnemy(index);
                    }, ((time+500)-Date.now())/1000);
                } 
            }
            else if(mode === 'genEnemy'){
                if(id === 1){ 
                    this.scheduleOnce(() => {
                        this.HeavyBandit(index);
                    }, ((time+500)-Date.now())/1000);
                }
                else if(id === 2){
                    this.scheduleOnce(() => {
                        this.Kunoichi(index);
                    }, ((time+500)-Date.now())/1000);
                } 
                else if(id === 3){
                    this.scheduleOnce(() => {
                        this.FireWizard(index);
                    }, ((time+500)-Date.now())/1000);
                } 
            }
           // }
            
            
        })

        const gameStartListener = firebase.database().ref('Rooms/' + this.roomId + '/' + this.rivalId).on('child_changed', snapshot => { // 確保對方進來房間
            let message = snapshot.val();
            console.log('change: ', message)
            if(message === 'enter'){
               this.gameStart = true;
               console.debug("listen2:",this.base,this.enemy_base);        
               cc.find('ColorBlack').active = false;
               cc.find('Canvas/Main Camera/heavyBanditBtn').active = true;
                cc.find('Canvas/Main Camera/kunoichiBtn').active = true;
                cc.find('Canvas/Main Camera/fireWizardBtn').active = true;
                cc.find('Canvas/Main Camera/levelUpBtn').active = true;
                cc.find('Canvas/Main Camera/background').active = true;
                cc.find('Canvas/Main Camera/Navbar').active = true;
                cc.find('Canvas/Main Camera/level').active = true;
                cc.find('Canvas/Main Camera/levelProgressBar').active = true;
                cc.find('Canvas/Main Camera/levelProgressBarBg').active = true;
                cc.find('Canvas/Main Camera/Coin').active = true;
                cc.find('Canvas/Main Camera/coinCount').active = true;
               this.getComponent(KeyboardManager).enableKeyboard();
               firebase.database().ref('Rooms/' + this.roomId + '/' + this.rivalId).off('child_changed', gameStartListener)
            }        
            
        })
    }
    start() { // 裡面都是匹配相關的code
        // stop bgm
        cc.audioEngine.stopMusic();
        // play bgm
        cc.audioEngine.playMusic(this.waiting_bgm, true);
        firebase.database().ref('WaitingPlayer/').once('value').then(async(snapshot) => { // 匹配ing
            if(snapshot){ 
                let waitingPlayer = snapshot.val();
                let userID = this.user.uid;
                let userName = this.user.displayName;
                if(waitingPlayer){ // 成功匹配
                    this.rivalId = Object.keys(waitingPlayer)[0];
                    this.rivalName = Object.values(Object.values(waitingPlayer)[0])[0];
                    
                    let updates = {}; // 建立對戰房間
                    updates[this.rivalId] = {rivalName: this.rivalName, status: 'waiting'};

                    this.roomId = (this.rivalId + this.user.uid);

                    await firebase.database().ref('Rooms/' + this.roomId).set(updates);
                    this.listen2();
                    await firebase.database().ref('WaitingPlayer/' + this.rivalId).remove(); // 從等待列表移除

                }
                else{ // 沒人在等
                    firebase.database().ref('WaitingPlayer/' + userID).set({
                        userName: userName
                    });
                    cc.find('Persist').getComponent('Persist').player = 'A';
                    console.debug("Waiting...");

                    // 監聽Rooms, 若讀到自己的userID, change the status to 'enter'
                    const matchingListener = firebase.database().ref('Rooms').on('value', async snapshot => {
                        // firebase.database().ref('Rooms/').once('value').then(async(snapshot) => {
                        const roomData = snapshot.val();
                        if(roomData){
                            for(let [key, value] of Object.entries(roomData)){
                                console.debug(Object.keys(value)[0], Object.keys(value)[1]);
                                if(Object.keys(value)[0] === userID){
                                    this.roomId = key;
                                    this.rivalId = Object.keys(value)[1];
                                    this.rivalName = Object.values(Object.values(value)[0])[0];
                                    await firebase.database().ref('Rooms').off('value', matchingListener);
                                    this.scheduleOnce(async () => {
                                        await firebase.database().ref('Rooms/' + key + '/' + userID).update({
                                            status: 'enter'
                                        });    
                                        this.listen1();
                                    }, 1);
                                    break;
                                }
                                else if(Object.keys(value)[1] === userID){
                                    this.roomId = key;
                                    this.rivalId = Object.keys(value)[0];
                                    this.rivalName = Object.values(Object.values(value)[0])[0];
                                    await firebase.database().ref('Rooms').off('value', matchingListener);
                                    this.scheduleOnce(async () => {
                                        await firebase.database().ref('Rooms/' + key + '/' + userID).update({
                                            status: 'enter'
                                        });    
                                        this.listen1();
                                    }, 1);
                                    break;
                                }
                            }
                        }
                    })
                }   
            }
        }).catch((error) => {
            console.error("Error reading database:", error);
        })
    }
    update(dt: number): void { 
        if(!this.gameStart) return;
        if(this.gameOver){
            this.HeavyBanditBtn.interactable = false;
            this.KunoichiBtn.interactable = false;
            this.fireWizardBtn.interactable = false;
            this.levelUpBtn.interactable = false;
            return;
        }
        else {
            
            this.money += this.moneyUpdateSpeed * dt;
            
            if (this.isHeavyBanditCoolDown) {
                this.heavyBanditCoolDownTime += dt;
                cc.find('Canvas/Main Camera/heavyBanditBtn/Background/cdBar').getComponent(cc.Sprite).fillRange = this.heavyBanditCoolDownTime / this.heavyBanditCoolDownDuration;
                if (this.heavyBanditCoolDownTime >= this.heavyBanditCoolDownDuration) {
                    this.isHeavyBanditCoolDown = false;
                    this.heavyBanditCoolDownTime = 0;
                    this.HeavyBanditBtn.interactable = true;
                    cc.find('Canvas/Main Camera/heavyBanditBtn/Background/cdBar').active = false;
                    cc.find('Canvas/Main Camera/heavyBanditBtn/Background/cdBarBg').active = false;
                }
            }

            if (this.isKunoichiCoolDown) {
                this.kunoichiCoolDownTime += dt;
                cc.find('Canvas/Main Camera/kunoichiBtn/Background/cdBar').getComponent(cc.Sprite).fillRange = this.kunoichiCoolDownTime / this.kunoichiCoolDownDuration;
                if (this.kunoichiCoolDownTime >= this.kunoichiCoolDownDuration) {
                    this.isKunoichiCoolDown = false;
                    this.kunoichiCoolDownTime = 0;
                    this.KunoichiBtn.interactable = true;
                    cc.find('Canvas/Main Camera/kunoichiBtn/Background/cdBar').active = false;
                    cc.find('Canvas/Main Camera/kunoichiBtn/Background/cdBarBg').active = false;
                }
            }

            if (this.isFireWizardCoolDown) {
                this.fireWizardCoolDownTime += dt;
                cc.find('Canvas/Main Camera/fireWizardBtn/Background/cdBar').getComponent(cc.Sprite).fillRange = this.fireWizardCoolDownTime / this.fireWizardCoolDownDuration;
                if (this.fireWizardCoolDownTime >= this.fireWizardCoolDownDuration) {
                    this.isFireWizardCoolDown = false;
                    this.fireWizardCoolDownTime = 0;
                    this.fireWizardBtn.interactable = true;
                    cc.find('Canvas/Main Camera/fireWizardBtn/Background/cdBar').active = false;
                    cc.find('Canvas/Main Camera/fireWizardBtn/Background/cdBarBg').active = false;
                }
            }

            if (this.money > this.moneyLimitForEachLevel[this.level - 1]) {
                this.money = this.moneyLimitForEachLevel[this.level - 1];
            }

            let coinCount = String(this.money.toFixed(0)) + '/' + String(this.moneyLimitForEachLevel[this.level - 1]);
            cc.find('Canvas/Main Camera/coinCount').getComponent(cc.Label).string = coinCount;

            let heavyBanditCostString = "$" + String(this.heavyBanditCost);
            cc.find('Canvas/Main Camera/heavyBanditBtn/Background/Label').getComponent(cc.Label).string = heavyBanditCostString;

            let kunoichiCostString = "$" + String(this.kunoichiCost);
            cc.find('Canvas/Main Camera/kunoichiBtn/Background/Label').getComponent(cc.Label).string = kunoichiCostString;

            let fireWizardCostString = "$" + String(this.fireWizardCost);
            cc.find('Canvas/Main Camera/fireWizardBtn/Background/Label').getComponent(cc.Label).string = fireWizardCostString;

            let expFillRange = this.currentExp / this.expNeedForEachLevel[this.level - 1];
            cc.find('Canvas/Main Camera/levelProgressBar').getComponent(cc.Sprite).fillRange = expFillRange;

            switch (this.level) {
                case 1:
                    cc.find('Canvas/Main Camera/level/New Sprite').getComponent(cc.Sprite).spriteFrame = this.level1Sprite;
                    break;
                case 2:
                    cc.find('Canvas/Main Camera/level/New Sprite').getComponent(cc.Sprite).spriteFrame = this.level2Sprite;
                    break;
                case 3:
                    cc.find('Canvas/Main Camera/level/New Sprite').getComponent(cc.Sprite).spriteFrame = this.level3Sprite;
                    break;
                case 4:
                    cc.find('Canvas/Main Camera/level/New Sprite').getComponent(cc.Sprite).spriteFrame = this.level4Sprite;
                    break;
                case 5:
                    cc.find('Canvas/Main Camera/level/New Sprite').getComponent(cc.Sprite).spriteFrame = this.level5Sprite;
                    break;
            }

            this.HeavyBanditBtn.interactable = this.money >= this.heavyBanditCost && !this.isHeavyBanditCoolDown;
            this.KunoichiBtn.interactable = this.money >= this.kunoichiCost && !this.isKunoichiCoolDown;
            this.fireWizardBtn.interactable = this.money >= this.fireWizardCost && !this.isFireWizardCoolDown;
            this.levelUpBtn.interactable = this.money >= this.costForExp;

            if(!this.invincible){
                for(let i of this.alliance_arr) {  // 實際打出傷害
                    i.getComponent(Info).injure();
                }
                for(let i of this.enemy_arr) {
                    i.getComponent(Info).injure();
                }
                
            }
            this.alliance_arr = this.alliance_arr.filter(alliance => alliance.getComponent(Info).dead !== true); // 清理array
            this.enemy_arr = this.enemy_arr.filter(enemy => enemy.getComponent(Info).dead !== true);    
        }
    }

    async cancelBtn(){ // 取消配對
        await firebase.database().ref('WaitingPlayer/' + this.user.uid).remove();
        // stop bgm
        cc.audioEngine.stopMusic();
        cc.director.loadScene('Menu');
    }

    async clickLevelUpBtn() {
        if (this.level >= this.maxLevel) return;
        if (this.money < this.costForExp) return;
        this.money -= this.costForExp;
        this.currentExp += 20;
        if (this.currentExp >= this.expNeedForEachLevel[this.level - 1]) {
            this.currentExp -= this.expNeedForEachLevel[this.level - 1];
            this.level++;
            this.moneyUpdateSpeed += 1;
        }
        console.log('Level: ', this.level, ' Exp: ', this.currentExp, ' Cost: ', this.costForExp, ' Money: ', this.money, ' MoneyUpdateSpeed: ', this.moneyUpdateSpeed)
    }

    async clickHeavyBanditBtn() {
        if (this.money < this.heavyBanditCost) return;
        if(this.invincible){
            await firebase.database().ref('Rooms/' + this.roomId + '/' + this.rivalId).push({
                minion: 1,
                timeStamp: Date.now(),
                index: this.index,
                mode: 'genEnemy'
            });
        }
        else{
            await firebase.database().ref('Rooms/' + this.roomId + '/' + this.user.uid).push({
                minion: 1,
                timeStamp: Date.now(),
                index: this.index,
                mode: 'gen'
            });
        }

        this.index += this.index > 0 ? 1 : -1;
        this.money -= this.heavyBanditCost;

        this.HeavyBanditBtn.interactable = false;
        this.isHeavyBanditCoolDown = true;
        this.heavyBanditCoolDownTime = 0;
        cc.find('Canvas/Main Camera/heavyBanditBtn/Background/cdBar').active = true;
        cc.find('Canvas/Main Camera/heavyBanditBtn/Background/cdBarBg').active = true;
    }

    async clickKonoichiBtn() {
        if (this.money < this.kunoichiCost) return;
        if(this.invincible){
            await firebase.database().ref('Rooms/' + this.roomId + '/' + this.rivalId).push({
                minion: 2,
                timeStamp: Date.now(),
                index: this.index,
                mode: 'genEnemy'
            });
        }
        else{
            await firebase.database().ref('Rooms/' + this.roomId + '/' + this.user.uid).push({
                minion: 2,
                timeStamp: Date.now(),
                index: this.index,
                mode: 'gen'
            });
        }

        this.index += this.index > 0 ? 1 : -1;
        this.money -= this.kunoichiCost;

        this.KunoichiBtn.interactable = false;
        this.isKunoichiCoolDown = true;
        this.kunoichiCoolDownTime = 0;
        cc.find('Canvas/Main Camera/kunoichiBtn/Background/cdBar').active = true;
        cc.find('Canvas/Main Camera/kunoichiBtn/Background/cdBarBg').active = true;
    }

    async clickFireWizardBtn() {
        if (this.money < this.fireWizardCost) return;
        if(this.invincible){
            await firebase.database().ref('Rooms/' + this.roomId + '/' + this.rivalId).push({
                minion: 3,
                timeStamp: Date.now(),
                index: this.index,
                mode: 'genEnemy'
            });
        }
        else{
            await firebase.database().ref('Rooms/' + this.roomId + '/' + this.user.uid).push({
                minion: 3,
                timeStamp: Date.now(),
                index: this.index,
                mode: 'gen'
            });
        }

        this.index += this.index > 0 ? 1 : -1;
        this.money -= this.fireWizardCost;

        this.fireWizardBtn.interactable = false;
        this.isFireWizardCoolDown = true;
        this.fireWizardCoolDownTime = 0;
        cc.find('Canvas/Main Camera/fireWizardBtn/Background/cdBar').active = true;
        cc.find('Canvas/Main Camera/fireWizardBtn/Background/cdBarBg').active = true;
    }

    HeavyBandit(index: number) {
        let tmp = cc.instantiate(this.heavyBandit);
        tmp.setParent(cc.director.getScene());
        tmp.x = this.base.x-(this.base.width>>1)-40;
        tmp.y = 145;
        tmp.getComponent(Info).index = index;

        this.alliance_arr.push(tmp);
    }
    HeavyBanditEnemy(index: number) {
        let tmp = cc.instantiate(this.heavyBanditEnemy);
        tmp.setParent(cc.director.getScene());
        tmp.x = this.enemy_base.x+(this.enemy_base.width>>1)+40;
        tmp.y = 145;
        tmp.getComponent(Info).index= index;

        this.enemy_arr.push(tmp);
    }

    KunoichiEnemy(index: number) {
        let tmp = cc.instantiate(this.kunoichiEnemy);
        tmp.setParent(cc.director.getScene());
        tmp.x = this.enemy_base.x+(this.enemy_base.width>>1)+40;
        tmp.y = 145;
        tmp.getComponent(Info).index= index;

        this.enemy_arr.push(tmp);
    }

    Kunoichi(index: number) {
        let tmp = cc.instantiate(this.kunoichi);
        tmp.setParent(cc.director.getScene());
        tmp.x = this.base.x-(this.base.width>>1)-40;
        tmp.y = 145;
        tmp.getComponent(Info).index= index;

        this.alliance_arr.push(tmp);
    }

    FireWizard(index: number) {
        let tmp = cc.instantiate(this.fireWizard);
        tmp.setParent(cc.director.getScene());
        tmp.x = this.base.x-(this.base.width>>1)-40;
        tmp.y = 145;
        tmp.getComponent(Info).index= index;

        this.alliance_arr.push(tmp);
    }

    FireWizardEnemy(index: number) {
        let tmp = cc.instantiate(this.fireWizardEnemy);
        tmp.setParent(cc.director.getScene());
        tmp.x = this.enemy_base.x+(this.enemy_base.width>>1)+40;
        tmp.y = 145;
        tmp.getComponent(Info).index= index;

        this.enemy_arr.push(tmp);
    }

    SoManyBlood(){
        this.blood_exist = true;
        this.blood.opacity = 255;
        let action = cc.sequence(cc.fadeOut(0.5), cc.callFunc(() => { this.blood_exist = false; }));
        this.blood.runAction(action);
    }
}
