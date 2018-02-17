#!/usr/bin/env node

const program = require('commander')
let pjson = require('./package.json')


program
    .version(pjson.version)
    .description(pjson.description)

program
    .command('ps')
    .description('List all running websites')
    .action(() => {
        console.log("Here are the running containers:")
    })

program.parse(process.argv)

if (process.argv.length < 3) {
    program.help()
}