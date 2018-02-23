#!/usr/bin/env node
const pjson = require("./package.json");
const axios = require("axios").default;
const node = require('./files/node')
const Docker = require('./files/docker')
const vorpal = require('vorpal')()
const Connect = require('./files/connect')
const Timer = require('./files/timer')

vorpal.command('wait').action((args, c) => {
  Timer.start()
  setTimeout(() => {
    Timer.stop()
    c()
  }, 2000)
})

vorpal.command('repos', 'List all repositories').action((args, c) => {
  Connect.getInstance(this).then((con) => {
    con.listUserRepos().then(c)
  })
})

vorpal.command('login', 'Connect Sailer CLI to a Git provider').action(function (a,c) {
  this.log('Note that 2FA is not supported, you must use Tokens to login if your account is protocted by 2FA.')
  Connect.getInstance(this).then((con) => {
    con.promptLogin().then(c).catch(() => {
      this.log('Bad credentials, please try again.')
      c()
    })
  })
})

vorpal.command('ps', 'List all running Sailer containers')
.action(function(args, callback) {
  Docker.getAll().then((c) => {
    c.forEach(container => console.log(container.Names[0]))
    callback()
  })
});

vorpal.delimiter('Sailer~$').show();