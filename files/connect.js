const octokit = require('@octokit/rest')()
const vorpal = require('vorpal')()
const colors = require('colors')
const Config = require('./config')


module.exports = class Connect {

    constructor(){
        this._isAuth = false
    }

    static async getInstance(vorpal){
        Connect._vorpal = vorpal
        if (Connect._instance === undefined){
            Connect._instance = new Connect()

            let token = Config.getInstance().get('tokens', 'github')
            
            if (token !== null){
                await Connect._instance.silentOauthLogin(token)
                await Connect._instance.assertLogin().then(() => Connect._instance._isAuth = true).catch(() => Connect._instance._isAuth = false)
            }
        }
        return Connect._instance
    }

    isAuth(){
        if (this._isAuth){
            return true
        }else{
            console.log('This action requires you to launch the `login` command before.'.red.bold)
            return false
        }
    }
    

    async listUserRepos(){
        if (this.isAuth()){
            let repos = await octokit.repos.getAll()
            repos.data.forEach(r => console.log(r.name))
        }
    }

    async promptLogin(){
        const choices = [
            'Personnal Access Token',
            'Username/Password'
        ]
        const type = await Connect._vorpal.prompt([
            {
                type: 'list',
                message: 'Which auth type?',
                name: 'type',
                choices
            }
        ])
        let token = null
        if (type.type === choices[0]){
            token = await this.oauthLogin()
        }else{
            await this.basicLogin()
        }
        await this.assertLogin()
        if (token !== null){
            Config.getInstance().add({tokens: {github: token}})
        }
        this._isAuth = true
        console.log(`SUCCESS!`.green.bold)
    }

    async assertLogin(){
        await octokit.users.get()
        this._isAuth = true
    }

    async oauthLogin(){
        const credentials = await Connect._vorpal.prompt([
            {
              type: 'input',
              name: 'token',
              message: 'Personnal Access Token: '
            }
        ])
        octokit.authenticate({
            type: 'token',
            token: credentials.token
        })
        return credentials.token
    }

    async silentOauthLogin(token){
        octokit.authenticate({
            type: 'token',
            token
        })
    }

    async basicLogin(){
        console.log(`Please note that your credentials are not saved. DWM will ask you to login each time you launch the CLI.`)
        console.log(`Use Personnal access token to stay logged.`)
        const credentials = await Connect._vorpal.prompt([
            {
              type: 'input',
              name: 'username',
              message: 'Username: '
            },
            {
              type: 'password',
              name: 'password',
              message: 'Password: '
            }
        ])
        octokit.authenticate({
            username: credentials.username,
            password: credentials.password,
            type: 'basic'
        })
    }
}