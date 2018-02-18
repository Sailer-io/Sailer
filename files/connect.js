const octokit = require('@octokit/rest')()
const vorpal = require('vorpal')()
const colors = require('colors')
const Config = require('./config')

module.exports = class Connect {

    constructor(){
        
    }

    static getInstance(vorpal){
        Connect._vorpal = vorpal
        if (Connect._instance === undefined){
            Connect._instance = new Connect()
        }
        return Connect._instance
    }

    

    async listUserRepos(){
        let repos = await octokit.repos.getForUser({username: `lelenaic`})
        repos.data.forEach(r => console.log(r.name))
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
        
        const user = await octokit.users.get()
        if (token !== null){
            Config.getInstance().add({tokens: {github: token}})
        }
        console.log(`SUCCESS!`.green.bold)
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