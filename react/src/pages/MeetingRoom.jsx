// MeetingRoom.jsx

import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Mic, Video, MessageSquare, MonitorUp, Users } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { socket } from "../socket";

function MeetingRoom() {
  const { roomId } = useParams();

  const [participants, setParticipants] = useState([]);
  const [showChat, setShowChat] = useState(true);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [showParticipants, setShowParticipants] = useState(false);

  const [isHost, setIsHost] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);

  const [raisedHands, setRaisedHands] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem("user"));

  const navigate = useNavigate();

  const localVideoRef = useRef(null);

  const remoteVideoRef = useRef(null);

  const peerConnectionRef = useRef(null);
  const chatContainerRef = useRef(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);

  const [meetingTime, setMeetingTime] = useState(0);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    const getParticipants = async () => {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/room/${roomId}/participants`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setParticipants(response.data.participants);

      setRoomInfo(response.data.room);

      const currentUser = JSON.parse(localStorage.getItem("user"));

      if (currentUser && response.data.room.hostId === currentUser.id) {
        setIsHost(true);
      } else {
        setIsHost(false);
      }

      console.log(response.data.participants);
    };

    getParticipants();
  }, [roomId]);

  useEffect(() => {
    const getMessages = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/chat/${roomId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setMessages(response.data.messages);
      } catch (error) {
        console.error("Error loading chat:", error);
      }
    };

    getMessages();
  }, [roomId]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    socket.emit("send-message", {
      roomId,
      sender: currentUser?.name,
      message,
    });

    setMessage("");
  };

  const handleLeaveRoom = async () => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/room/leave-room`,
        { roomId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      socket.emit("leave-room", {
        roomId,
        userName: currentUser?.name,
      });

      navigate("/home");
    } catch (error) {
      console.error(error);
    }
  };

  const handleEndMeeting = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/room/end-meeting`,
        { roomId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Notify all participants
      socket.emit("end-meeting", roomId);

      alert(response.data.message);

      navigate("/home");
    } catch (error) {
      console.error(error);

      alert(error.response?.data?.message || "Failed to end meeting");
    }
  };

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error(error);
      }
    };

    startCamera();

    return () => {
      if (localVideoRef.current?.srcObject) {
        localVideoRef.current.srcObject
          .getTracks()
          .forEach((track) => track.stop());
      }

      screenStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, []);

  const handleMicToggle = () => {
    if (!localStream) return;

    const audioTrack = localStream.getAudioTracks()[0];

    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;

    setIsMicOn(audioTrack.enabled);
  };

  const handleCameraToggle = async () => {
    try {
      // Turn Camera OFF
      if (isCameraOn) {
        const videoTrack = localStream?.getVideoTracks()[0];

        if (videoTrack) {
          videoTrack.stop();
        }

        setIsCameraOn(false);
        return;
      }

      // Turn Camera ON
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      const newVideoTrack = newStream.getVideoTracks()[0];

      const updatedStream = new MediaStream();

      if (newVideoTrack) {
        updatedStream.addTrack(newVideoTrack);
      }

      // keep existing microphone
      const audioTrack = localStream?.getAudioTracks()[0];

      if (audioTrack && audioTrack.readyState === "live") {
        updatedStream.addTrack(audioTrack);
      }

      setLocalStream(updatedStream);

      setIsCameraOn(true);
    } catch (error) {
      console.error("Camera Toggle Error:", error);
    }
  };

  const handleScreenShare = async () => {
    try {
      // Stop Screen Sharing
      if (isScreenSharing) {
        screenStreamRef.current?.getTracks().forEach((track) => {
          track.stop();
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
          /* localVideoRef.current.srcObject = screenStream; */
          localVideoRef.current.srcObject = localStream;
          await localVideoRef.current.play();
        }

        setIsScreenSharing(false);

        return;
      }

      // Start Screen Sharing
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      screenStreamRef.current = screenStream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      setIsScreenSharing(true);

      // User clicks "Stop Sharing" from browser popup
      screenStream.getVideoTracks()[0].onended = async () => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
          localVideoRef.current.srcObject = localStream;
          await localVideoRef.current.play();
        }

        setIsScreenSharing(false);
      };
    } catch (error) {
      console.error("Screen Share Error:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setMeetingTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRaiseHand = () => {
    const alreadyRaised = raisedHands.some(
      (item) => item.userId === currentUser.id,
    );

    if (alreadyRaised) return;

    socket.emit("raise-hand", {
      roomId,
      userId: currentUser.id,
      userName: currentUser.name,
    });
  };

  const formatTime = (seconds) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");

    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");

    const secs = String(seconds % 60).padStart(2, "0");

    return `${hrs}:${mins}:${secs}`;
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);

    alert("Room ID copied successfully");
  };

  const createPeerConnection = () => {
    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    // Local Tracks -> Remote User
    localStream?.getTracks().forEach((track) => {
      console.log("ADDING TRACK:", track.kind);
      peer.addTrack(track, localStream);
    });

    // Remote Tracks -> Remote Video Element
    peer.ontrack = (event) => {
      console.log("REMOTE TRACK RECEIVED");
      const remoteStream = event.streams[0];

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    // ICE Candidate
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          roomId,
          candidate: event.candidate,
        });
      }
    };

    peerConnectionRef.current = peer;

    return peer;
  };

  const createOffer = async () => {
    try {
      const peer = createPeerConnection();

      const offer = await peer.createOffer();

      await peer.setLocalDescription(offer);

      socket.emit("offer", {
        roomId,
        offer,
      });

      console.log("Offer Sent");
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    socket.emit("join-room", {
      roomId,
      userName: currentUser?.name,
    });

    socket.on("user-joined", async (data) => {
      createOffer();
      setMessages((prev) => [
        ...prev,
        {
          sender: "System",
          message: data.message,
          type: "notification",
        },
      ]);

      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/room/${roomId}/participants`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setParticipants(response.data.participants);
    });

    socket.on("user-left", (data) => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "System",
          message: data.message,
          type: "notification",
        },
      ]);
    });

    socket.on("receive-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("hand-raised", (data) => {
      setRaisedHands((prev) => {
        const exists = prev.find((user) => user.userId === data.userId);

        if (exists) return prev;

        return [...prev, data];
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: "System",
          message: `${data.userName} raised hand ✋`,
          type: "notification",
        },
      ]);
    });

    socket.on("meeting-ended", (message) => {
      alert(message);

      navigate("/home");
    });

    socket.on("offer", async (data) => {
      try {
        const peer = createPeerConnection();

        await peer.setRemoteDescription(new RTCSessionDescription(data.offer));

        const answer = await peer.createAnswer();

        await peer.setLocalDescription(answer);

        socket.emit("answer", {
          roomId,
          answer,
        });

        console.log("Answer Sent");
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("answer", async (data) => {
      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer),
        );

        console.log("Answer Received");
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("ice-candidate", async (data) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate),
          );
        }
      } catch (error) {
        console.error(error);
      }
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("receive-message");
      socket.off("hand-raised");
      socket.off("meeting-ended");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [roomId, navigate]);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        {/* Meeting Area */}
        <div className="flex-1 p-6">
          <div className="h-full bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">MeetClone</h1>

                <p className="text-sm text-gray-500 mt-1">Room ID</p>

                <div className="flex items-center gap-3 mt-1">
                  <p className="font-mono text-blue-600">{roomId}</p>

                  <button
                    onClick={handleCopyRoomId}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 relative">
                <div className="flex gap-3">
                  <div className="bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium">
                    🟢 Active
                  </div>

                  <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium">
                    ⏱ {formatTime(meetingTime)}
                  </div>
                </div>

                <div
                  onClick={() => setShowParticipants(!showParticipants)}
                  className="cursor-pointer bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <Users size={16} />
                  {participants.length}
                </div>

                {/* Participants Popup */}
                {showParticipants && (
                  <div className="absolute right-0 top-14 z-[9999]">
                    <div className="w-80 bg-white rounded-xl shadow-2xl border p-4 max-h-80 overflow-y-auto">
                      <h3 className="font-bold text-lg mb-3">
                        Participants ({participants.length})
                      </h3>

                      {participants.length === 0 ? (
                        <p className="text-gray-500">No participants found</p>
                      ) : (
                        participants.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100"
                          >
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                              {user.name?.charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-800">
                                    {user.name}
                                  </p>

                                  {raisedHands.some(
                                    (item) => item.userId === user.id,
                                  ) && (
                                    <span className="text-yellow-500 text-lg">
                                      ✋
                                    </span>
                                  )}
                                </div>

                                {roomInfo?.hostId === user.id && (
                                  <span className="text-yellow-500 font-semibold">
                                    👑
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-gray-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Video Area Placeholder */}
            <div className="flex flex-col h-full">
              <div className="flex-1 bg-[#1c1c1c] rounded-xl flex items-center justify-center">
                <div className="flex-1 bg-[#1c1c1c] rounded-xl flex items-center justify-center">
                  <div className="relative w-full h-full flex items-center justify-center p-4">
                    {isCameraOn ? (
                      <>
                        <video
                          ref={localVideoRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full rounded-xl object-cover"
                        />

                        {remoteVideoRef && (
                          <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="absolute top-5 right-5 w-64 h-40 rounded-lg border-2 border-white bg-black"
                          />
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full">
                        <div className="w-32 h-32 rounded-full bg-blue-600 text-white text-5xl font-bold flex items-center justify-center">
                          {currentUser?.name?.charAt(0)?.toUpperCase()}
                        </div>

                        <p className="mt-4 text-white text-xl">
                          {currentUser?.name}
                        </p>

                        <p className="text-gray-400">Camera Off</p>
                      </div>
                    )}

                    <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg">
                      {currentUser?.name}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-5">
                <div className="bg-black/90 px-6 py-3 rounded-full flex gap-4 shadow-xl">
                  <button
                    onClick={handleMicToggle}
                    className={`p-3 rounded-full text-white ${
                      isMicOn
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    <Mic size={20} strokeWidth={2.5} />
                  </button>

                  <button
                    onClick={handleCameraToggle}
                    className={`p-3 rounded-full text-white ${
                      isCameraOn
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    <Video size={20} />
                  </button>

                  <button
                    className={`p-3 rounded-full text-white ${
                      showChat ? "bg-blue-600" : "bg-gray-700"
                    }`}
                    onClick={() => setShowChat(!showChat)}
                  >
                    <MessageSquare size={20} />
                  </button>

                  <button
                    onClick={handleScreenShare}
                    className={`p-3 rounded-full text-white ${
                      isScreenSharing
                        ? "bg-blue-600"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    <MonitorUp size={20} />
                  </button>

                  <button
                    onClick={handleRaiseHand}
                    className="p-3 bg-yellow-500 rounded-full text-white hover:bg-yellow-600"
                  >
                    ✋
                  </button>

                  <div className="flex gap-3">
                    <button
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      onClick={handleLeaveRoom}
                    >
                      Leave
                    </button>

                    {isHost && (
                      <button
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                        onClick={handleEndMeeting}
                      >
                        End Meeting
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Right Side Panel */}
        <div
          className={`
    bg-white border-l shadow-lg flex flex-col
    transition-all duration-300 overflow-hidden
    ${showChat ? "w-[350px]" : "w-0"}
  `}
        >
          <div
            ref={chatContainerRef}
            className="w-[350px] bg-white border-l shadow-lg flex flex-col overflow-y-auto"
          >
            <div className="p-5 border-b">
              <h2 className="text-2xl font-bold">Chat</h2>
            </div>

            {messages.map((msg, index) => (
              <div key={index} className="mb-3">
                {msg.type === "notification" ? (
                  <div className="text-center text-sm text-blue-600 font-medium">
                    {msg.message}
                  </div>
                ) : (
                  <>
                    <p className="font-semibold">{msg.sender}</p>

                    <p>{msg.message}</p>
                  </>
                )}
              </div>
            ))}

            <div className="p-4 border-t">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full p-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                className="w-full mt-3 bg-blue-600 text-white py-3 rounded-lg"
                onClick={handleSendMessage}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeetingRoom;
