const {ccclass, property} = cc._decorator;

@ccclass
export default class Shake extends cc.Component
{
    @property(cc.Node)
    target:cc.Node=null;
    // private shake_effect:cc.Action=null;
    private init_x:number=0;
    private init_y:number=0;
    private diff_x:number=0;
    private diff_y:number=0;
    private diff_max:number=10;
    private max_time:number=0.5;
    private acc_time:number=0;
    private playing:boolean=false;
    stop:boolean=false;
    // private target:cc.Node=null;
    
    // LIFE-CYCLE CALLBACKS:
    isPlaying()
    {
        return this.playing;
    }

    onLoad()
    {
        // this.shake_effect=cc.sequence(cc.moveBy(0.5,-100,100),cc.moveBy(0.5,100,100),cc.moveBy(0.5,100,-100),cc.moveBy(0.5,-100,-100));
        // this.init_x=this.target.x;
        // this.init_y=this.target.y;
    }

    // start () {
        
    // }

    update(dt)
    {
        if(!this.playing) return;
        if(this.stop) return;
        if(this.acc_time>=this.max_time)
        {
            this.playing=false;
            this.acc_time=0;
            this.target.x=this.init_x;
            this.target.y=this.init_y;
        }
        else
        {
            this.acc_time+=dt;
            this.diff_x=Math.random()*((this.diff_max<<1)+1)-this.diff_max;
            this.diff_y=Math.random()*((this.diff_max<<1)+1)-this.diff_max;
            this.target.setPosition(this.init_x+this.diff_x,this.init_y+this.diff_y);
        }
    }

    play()
    {
        // cc.find("Canvas/Main Camera").runAction(this.shake_effect);
        if(this.playing) return;
        if(this.stop) return;        
        this.init_x=this.target.x;
        this.init_y=this.target.y;
        this.playing=true;
    }
    // update (dt) {}
}
