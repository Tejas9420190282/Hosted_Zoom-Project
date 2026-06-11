// Home.jsx

import { Video, MessageSquare, ScreenShare, Users } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Home() {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const handleCreateMeeting = async () => {
    try {
      const token = localStorage.getItem("token");

      console.log("FRONTEND TOKEN:", token);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/room/create-room`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      navigate(`/meeting/${response.data.room.roomId}`);

      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleJoinMeeting = async () => {
    try {
      if (!roomId.trim()) {
        return alert("Please enter Room ID");
      }

      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/room/join-room`,
        {
          roomId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log(response.data);

      navigate(`/meeting/${roomId}`);
    } catch (error) {
      console.error(error);

      alert(error.response?.data?.message || "Failed to join room");
    }
  };

  const handleLogout = (e) => {
    e.preventDefault();

    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 bg-white shadow">
        <h1 className="text-2xl font-bold text-blue-600">MeetClone</h1>

        <div className="flex items-center gap-4">
          <button
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            onClick={() => navigate("/profile")}
          >
            Profile
          </button>

          <button
            className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 text-center h-[70vh]">
        <h1 className="mb-4 text-5xl font-bold">Video Meetings for Everyone</h1>

        <p className="max-w-2xl mb-8 text-lg text-gray-600">
          Connect with your team through secure video meetings, real-time chat,
          screen sharing and collaboration.
        </p>

        <div className="flex flex-col items-center gap-4 md:flex-row">
          <button
            className="px-8 py-3 text-lg text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
            onClick={handleCreateMeeting}
          >
            Create Meeting
          </button>

          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="px-4 py-3 border rounded-lg"
          />

          <button
            className="px-8 py-3 text-lg border rounded-lg hover:bg-gray-100"
            onClick={handleJoinMeeting}
          >
            Join Meeting
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 bg-white">
        <h2 className="mb-12 text-4xl font-bold text-center">Features</h2>

        <div className="grid max-w-6xl grid-cols-1 gap-8 mx-auto md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 text-center rounded-xl shadow">
            <Video className="mx-auto mb-4 text-blue-600" size={40} />
            <h3 className="mb-2 text-xl font-semibold">HD Video Calls</h3>
            <p className="text-gray-600">
              Crystal clear audio and video meetings.
            </p>
          </div>

          <div className="p-6 text-center rounded-xl shadow">
            <MessageSquare className="mx-auto mb-4 text-blue-600" size={40} />
            <h3 className="mb-2 text-xl font-semibold">Live Chat</h3>
            <p className="text-gray-600">
              Communicate instantly with participants.
            </p>
          </div>

          <div className="p-6 text-center rounded-xl shadow">
            <ScreenShare className="mx-auto mb-4 text-blue-600" size={40} />
            <h3 className="mb-2 text-xl font-semibold">Screen Sharing</h3>
            <p className="text-gray-600">Present your work with ease.</p>
          </div>

          <div className="p-6 text-center rounded-xl shadow">
            <Users className="mx-auto mb-4 text-blue-600" size={40} />
            <h3 className="mb-2 text-xl font-semibold">Group Meetings</h3>
            <p className="text-gray-600">
              Connect multiple participants in one room.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-white bg-gray-900">
        <p>© 2026 MeetClone. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
