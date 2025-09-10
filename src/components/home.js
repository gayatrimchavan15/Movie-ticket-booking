// import React, { useState, useEffect } from "react";
// import { db } from "../firebaseConfig";
// import { ref, onValue } from "firebase/database";
// import { useNavigate } from "react-router-dom";


// export default function HomePage() {
//   const [cities, setCities] = useState([]);
//   const [selectedCity, setSelectedCity] = useState("");
//   const [movies, setMovies] = useState([]);
//   const navigate = useNavigate();

//   // Fetch cities
//   useEffect(() => {
//     const cityRef = ref(db, "cities");
//     onValue(cityRef, (snapshot) => {
//       const data = snapshot.val();
//       const cityList = data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [];
//       setCities(cityList);
//     });
//   }, []);

//   // Fetch movies for selected city
//   useEffect(() => {
//     if (!selectedCity) return;
//     const moviesRef = ref(db, "movies");
//     onValue(moviesRef, (snapshot) => {
//       const data = snapshot.val();
//       const movieList = data
//         ? Object.entries(data)
//             .filter(([_, movie]) => movie.cities && movie.cities[selectedCity])
//             .map(([id, movie]) => ({ id, ...movie }))
//         : [];
//       setMovies(movieList);
//     });
//   }, [selectedCity]);

//   return (
//     <div style={{ padding: "20px" }}>
//       <h1>Movie Ticket Booking</h1>
      
//       {/* City Selection Dropdown */}
//       <select onChange={(e) => setSelectedCity(e.target.value)} value={selectedCity}>
//         <option value="">Select City</option>
//         {cities.map((city) => (
//           <option key={city.id} value={city.id}>{city.name}</option>
//         ))}
//       </select>

//       {/* Movie List */}
//       <div style={{ display: "flex", flexWrap: "wrap", marginTop: "20px" }}>
//         {movies.map((movie) => (
//           <div 
//             key={movie.id}
//             onClick={() => navigate(`/movie/${movie.id}`)}
//             style={{
//               border: "1px solid #ccc",
//               borderRadius: "8px",
//               padding: "10px",
//               margin: "10px",
//               cursor: "pointer",
//               width: "200px",
//               textAlign: "center"
//             }}
//           >
//             <img src={movie.poster} alt={movie.title} style={{ width: "100%", borderRadius: "8px" }} />
//             <h3>{movie.title}</h3>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }