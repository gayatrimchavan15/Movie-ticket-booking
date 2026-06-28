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
import FeedbackManagement from "./components/admin/FeedbackManagement";
import MoviesReportPage from "./components/admin/MovieReport"; // Adjust path
import MovieReport from "./components/admin/MovieReport";
import TheaterReportPage from "./components/admin/TheaterReportPage";
import UserReport from "./components/admin/UserReport";
import BookingReportPage from './components/admin/BookingReportPage';
import ShowtimeReport from "./components/admin/ShowtimeReport";
import MessagesReport from "./components/admin/MessagesReport";
import ReviewRatingReport from "./components/admin/ReviewRatingReport";
import RevenueReport from "./components/admin/RevenueReport";
import CityReport from "./components/admin/CityReport";
import SeatUtilizationReport from "./components/admin/SeatUtilizationReport";
import CustomerLoyaltyReport from "./components/admin/CustomerLoyaltyReport";



import ShowtimeSelection from "./components/ShowtimeSelection";
import SeatSelection from "./components/SeatSelection";
import BookingConfirmation from "./components/BookingConfirmation";
import PaymentPage from "./components/PaymentPage";
import { CityProvider } from "./context/CityContext";

// ✅ user pages
import UserDashboard from "./components/user/UserDashboard";
import Dashboard from "./components/user/Dashboard";
import BookingHistory from "./components/user/BookingHistory";
import BrowseMovies from "./components/user/BrowseMovies";
import Profile from "./components/user/Profile";
import Feedback from "./components/user/Feedback"; // adjust path

// ✅ Notification system components
import ContactForm from "./components/ContactForm";
import UserMessages from "./components/UserMessages";
import NotificationTest from "./components/NotificationTest";
import NotificationDebug from "./components/NotificationDebug";

function App() {
  return (
    <CityProvider>
      <Router>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Main layout pages */}
          <Route path="/" element={<Layout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="homepage" element={<HomePage />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="movies" element={<Movies />} />

            {/* Booking flow routes */}
            <Route path="showtime-selection" element={<ShowtimeSelection />} />
            <Route path="seat-selection" element={<SeatSelection />} />
            <Route path="booking-confirmation" element={<BookingConfirmation />} />
            <Route path="payment" element={<PaymentPage />} />

            {/* Movie Details */}
            <Route path="/movie-details/:id" element={<MovieDetails />} />
            
            {/* ✅ Notification system routes */}
            <Route path="contact-form" element={<ContactForm />} />
            <Route path="user-messages" element={<UserMessages />} />
            <Route path="notification-test" element={<NotificationTest />} />
            <Route path="notification-debug" element={<NotificationDebug />} />
          </Route>

          {/* Admin dashboard routes */}
          <Route path="/admin/AdminDashboard" element={<AdminDashboard />} />

          <Route path="/admin/addmovie" element={<AddMovie />} />
          <Route path="/admin/managemovies" element={<ManageMovies />} />
          <Route path="/admin/AddCityTheaters" element={<AddCityTheater />} />
          <Route path="/admin/ManageCitiesTheaters" element={<ManageCitiesTheaters />} />
          <Route path="/admin/AddShowTime" element={<AddShowtime />} />
          <Route path="/admin/ManageShowTimes" element={<ManageShowTimes />} />
          <Route path="/admin/BookingManagement" element={<BookingManagement />} />
          <Route path="/admin/UserManagement" element={<UserManagement />} />
          <Route path="/admin/ReportsAnalytics" element={<ReportsAnalytics />} />
          <Route path="/admin/reports-analytics" element={<ReportsAnalytics />} />
          <Route path="/admin/Settings" element={<Settings />} />
          <Route path="/admin/feedbackmanagement" element={<FeedbackManagement />}/> 
          <Route path="/admin/moviesreport" element={<MovieReport />} />
          <Route path="/admin/theaterreport" element={<TheaterReportPage />} />
          <Route path="/admin/userreport" element={<UserReport/>} />
          <Route path="/admin/bookingreportpage" element={<BookingReportPage/>} />
          <Route path="/admin/showtimereport" element={<ShowtimeReport />} />
          <Route path="/admin/messagesreport" element={<MessagesReport />} />
          <Route path="/admin/reviewratingreport" element={<ReviewRatingReport />} />
          <Route path="/admin/revenuereport" element={<RevenueReport />} />
          <Route path="/admin/cityreport" element={<CityReport />} />
          <Route path="/admin/seatreport" element={<SeatUtilizationReport />} />
          <Route path="/admin/loyaltyreport" element={<CustomerLoyaltyReport />} />
          
          

          {/* ✅ User dashboard with nested routes */}
          <Route path="/user" element={<UserDashboard />}>
            <Route index element={<Dashboard />} />
            <Route path="booking-history" element={<BookingHistory />} />
            <Route path="browse-movies" element={<BrowseMovies />} />
            <Route path="profile" element={<Profile />} />
            <Route path="feedback" element={<Feedback />} /> {/* ✅ fixed (removed /) */}
          </Route>

          {/* 404 fallback (optional) */}
          {/* <Route path="*" element={<h1>404 - Page Not Found</h1>} /> */}
        </Routes>
      </Router>
    </CityProvider>
  );
}

export default App;
