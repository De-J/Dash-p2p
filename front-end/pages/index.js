import React, { useEffect, useState } from "react";
import io from "socket.io-client"

export default function Home() {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [addr, setAddr] = useState("");

  const socket = io.connect("http://localhost:3001")

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        message: currentMessage,
        time:
          new Date(Date.now()).getHours() +
          ":" +
          new Date(Date.now()).getMinutes(),
      };

      await socket.emit("send-message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
  };

  const sendDialReq = async (e) => {
    e.preventDefault();
    const dialData = {
      id: addr
    }
    await socket.emit("dial", dialData);
  }

  // useEffect(() => {
  //   socket.on("receive-message", (data) => {
  //     setMessageList((list) => [...list, data]);
  //   });
  // }, [socket]);


  return (<div className="font-mono">
    <section className="p-2 text-center">
      <input
        className="w-3/5 p-2 border-2 border-black rounded-md"
        val={addr}
        onChange={e => setAddr(e.target.value)}
        placeholder="E.g. Qma3GsJmB47xYuyahPZPSadh1avvxfyYQwk8R3UnFrQ6aP"
      />
      <button
        className="p-0.5 m-2 border-2 border-black rounded-md"
        type="submit"
        onClick={sendDialReq}>
        Connect to user
      </button>
      <p></p>
    </section>

    <main className="m-2 border-y-2 border-black">
      <div className="text-center">
        <h1>Live Chat</h1>
      </div>
      
      <div>
        <div className="message-container">
          {messageList.map((messageContent) => {
            return (<p>[{messageContent.time}] {messageContent.author}&gt; {messageContent.message}</p>);
          })}
        </div>
      </div>
      
      <div className="w-full flex justify-center fixed bottom-0">
        <input
          name="chatbox"
          className="w-3/5 m-1 p-2 rounded-md border-black border-2"
          value={currentMessage}
          placeholder="Say something nice..."
          onChange={e => setCurrentMessage(e.target.value)}
        />
        <button className="m-1 w-50 bg-white border-solid border-black rounded-md border-2" onClick={sendMessage}>Send</button>
      </div>
  </main>
  </div >
  );
}