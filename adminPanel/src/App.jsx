// App.jsx
import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/mainpage/Header";
import RoomCard from "./components/mainpage/roomCard";
import Analis from "./components/pages/analytic/analis"; // створимо цю сторінку

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <BrowserRouter>
      <div className="bg-black h-full">
        <Header onLoginSuccess={handleLoginSuccess} isLoggedIn={isLoggedIn} />

        <Routes>
          {/* головна сторінка */}
          <Route path="/" element={isLoggedIn ? <RoomCard /> : null} />
          
          {/* сторінка Аналізу */}
          <Route
            path="/analis"
            element={
              isLoggedIn ? (
                <Analis />
              ) : (
                <div className="text-white text-center p-10">
                  <p>Спочатку авторизуйтесь, щоб отримати доступ до сторінки Аналізу.</p>
                </div>
              )
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
