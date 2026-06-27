import "./App.css";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import MeetingRoom from "./pages/MeetingRoom";
import Register from "./pages/Register";
// import ProtectedRoute from "./components/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/home",
    element: <Home />,
  },
  {
    path: "/meeting/:roomId",
    element: <MeetingRoom />,
  },
  {
    path: "/profile",
    element: (
      <>
        <div>
          This feature Is not Available at this time. should be added soon
        </div>
      </>
    ),
  },
  /* {
    path: "/home",
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
  },
  {
    path: "/meeting/:roomId",
    element: (
      <ProtectedRoute>
        <MeetingRoom />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <>
          <div>
            This feature Is not Available at this time. should be added soon
          </div>
        </>
      </ProtectedRoute>
    ),
  }, */
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
