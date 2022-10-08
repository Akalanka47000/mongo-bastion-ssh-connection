require("dotenv").config();
require('colors')
const SSH2Promise = require('ssh2-promise');
const mongoose = require('mongoose');

const database = process.env.DB_NAME;
const mongoUsername = process.env.MONGO_USERNAME;
const mongoPassword = process.env.MONGO_PASSWORD;

const replicaSet = process.env.MONGO_REPLICA_SET;

const init = async () => {
    const ssh = new SSH2Promise({
        host: process.env.SSH_HOST,
        username: process.env.SSH_USER,
        identity: './key.pem',
    })

    const tunnel1 = await ssh.addTunnel({
        remoteAddr: process.env.SHARD_1_ADDRESS,
        remotePort: process.env.SHARD_1_PORT,
        localHost: "127.0.0.1",
        localPort: 27019,
    })

    const tunnel2 = await ssh.addTunnel({
        remoteAddr: process.env.SHARD_2_ADDRESS,
        remotePort: process.env.SHARD_2_PORT,
        localHost: "127.0.0.1",
        localPort: 27020,
    })

    const tunnel3 = await ssh.addTunnel({
        remoteAddr: process.env.SHARD_3_ADDRESS,
        remotePort: process.env.SHARD_3_PORT,
        localHost: "127.0.0.1",
        localPort: 27021,
    })

    console.log("Tunnel established".green);

    const url = `mongodb://${mongoUsername}:${mongoPassword}@localhost:${tunnel1.localPort},localhost:${tunnel2.localPort},localhost:${tunnel3.localPort}/${database}?ssl=true&replicaSet=${replicaSet}&authSource=admin&retryWrites=true&w=majority`
    console.log(`Uri=${url}`.grey)

    const connection = mongoose.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(() => {
        console.log("DB connection established".green);

        // Do your stuff here

        connection.close();
        ssh.close();
    }).catch((err) => {
        console.error(err)
    });
}

init()