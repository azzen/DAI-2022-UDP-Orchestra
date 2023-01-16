import dgram from "node:dgram";
import {v4 as uuidv4} from "uuid";
import {argv} from 'node:process';
import config from "./config.json" assert {type: "json"};

const socket = dgram.createSocket("udp4");
const instrument = argv[2]

if (!config['instruments'].hasOwnProperty(instrument)) {
    console.log("Incorrect instrument type")
    process.exit()
}

const payload = JSON.stringify({
    'uuid': uuidv4(),
    'sound': config['instruments'][instrument]
});

const buf = new Buffer.from(payload);

function update() {
    socket.send(buf, 0, buf.length, config['multicast-port'], config['multicast-group'], (err, bytes) => {
        const time = (new Date()).toISOString().slice(0, 19).replace(/-/g, "/").replace("T", " ");
        console.log(`[${time}] musician » sending payload ${payload} via ${socket.address().port}`);
    })
}

setInterval(update, config['interval'])




