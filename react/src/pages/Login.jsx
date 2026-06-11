// Login.jsx

import { Link } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const responce = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/auth/login`,
        {
          email,
          password,
        },
      );

      if (responce.data.success) {
        localStorage.setItem("token", responce.data.token);

        localStorage.setItem("user", JSON.stringify(responce.data.user));

        setMessage(responce.data.message);

        navigate("/home");

        setEmail("");
        setPassword("");
      }
    } catch (error) {
      console.error("Login failed:", error);

      setIsError(true);
      setMessage(error?.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Welcome Back</h1>

        <p className="text-center text-gray-500 mb-6">Login to continue</p>

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block mb-1 font-medium">Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <p
            className={`text-md font-bold ${isError ? "text-red-600" : "text-green-700"}`}
          >
            {message}
          </p>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>

        <p className="text-center mt-5 text-gray-600">
          Don't have an account?
          <Link to="/register" className="text-blue-600 font-semibold ml-1">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
