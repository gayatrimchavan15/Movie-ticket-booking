import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./components/HomePage";
import Signup from "./components/Signup";
import Login from "./components/Login";
import MovieDetails from "./components/MovieDetails";
import AdminDashboard from "./components/admin/AdminDashboard";
import About from "./components/About";
import Contact from "./components/Contact";
import Movies from "./components/Movies";
import UserDashboard from "./components/UserDashboard";
import ProtectRoute from "./components/ProtectRoute";
import AddMovie from "./components/admin/AddMovie";
import ManageMovies from "./components/admin/ManageMovies";
import AddCityTheater from "./components/admin/AddCityTeater";
import ManageCitiesTheaters from "./components/admin/ManageCitiesTheater";
import AddShowtime from "./components/admin/AddShowTime";
import ManageShowTimes from "./components/admin/ManageShowTimes";
import BookingManagement from "./components/admin/BookingManagement";
import UserManagement from "./components/admin/UserManagement";
import ReportsAnalytics from "./components/admin/ReportsAnalytics";
import Settings from "./components/admin/Settings";
import ShowtimeSelection from "./components/ShowtimeSelection";
import SeatSelection from "./components/SeatSelection";
import BookingConfirmation from "./components/BookingConfirmation";
import PaymentPage from "./components/PaymentPage";
import { CityProvider } from "./context/CityContext";


function App() {
  return (
    <CityProvider>
      <Router>
        <Routes>
          {/* Redirect default "/" to login */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* All pages with Navbar + Footer (Layout wrapper) */}
          <Route path="/" element={<Layout />}>
            <Route path="homepage" element={<HomePage />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="movies" element={<Movies />} />
            <Route path="movie/:title" element={<MovieDetails />} />
            {/* <Route path="add-movie" element={<AddMovie />} />
            <Route path="managemovies" element={<ManageMovies/>} />
             */}

            {/* New booking flow routes */}
            <Route path="/showtime-selection" element={<ShowtimeSelection />} />
            <Route path="/seat-selection" element={<SeatSelection />} />
            <Route path="/booking-confirmation" element={<BookingConfirmation />} />
            <Route path="/payment" element={<PaymentPage />} />

          </Route>

          {/* Admin without Layout (separate dashboard UI) */}
          <Route path="/admin/AdminDashboard" element={<AdminDashboard />} />
          <Route path="/admin/addmovie" element={<AddMovie />} />
          <Route path="/admin/managemovies" element={<ManageMovies/>} />
          <Route path="/admin/AddCityTheaters" element={<AddCityTheater/>} />
          <Route path="/admin/ManageCitiesTheaters" element={<ManageCitiesTheaters/>} />
          <Route path="/admin/AddShowTime" element={<AddShowtime/>} />
          <Route path="admin/ManageShowTimes" element={<ManageShowTimes/>} />
          <Route path="admin/BookingManagement" element={<BookingManagement/>} />
          <Route path="/admin/UserManagement" element={<UserManagement/>} />
          <Route path="/admin/ReportsAnalytics"element={<ReportsAnalytics/>} />
          <Route path="admin/Settings" element={<Settings/>} />



          {/* Example Protected Routes (later you can enable) */}
          {/*
          <Route
            path="/admin-dashboard"
            element={
              <ProtectRoute roleRequired="admin">
                <AdminDashboard />
              </ProtectRoute>
            }
          />
          <Route
            path="/user-dashboard"
            element={
              <ProtectRoute roleRequired="user">
                <UserDashboard />
              </ProtectRoute>
            }
          />
          */}

          {/* 404 Page - uncomment if you want */}
          {/* <Route path="*" element={<h1>404 - Page Not Found</h1>} /> */}
        </Routes>
      </Router>
    </CityProvider>
  );
}

export default App;
