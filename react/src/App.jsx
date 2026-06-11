import "./App.css";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import MeetingRoom from "./pages/MeetingRoom";
import Register from "./pages/Register";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/home",
        element: <Home />
    },
    {
        path: "/meeting/:roomId",
        element: <MeetingRoom   />
    },
]);

function App() {
  return (
    <>
        <RouterProvider router={router} />
    </>
  );
}

export default App;