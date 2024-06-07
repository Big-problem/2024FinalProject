declare const firebase: any;

const {ccclass, property} = cc._decorator;

@ccclass
export default class LoginSignUp extends cc.Component {

    @property(cc.Node)
    loginPageBtn: cc.Node = null;
    @property(cc.Node)
    signUpPageBtn: cc.Node = null;
    @property(cc.Node)
    loginPage: cc.Node = null;
    @property(cc.Node)
    signUpPage: cc.Node = null;

    // add bgm to the scene
    @property(cc.AudioClip)
    bgm: cc.AudioClip = null;

    start () {
        // play bgm
        cc.audioEngine.playMusic(this.bgm, true);
    }

    OpenLogin() {
        this.loginPage.active = true;
        this.loginPageBtn.active = false;
        this.signUpPageBtn.active = false;
    }

    OpenSignUp() {
        this.signUpPage.active = true;
        this.loginPageBtn.active = false;
        this.signUpPageBtn.active = false;
    }

    exit() {
        this.loginPage.active = false;
        this.signUpPage.active = false;
        this.loginPageBtn.active = true;
        this.signUpPageBtn.active = true;

        cc.find("SignUpPage/UserNameInput").getComponent(cc.EditBox).string = '';
        cc.find("SignUpPage/EmailInput").getComponent(cc.EditBox).string = '';
        cc.find("SignUpPage/PasswordInput").getComponent(cc.EditBox).string = '';
        cc.find("SignUpPage/PasswordConfirm").getComponent(cc.EditBox).string = '';
        cc.find("LoginPage/EmailInput").getComponent(cc.EditBox).string = '';
        cc.find("LoginPage/PasswordInput").getComponent(cc.EditBox).string = '';
    }

    async sign_up() {
        let userName = cc.find("SignUpPage/UserNameInput").getComponent(cc.EditBox).string;
        let email = cc.find("SignUpPage/EmailInput").getComponent(cc.EditBox).string;
        let password = cc.find("SignUpPage/PasswordInput").getComponent(cc.EditBox).string;
        let password_confirm = cc.find("SignUpPage/PasswordConfirm").getComponent(cc.EditBox).string;

        if(userName.length === 0){
            alert('User name cannot be empty!')
            return;
        }
        
        if(password !== password_confirm){
            alert('Password confirmation is wrong!')
            return;
        }
        

        try {
            // Sign up
            const auth = firebase.auth();
            const result = await auth.createUserWithEmailAndPassword(email, password)
            alert("Sign up successfully! Please wait a few second for proper loading")
            let user = auth.currentUser;
            if(user){
                await user.updateProfile({
                    displayName: userName,
                })
            }

            // Save user info to database
            await firebase.database().ref('Users/' + user.uid).set({
                uid: result.user.uid,
                username: userName,
                email: email,
                win_num: 0,
            });

            cc.audioEngine.stopMusic();
            cc.director.loadScene('Menu');
               
          } catch (err) {
            alert("ERROR: " + err);
          }
    }

    async login() {
        let email = cc.find("LoginPage/EmailInput").getComponent(cc.EditBox).string;
        let password = cc.find("LoginPage/PasswordInput").getComponent(cc.EditBox).string;

        try {
            const auth = firebase.auth();
            await auth.signInWithEmailAndPassword(email, password);
            // stop music
            cc.audioEngine.stopMusic();
            cc.director.loadScene('Menu');
          } catch (error) {
            alert("ERROR: " + error)
          }
    }



}
