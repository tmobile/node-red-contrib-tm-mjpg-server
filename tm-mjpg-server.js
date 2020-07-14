const { spawn } = require('child_process')

module.exports = (RED) => {
    let python = null
    // This is a crappy hack but whatever
    let nodeCount = 0

    let serverStatus = { fill: 'yellow', shape: 'dot', text: 'connecting' }

    // Initialize the TensorFlow.js library and store it in the Global
    // context to make sure we are running only one instance
    const initMjpgServer = (node) => {
        node.status(serverStatus)
        const globalContext = node.context().global

        nodeCount = globalContext.get('mjpg-server-node-count')
        nodeCount = nodeCount || 0
        nodeCount++

        node.debug('Init Node count is: ' + nodeCount)

        globalContext.set('mjpg-server-node-count', nodeCount)

        if (!python) {
            python = globalContext.get('mjpgserver')
        }

        if (!python || python.killed) {
            node.debug('Starting python server process')
            node.debug('Current dir is: ' + __dirname)
            python = spawn('env/bin/python3', ['tm-mjpg-server/ServeAll.py'], {'cwd': __dirname})

            globalContext.set('mjpgserver', python)
            node.log('Loaded mjpgserver')

            python.on('close', (code, signal) => {
                serverStatus = { fill: 'red', shape: 'ring', text: 'disconnected' }
                node.status(serverStatus)
                node.debug(
                    `Python server process terminated due to receipt of signal ${signal}`)
            })
        }

        node.on('close', (removed, done) => {
            nodeCount = globalContext.get('mjpg-server-node-count')
            node.debug('Pre-dec close Node count is: ' + nodeCount)
            nodeCount--
            globalContext.set('mjpg-server-node-count', nodeCount)
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

    function mjpgServer (config) {
        RED.nodes.createNode(this, config)
        this.debug('NODE DEPLOYED AND STARTED')
        initMjpgServer(this)
    }
    
    RED.nodes.registerType('mjpg-server', mjpgServer)
}
