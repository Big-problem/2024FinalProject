import GameManager from "./GameManager"
import Info from "./Info";

const {ccclass, property} = cc._decorator;

enum State {
    Move,
    CombatIdle,
    Attack,
    Death
}

@ccclass
export default class FireWizardEnemy extends cc.Component {

    @property(GameManager)
    gameManager: GameManager = null;
    
    @property(cc.AudioClip)
    attackAudio: cc.AudioClip = null;

    speedX: number = 80;
    state: State = State.Move;

    attackRange: number = 400;
    damage: number = 50;
    attackGap: number = 5;

    attackReady: boolean = true;
    attackProperty:string = 'multiple';


    start () {
        this.node.getComponent(Info).life = 50;
        this.getComponent(cc.Animation).play('move');
        this.gameManager = cc.find('GameManager').getComponent(GameManager);
    }

    update (dt: number) {
        if(this.node.getComponent(Info).dead) return;

        // if(this.node.x > 1100){ // 超出界線的自殺, 實際應該不會發生, 因為有基地會擋住
        //     this.getComponent(Info).die();
        //     return;
        // }

        if(this.state === State.Move) {
            let res = cc.director.getPhysicsManager().rayCast(cc.v2(this.node.x, this.node.y), cc.v2(this.node.x+this.attackRange, this.node.y), cc.RayCastType.All);
            for(let i of res) {
                if(i.collider.tag === 0){
                    this.changeState(State.Attack);
                    break;
                }
            }
        }
        if(this.state === State.CombatIdle) {
            let res = cc.director.getPhysicsManager().rayCast(cc.v2(this.node.x, this.node.y), cc.v2(this.node.x+this.attackRange, this.node.y), cc.RayCastType.All);
            let flag:number = 1;
            for(let i of res) {
                if(i.collider.tag === 0){
                    flag = 0;
                    break;
                }
            }
            if(flag) this.changeState(State.Move);
        }

        if(this.state === State.Move) this.node.x += this.speedX * dt;
    
        if(this.state === State.CombatIdle && this.attackReady) this.changeState(State.Attack);
    }

    changeState(state: State) {
        this.state = state;
        this.getComponent(cc.Animation).stop();
        if(state === State.Move) this.getComponent(cc.Animation).play('move');
        if(state === State.CombatIdle) this.getComponent(cc.Animation).play('combatIdle');
        if(state === State.Attack) {
            if(this.attackReady){
                this.getComponent(cc.Animation).play('attack');
                // cc.audioEngine.playEffect(this.attackAudio, false);
                this.attackReady = false;
            }
            else{
                this.changeState(State.CombatIdle);
            }
        }
    }

    combatdle() { // Animation Event
        this.changeState(State.CombatIdle);
        this.scheduleOnce(() => {
            this.attackReady = true;
        }, this.attackGap);
    }

    attack() { // Animation Event
        let res = cc.director.getPhysicsManager().rayCast(cc.v2(this.node.x, this.node.y), cc.v2(this.node.x+this.attackRange, this.node.y), cc.RayCastType.All);
        if(this.attackProperty === 'single'){ // 單體攻擊
            let target: cc. Node = null;
            for(let enemy of res){
                if(!enemy.collider.isValid || enemy.collider.tag === 50) continue;
                if(!target || target.x > enemy.collider.node.x) target = enemy.collider.node;
            }
            if(target) {
                target.getComponent(Info).getDamage += this.damage;
            }
        }
        else{ // 範圍攻擊
            for(let enemy of res) {
                if(!enemy.collider.isValid || enemy.collider.tag === 50) continue;
                enemy.collider.getComponent(Info).getDamage += this.damage;
            }
        }
    }

    playAttackAudio(){ // Animation Event
        cc.audioEngine.playEffect(this.attackAudio, false);
    }
}
