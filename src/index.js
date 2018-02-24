#!/usr/bin/env node
const Docker = require('./files/docker')
const Connect = require('./files/connect')
const Timer = require('./files/timer')
const Server = require('./files/master/server')
const program = require('commander')

program.command('wait').action(() => {
  Timer.start()
  setTimeout(() => {
    Timer.stop()
  }, 2000)
})


program.command('login').description( 'Connect Sailer CLI to a Git provider').action(() => {
  console.log('Note that 2FA is not supported, you must use Tokens to login if your account is protocted by 2FA.')
  Connect.getInstance().then((con) => {
    con.promptLogin().catch(() => {
      console.log('Bad credentials, please try again.')
    })
  })
})



program.command('ping')
  .description('Ping the master server and verify if it\'s online.')
  .action(() => {
    const srv = Server.getInstance()
    const start = Date.now()
    srv.ping().then(() => {
      console.log(`Pong! => in ${Date.now() - start}ms`)
    }).catch(() => {
      console.log('Error, master server unreachable.')
    })
  })

program.command('ps').description('List all running Sailer containers')
  .action(() => {
    Docker.getAll().then((c) => {
      c.forEach(container => this.log(container.Names[0]))
    })
  })


program.version('0.1.0').parse(process.argv)