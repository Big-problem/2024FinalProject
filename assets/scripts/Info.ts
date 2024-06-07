declare const firebase: any;

import GameManager from "./GameManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Info extends cc.Component {

    @property(cc.SpriteFrame)
    dieFrame: cc.SpriteFrame = null;

    @property(GameManager)
    gameManager: GameManager = null;

    life: number = 200;
    dead: boolean = false;

    getDamage: number= 0;
    default_life = 200;

    index: number = 0;

    onload()
    {
        // if(this.is_base()) this.default_life=this.life=10000; 
    }

    start () {
        this.gameManager = cc.find('GameManager').getComponent(GameManager);
    }

    is_base()
    {
        return this.node.name=="base"||this.node.name=="enemy_base";
    }

    die() {
        this.dead = true;
        // if(this.is_base()) return;
        this.getComponent(cc.Animation).stop();
        this.getComponent(cc.PhysicsBoxCollider).enabled = false;
        this.getComponent(cc.RigidBody).gravityScale = 0;
        if(this.dieFrame){ // 無死亡動畫
            this.getComponent(cc.Sprite).spriteFrame = this.dieFrame;
            this.scheduleOnce(() => {
                this.node.destroy();
            }, 0.5);
        }
        else { // 有死亡動畫
            this.getComponent(cc.Animation).play('dead');
        }
    }

    async injure() {
        if(this.dead) return;

        this.life -= this.getDamage;
        let tmp = this.getDamage;
        this.getDamage = 0;
        if (this.is_base()) {
            if(tmp){
                await firebase.database().ref('Rooms/' + this.gameManager.roomId + '/' + this.gameManager.user.uid).push({
                    minion: this.life, // 這邊傳的是城堡剩餘血量
                    timeStamp: Date.now(),
                    index: this.index,
                    mode: 'castleHurt'
                });
            }
            //this.node.children[0].getComponent(cc.Sprite).fillRange=this.life/this.default_life;
        }
        if(this.life <= 0){
            this.dead = true;
            // if(!this.gameManager.invincible){
            await firebase.database().ref('Rooms/' + this.gameManager.roomId + '/' + this.gameManager.user.uid).push({
                minion: 0,
                timeStamp: Date.now(),
                index: this.index,
                mode: 'die'
            });
            // }
            // this.scheduleOnce(() => {
            //     this.die();
            // }, 0);
        }
    }
}