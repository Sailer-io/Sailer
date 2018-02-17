'use strict';

const program = require("commander");
const pjson = require("./package.json");
const axios = require("axios").default;
const node = require('./files/node');
const Docker=require('./files/docker');

Docker.getAll();
process.exit();

process.on('unhandledRejection', function(reason, p){
    console.log('Error, the master server is unreachable or there was an error durring the request.');
    process.exit();
});

program.version(pjson.version).description(pjson.description);

program
  .command("ps")
  .description("List all running websites")
  .action(node.list);

program.parse(process.argv);

if (process.argv.length < 3) {
  program.help();
}
