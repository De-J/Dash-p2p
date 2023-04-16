import { Server } from "socket.io";
// import map from "it-map";
// import { pipe } from "it-pipe";
import { createLibp2p } from "./libp2p.js";
import { multiaddr } from '@multiformats/multiaddr';
import { createFromJSON } from '@libp2p/peer-id-factory';
import nodeID from './node-id.js';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import stream from "stream";

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

  var streamObj;
  io.on("connection", socket => {
    
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
      class MyReadable extends stream.Readable {
        constructor(data, options) {
          super(options);
          this.data = data;
        }
        _read = (size) => {
          if (this.data.length) {
            const chunk = this.data.slice(0, size);
            this.data = this.data.slice(size, this.data.length);               
            this.push(chunk);
          } else this.push(null);  
        }
      }
      let readable = new MyReadable(uint8ArrayFromString(str));
      
      readable.on("data", (chunk) => {
        // console.log(chunk);
        pipe(readable, streamObj);
      })
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