const PASS = 'cvxLSCXLC8XwsYf-b6pL';
const REPO = 'gitlab.lenaic.me/DWM/CLI';

module.exports = class Manager{

  constructor(vorpal){
    this._v=vorpal
  }

  async clone(){
    const choices = [
      'Yes, use Github',
      ''
    ]
    const type = await Connect._vorpal.prompt([
        {
            type: 'input',
            message: 'Do you need to be authenticated?',
            name: 'type',
        }
    ])
  }
}



const git = require('simple-git/promise');
const remote = `https://sailer:${PASS}@${REPO}`;

git().silent(true)
  .clone(remote)
  .then(() => console.log('finished'))
  .catch((err) => console.error('failed: ', err));