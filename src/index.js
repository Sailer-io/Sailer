#!/usr/bin/env node
const Docker = require(`./files/docker`)
const Connect = require(`./files/connect`)
const Server = require(`./files/master/server`)
const program = require(`commander`)
const Deployer = require(`./files/git/deployer`)
const version = require(`../package.json`).version


program.command(`login`).description( `Connect Sailer CLI to a Git provider`).action(() => {
  console.log(`Note that 2FA is not supported, you must use Tokens to login if your account is protocted by 2FA.`)
  Connect.getInstance().then((con) => {
    con.promptLogin().catch(() => {
      console.log(`Bad credentials, please try again.`)
    })
  })
})



program.command(`ping`)
  .description(`Ping the master server and verify if it's online.`)
  .action(() => {
    const srv = Server.getInstance()
    const start = Date.now()
    srv.ping().then(() => {
      console.log(`Pong! => in ${Date.now() - start}ms`)
    }).catch(() => {
      console.log(`Error, master server unreachable or not linked.`)
    })
  })

program.command(`whoami`).description(`Who are you on the master server?`)
.action (() => {
  const srv = Server.getInstance()
  srv.whoami().then(data => console.log(data.data)).catch(() => console.log(`Error, master server unreachable or not linked.`))
})

program.command(`ps`).description(`List all running Sailer containers`)
  .action(() => {
    Docker.getAll().then((c) => {
      c.forEach(container => this.log(container.Names[0]))
    })
  })


program.command(`deploy <repoUrl> <websiteDomain>`).alias(`d`)
.description(`Deploy a new Git repository with Sailer.`)
.option(`--no_ssl`, `Disable Letsencrypt auto SSL`)
.option(`--deploy_port <deployPort>`, `Manually specify the container port to deploy through Nginx (port 80)`)
.option(`--dockerfile_path <path>`, `If the Dockerfile is not at the repository root, specify the relative folder.`)
.option(`--services <services>`, `Comma separated services list (e.g. mysql,postgres)`)
.on(`--help`, () => {
  console.log(`\n  <repoUrl> is the URL of the Git repo to clone.`)
  console.log(`  Ex: github.com/username/repo`)
  console.log(`\n  <websiteDomain> is the domain which will be attached to your website container.`)
  console.log(`  This is the domain which will have a Letsencrypt certificate too.`)
  console.log(`  To be clear, when you'll enter this domain in a browser, you'll see the container website.`)
})
.action((repo, domain, options) => {
  const wantSSL = options.no_ssl ? false:true;
  const deployPort = options.deploy_port ? options.deploy_port:null;
  const deployer = new Deployer(repo, domain, wantSSL, deployPort, options.dockerfile_path, options.services)
  deployer.deploy()
})

if (process.argv.length===2) program.outputHelp();
program.version(version, `-v, --version`)
program.parse(process.argv)