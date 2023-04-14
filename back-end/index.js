import { Server } from "socket.io";
// import map from "it-map";
// import { pipe } from "it-pipe";
import { createLibp2p } from "./libp2p.js";
import { multiaddr } from '@multiformats/multiaddr';
import { createFromJSON } from '@libp2p/peer-id-factory';
import nodeID from './node-id.js';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';

async function run() {
  const io = new Server(3001, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  const id = await createFromJSON(nodeID);

  // Create a new libp2p node on localhost with a randomly chosen port
  const myNode = await createLibp2p({
    peerId: id,
    addresses: {
      listen: ['/ip4/127.0.0.1/tcp/0']
    }
  })

  myNode.connectionManager.addEventListener('peer:connect', (evt) => {
    const connection = evt.detail
    console.log('connected to: ', connection.remotePeer.toString())
  })

  io.on("connection", socket => {
    var streamObj;

    socket.on("dial", async (dialData) => {
      console.log(dialData);
      const idReceiver = await createFromJSON(dialData);
      try {
        const mAddr = multiaddr(`/ip4/127.0.0.1/tcp/10333/p2p/${idReceiver.toString()}`);
        streamObj = await myNode.dialProtocol(mAddr, '/chat/1.0.0');
      }
      catch (err) {
        console.log(err)
      }
    })


    socket.on("send-message", async (msgData) => {
      console.log(msgData);

      let str = "";
      for (const key in msgData) str += msgData[key] + ' ';

      pipe(
        // Source data
        [uint8ArrayFromString(str)],

        function gen (source) {
          return (async function* () {
            let i = 0;
            while (i < source.length)
              yield source[i];
          })
        },
        streamObj,
      )
    });
  
  
  })

  await myNode.handle('/chat/1.0.0', async ({ stream }) => {
    pipe(
      stream.source,
      (source) => map(source, (buf) => uint8ArrayToString(buf)),
      // async function (source) {
      //   for await (const msg of source) {
      //     // msg.toString().replace('\n', '');
      //     socket.emit("recieve-message", msg.toString());
      //   }
      // }
    )
  })
}

run()