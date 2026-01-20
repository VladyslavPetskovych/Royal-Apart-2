import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/utils/header";
import Footer from "./components2/utils/footer";
import Book from "./pages/book/book";
import Home from "./pages/home/home";
import Aparts from "./pages/aparts/aparts";
import Rules from "./pages/rules/rules";
import Contact from "./pages/contact";
import RoomPage from "./pages/roomPage/roomPage";
import MiniHotel from "./pages/mini-hotel/MiniHotel";
import NotFound from "./components/utils/NotFound";
import Loader from "./components/utils/loader";
import TermsAndConditions from "./pages/thermsAndConditions";
import PrivacyPolicy from "./pages/privacyPolicy";

import { Provider } from "react-redux";
import store from "./redux/store";

import { useDispatch, useSelector } from "react-redux";
import { fetchApartments, selectApartStatus } from "./redux/apartSlice";

function AppContent() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();
  const status = useSelector(selectApartStatus);

  // твій лоадер на зміну route
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [location]);

  // один раз тягнемо апартаменти (і не дублюємо запити)
  useEffect(() => {
    if (status === "idle") dispatch(fetchApartments());
  }, [dispatch, status]);

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/uk" element={<Home />} />
            <Route path="/en" element={<Home />} />
            <Route path="/aparts" element={<Aparts />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/book" element={<Book />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/mini-hotel" element={<MiniHotel />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route
              path="/terms-and-conditions"
              element={<TermsAndConditions />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </>
      )}
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
