import React, { useEffect, useState } from "react";
import axios from "axios";
import SingleRoom from "./singleRoom";
import SearchBar from "./searchBar";
import { useTranslation } from "react-i18next";
import bathData from "/bath.json";

function RoomCard({ selectedNumRoom, selectedCategory }) {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const bathWubids = new Set(bathData.bath);

  // Fetch paginated data from server
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://royalapart.online/api/siteRoyal/get-all-wodoo?page=${currentPage}&limit=${itemsPerPage}`
        );

        if (response.data.success) {
          setRooms(response.data.data);

          // Set pagination info if available
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.totalPages);
            setTotalCount(response.data.pagination.totalItems);
          } else {
            // Fallback for backward compatibility
            setTotalCount(response.data.count);
            setTotalPages(Math.ceil(response.data.count / itemsPerPage));
          }
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedNumRoom]);

  // Apply filters to the current page's data
  useEffect(() => {
    const filtered = rooms.filter((room) => {
      const matchesSearchQuery = room.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const hasBath = bathWubids.has(room.wubid);

      const categoryFilterActive =
        selectedCategory && selectedCategory.length > 0;
      const numRoomFilterActive = selectedNumRoom && selectedNumRoom.length > 0;

      let matchesCategories = true;
      if (categoryFilterActive) {
        if (selectedCategory.includes("bath")) {
          const otherCategories = selectedCategory.filter(
            (cat) => cat !== "bath"
          );
          matchesCategories =
            hasBath &&
            (otherCategories.length === 0 ||
              otherCategories.includes(room.category));
        } else {
          matchesCategories = selectedCategory.includes(room.category);
        }
      }

      let matchesNumRoom = true;
      if (numRoomFilterActive) {
        matchesNumRoom = selectedNumRoom.includes(room.numrooms);
      }

      return matchesSearchQuery && matchesCategories && matchesNumRoom;
    });

    setFilteredRooms(filtered);
  }, [rooms, searchQuery, selectedCategory, selectedNumRoom]);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const { t } = useTranslation();

  return (
    <div className="w-screen md:w-[100%]">
      <div className="flex flex-col md:flex-row font-oswald items-center mb-4">
        <SearchBar setSearchQuery={setSearchQuery} />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <p>{t("Loading...")}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-center">
            {filteredRooms.length > 0 ? (
              filteredRooms.map((room) => (
                <SingleRoom key={room.wubid} room={room} />
              ))
            ) : (
              <p className="py-8">{t("No rooms found.")}</p>
            )}
          </div>

          {totalCount > 0 && totalPages > 1 && (
            <div className="flex justify-center mt-12 my-2 text-xs md:text-base font-popins">
              <button
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
                className="px-0 md:px-3 py-2 bg-shit2 bg-opacity-20 hover:bg-opacity-30 rounded-md mr-2 hover:underline hover:transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("First")}
              </button>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-0 md:px-3 py-2 bg-shit2 bg-opacity-20 hover:bg-opacity-30 rounded-md mr-2 hover:underline hover:transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("Previous")}
              </button>
              <span className="px-0 md:px-4 py-2">
                {t("Page")} {currentPage} {t("of")} {totalPages}
              </span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-0 md:px-3 py-2 bg-shit2 bg-opacity-20 hover:bg-opacity-30 rounded-md ml-2 mr-2 hover:underline hover:transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("Next")}
              </button>
              <button
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
                className="px-0 md:px-3 py-2 bg-shit2 bg-opacity-20 hover:bg-opacity-30 rounded-md ml-2 hover:underline hover:transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("Last")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default RoomCard;
