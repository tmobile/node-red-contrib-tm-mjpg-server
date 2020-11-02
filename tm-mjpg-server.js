/**
Copyright 2020 T-Mobile USA, Inc.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

See the LICENSE file for additional language around the disclaimer of warranties.
Trademark Disclaimer: Neither the name of “T-Mobile, USA” nor the names of
its contributors may be used to endorse or promote products
*/

const { spawn } = require('child_process')

module.exports = (RED) => {
    let python = null
    // This is a crappy hack but whatever
    let nodeCount = 0

    let serverStatus = { fill: 'yellow', shape: 'dot', text: 'connecting' }

    // Initialize the TensorFlow.js library and store it in the Global
    // context to make sure we are running only one instance
    const initTmMjpgServer = (node) => {
        node.status(serverStatus)
        const globalContext = node.context().global

        nodeCount = globalContext.get('tm-mjpg-server-node-count')
        nodeCount = nodeCount || 0
        nodeCount++

        node.debug('Init Node count is: ' + nodeCount)

        globalContext.set('tm-mjpg-server-node-count', nodeCount)

        if (!python) {
            python = globalContext.get('tmMjpgServer')
        }

        if (!python || python.killed) {
            node.debug('Starting python server process')
            node.debug('Current dir is: ' + __dirname)
            python = spawn('mjpg-env/bin/python3', ['tm-mjpg-server/ServeAll.py'], {'cwd': __dirname})

            globalContext.set('tmMjpgServer', python)
            node.log('Loaded tmMjpgServer')

            python.on('close', (code, signal) => {
                serverStatus = { fill: 'red', shape: 'ring', text: 'disconnected' }
                node.status(serverStatus)
                node.debug(
                    `Python server process terminated due to receipt of signal ${signal}`)
            })

            serverStatus = { fill: 'green', shape: 'dot', text: 'connected' }

            node.status(serverStatus)
        }

        node.on('close', (removed, done) => {
            nodeCount = globalContext.get('tm-mjpg-server-node-count')
            node.debug('Pre-dec close Node count is: ' + nodeCount)
            nodeCount--
            globalContext.set('tm-mjpg-server-node-count', nodeCount)
            if (removed && nodeCount <= 0) {
                // Happens when the node is removed and the flow is deployed or restarted
                node.debug('Node removed, and is the last node, so cleaning up server')
                python.kill()
            } else if (removed) {
                node.debug('Node removed, but not the last node')
            } else {
                // Happens when the node is in the flow, and the flow is deployed or restarted
                node.debug('Node redeployed or restarted')
            }
            done()
        })
    }

    function tmMjpgServer (config) {
        RED.nodes.createNode(this, config)
        this.debug('NODE DEPLOYED AND STARTED')
        initTmMjpgServer(this)
    }
    
    RED.nodes.registerType('tm-mjpg-server', tmMjpgServer)
}
