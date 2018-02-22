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

    async chooseWhereToConnect(choices){
        const place = await Connect._vorpal.prompt([
            {
                type: 'list',
                message: 'Where do you want to connect?',
                name: 'place',
                choices
            }
        ])
        if (place.place != choices[0]){
            console.log(`Warning, we won't test your credentials if you don't use Github Cloud.`.yellow)
            console.log(`Your credentials will be tested only when Sailer will clone a repository.`.yellow)
        }
        return place.place
    }

    async promptLogin(){
        const choices = [
            'Github Cloud',
            'Other Git provider'
        ]
        const place = await this.chooseWhereToConnect(choices)
        if (place==choices[0]){
            const token = await this.github()
        }else{
            const token = await this.otherGitProvider()
        }
    }

    async otherGitProvider(){
        console.log('You need to create an access for Sailer. Sailer needs full power for private repos and for SSH keys.'.blue)
        const info = await Connect._vorpal.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'First, give it a name (just for you): '
            },
            {
                type: 'input',
                name: 'url',
                message: 'Your Git provider URL (ex: git.example.net, no http://): '
            },
            {
                type: 'input',
                name: 'token',
                message: 'Personnal Access Token: '
            }
        ])
        const name = Config.getInstance().get('tokens', info.name)
        if (name !== null){
            const overwrite = await Connect._vorpal.prompt([
                {
                    type: 'confirm',
                    message: 'An account with this name already exists, overwrite?',
                    name: 'confirm',
                    default: false
                }
            ])
            if (overwrite.confirm === false) return;
        }
        const credentials = {tokens: {}}
        credentials.tokens[info.name] = {}
        credentials.tokens[info.name].url = info.url
        credentials.tokens[info.name].token = info.token
        Config.getInstance().add(credentials)
    }

    async github(){
        console.log('Create your token here: https://github.com/settings/tokens')
        console.log('Sailer needs `repo` `write:public_key` and `read:public_key` perms')
        const credentials = await Connect._vorpal.prompt([
            {
              type: 'password',
              name: 'token',
              message: 'Personnal Access Token: '
            }
        ])
        octokit.authenticate({
            type: 'token',
            token: credentials.token
        })
        await this.assertLogin()
        if (credentials.token !== null){
            Config.getInstance().add({tokens: {github: credentials.token}})
        }
        this._isAuth = true
        console.log(`SUCCESS!`.green.bold)
    }

    async assertLogin(){
        await octokit.users.get()
        this._isAuth = true
    }

    async oauthLogin(){
        
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