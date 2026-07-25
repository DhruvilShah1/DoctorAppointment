import React, { useState, useRef, useEffect } from "react";

import { FiMessageCircle, FiSend, FiX, FiUser } from "react-icons/fi";

import { BsRobot } from "react-icons/bs";

import dripDrop from "../../assets/drip_drop.mp3";
import { useAuth } from "../../AuthProvider";

const Chatbot = () => {
  const {user} = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);

  const [newMessage, setNewMessage] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      type: "message",
      text: "👋 Hi! I'm your AI Hospital Assistant. How can I help you today?",
      data: null,
    },
  ]);

  const messageEndRef = useRef(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Play notification sound

  const playSound = () => {
    const audio = new Audio(dripDrop);

    audio.volume = 1;

    audio
      .play()
      .then(() => console.log("sound played"))
      .catch((err) => console.log(err));
  };

  // Convert Backend Response

  const formatResponse = (response) => {
    let result = response;

    /*
       Backend Response:

       {
        type:"message",
        message:[
          {
            type:"text",
            text:"{json}"
          }
        ]
       }

    */

    if (Array.isArray(response.message)) {
      try {
        result = JSON.parse(response.message[0].text);
      } catch {
        result = {
          type: "message",
          message: response.message[0].text,
          data: null,
        };
      }
    } else if (typeof response.message === "string") {
      try {
        result = JSON.parse(response.message);
      } catch {
        result = {
          type: "message",
          message: response.message,
          data: null,
        };
      }
    }

    return result;
  };

  const BASE_URL = "https://doctorappointment-1-wwg3.onrender.com" | "http://127.0.0.1:5000"

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;

    setMessages((prev) => [
      ...prev,

      {
        sender: "user",
        type: "message",
        text: userText,
        data: null,
      },
    ]);

    setInput("");

    setLoading(true);

    try {
      const response = await fetch(
        `${BASE_URL}/chat`,

        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            sessionId: "Dhruvil",

            patient_id:user.id ,

            message: userText,
          }),
        },
      );

      const data = await response.json();

      console.log("Backend Response:", data);

      const result = formatResponse(data);

      console.log("Final JSON:", result);

      setMessages((prev) => [
        ...prev,

        {
          sender: "bot",

          type: result.type || "message",

          text: result.message || "",

          data: result.data || null,
        },
      ]);

      setIsOpen(true);

      setNewMessage(true);

      playSound();

      setTimeout(() => {
        setNewMessage(false);
      }, 3000);
    } catch (error) {
      console.log(error);

      setMessages((prev) => [
        ...prev,

        {
          sender: "bot",

          type: "error",

          text: "Something went wrong",

          data: null,
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <>
      {/* Notification */}

      {newMessage && (
        <div
          className="
fixed
right-6
bottom-28
z-50

bg-blue-600
text-white

px-5
py-3

rounded-xl

shadow-xl

animate-bounce
"
        >
          💬 New AI Message
        </div>
      )}

      {/* Floating Button */}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
fixed

right-6
bottom-6

z-50

h-16
w-16

rounded-full

bg-blue-600

text-white

flex
items-center
justify-center

shadow-2xl

hover:scale-110

transition

${newMessage ? "animate-bounce" : ""}

`}
      >
        {isOpen ? <FiX size={30} /> : <FiMessageCircle size={30} />}
      </button>

      {/* Chat Window */}

      {isOpen && (
        <div
          className="
fixed

right-6

bottom-24

z-50

w-[400px]

h-[620px]

bg-white

rounded-3xl

shadow-2xl

border

flex

flex-col

overflow-hidden

"
        >
          {/* Header */}

          <div
            className="
bg-gradient-to-r
from-blue-600
to-cyan-500

p-5

text-white

flex

items-center

gap-3

"
          >
            <div
              className="
h-12
w-12

rounded-full

bg-white/20

flex
items-center
justify-center

"
            >
              <BsRobot size={25} />
            </div>

            <div>
              <h2 className="font-bold">AI Hospital Assistant</h2>

              <p className="text-xs">Online • Ready to help</p>
            </div>
          </div>

          {/* Messages */}

          <div
            className="
flex-1

overflow-y-auto

bg-gray-50

p-4

"
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`
mb-4
flex

${msg.sender === "user" ? "justify-end" : "justify-start"}

`}
              >
                {msg.sender === "bot" && (
                  <div
                    className="
mr-2

h-9
w-9

rounded-full

bg-blue-600

text-white

flex
items-center
justify-center

"
                  >
                    <BsRobot />
                  </div>
                )}

                <div
                  className={`
max-w-[80%]

rounded-2xl

px-4
py-3

shadow


${msg.sender === "user" ? "bg-blue-600 text-white" : "bg-white text-gray-800"}

`}
                >
                  <p
                    className="
whitespace-pre-wrap
text-sm
"
                  >
                    {msg.text}
                  </p>

                  {/* DATA DISPLAY */}

                  {msg.data && (
                    <div
                      className="
mt-3
space-y-2
"
                    >
                      {Array.isArray(msg.data) ? (
                        msg.data.map((item, i) => (
                          <div
                            key={i}
                            className="
border
rounded-xl
bg-gray-100
p-3
text-xs
"
                          >
                            {Object.entries(item).map(([key, value]) => (
                              <p key={key}>
                                <b>{key}:</b> {value}
                              </p>
                            ))}
                          </div>
                        ))
                      ) : (
                        <div
                          className="
border
rounded-xl
bg-gray-100
p-3
text-xs
"
                        >
                          {Object.entries(msg.data).map(([key, value]) => (
                            <p key={key}>
                              <b>{key}:</b> {value}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {msg.sender === "user" && (
                  <div
                    className="
ml-2

h-9
w-9

rounded-full

bg-gray-700

text-white

flex
items-center
justify-center

"
                  >
                    <FiUser />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div
                className="
bg-white
rounded-xl
p-4
shadow
w-fit
"
              >
                AI Thinking...
              </div>
            )}

            <div ref={messageEndRef} />
          </div>

          {/* Input */}

          <div
            className="
border-t

p-4

flex

gap-2

"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask AI..."
              className="
flex-1

rounded-full

border

px-5

py-3

outline-none

focus:ring-2

focus:ring-blue-500

"
            />

            <button
              onClick={sendMessage}
              className="
h-12

w-12

rounded-full

bg-blue-600

text-white

flex
items-center
justify-center

"
            >
              <FiSend />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
