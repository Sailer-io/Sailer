const pjson = require("./package.json");
const axios = require("axios").default;
const node = require('./files/node')
const Docker = require('./files/docker')
const vorpal = require('vorpal')()
const Connect = require('./files/connect')

vorpal.command('repos', 'List all repositories').action((args, c) => {
  Connect.listUserRepos().then(c);
})

vorpal.command('login', 'Connect DWM CLI to your Github account').action(function (a,c) {
  const con = Connect.getInstance(this)
  con.promptLogin().then(c)/*.catch(() => {
    console.log('Bad credentials, please try again.')
    console.log('Note that 2FA is not supported, you must use Tokens to login.')
    c()
  })*/
})

vorpal.command('ps', 'List all running DWM containers')
.action(function(args, callback) {
  Docker.getAll().then((c) => {
    c.forEach(container => console.log(container.Names[0]))
    callback()
  })
});

vorpal.delimiter('DWM~$').show();