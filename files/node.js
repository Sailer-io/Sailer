const axios = require('./axios')
const Table = require('cli-table')

module.exports = class Node {
    static list (){
        return axios.get('containers').then((resp) => {
            let t=new Table({
                head: ['Hostname', 'Created at'],
                chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''}
            })
            console.log("Here are the running containers:")
            resp.data.data.forEach((container) => {
                t.push([container.hostname, container.created_at])
            })
            console.log(t.toString())
            
        }).catch(console.log)
    }
}