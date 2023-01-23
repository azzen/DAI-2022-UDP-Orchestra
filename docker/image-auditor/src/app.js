import dgram from "node:dgram";
import net from "node:net";
import config from "./config.json" assert {type: "json"};
import dayjs from "dayjs";

const udpSocket = dgram.createSocket("udp4");

udpSocket.bind(config['multicast-port'], () => {
    const time = dayjs().format("YYYY/MM/DD HH:mm:ss");
    console.log(`[${time}] Auditor » listening on ${config['multicast-group']}:${config['multicast-port']}`);
    udpSocket.addMembership(config['multicast-group']);
});

const activeMusicians = new Map();

udpSocket.on("message", (message, source) => {
    const soundEmitted = JSON.parse(message);
    if (soundEmitted.hasOwnProperty("sound") && soundEmitted.hasOwnProperty("uuid")) {
        const time = dayjs().format("YYYY/MM/DD HH:mm:ss");
        console.log(`[${time}] Auditor » received sound ${message} from ${source.address}:${source.port}`);
        if (config.sounds.hasOwnProperty(soundEmitted.sound)) {
            activeMusicians.set(soundEmitted.uuid, {
                instrument: config.sounds[soundEmitted.sound],
                activeSince: dayjs().format()
            })
        }
    }
});


setInterval(() => {
    activeMusicians.forEach((uuid, musician) => {
        if (dayjs().diff(musician.activeSince) > config['keep-active-timeout']) {
            activeMusicians.delete(uuid);
        }
    });
}, config['keep-active-timeout'])

// TCP server

const tcpServer = net.createServer();

tcpServer.on("connection", socket => {
    const payload = Array.from(activeMusicians.entries())
        .filter(([uuid, musician])=> musician.activeSince > dayjs().subtract(config['keep-active-timeout'], 'ms').format())
        .map(([uuid, musician]) => ({uuid: uuid, ...musician}))
    socket.write(JSON.stringify(payload));
    socket.end();
});

tcpServer.listen(config['tcp-port'], () => {
    const time = dayjs().format("YYYY/MM/DD HH:mm:ss");
    console.log(`[${time}] Auditor » Accepting TCP connections on port ${config['tcp-port']}`);
});