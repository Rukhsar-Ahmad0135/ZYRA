/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { useState } from "react";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { HiMiniXMark } from "react-icons/hi2";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setFilters, fetchProductsByCollection } from "../../redux/slices/productSlice";

const Searchbar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleSearchToogle = () => {
    setIsOpen(!isOpen);
  };
  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setFilters({ search: searchTerm }));
    dispatch(fetchProductsByCollection({ search: searchTerm }));
    navigate(`/collections/all?search=${searchTerm}`);
    setIsOpen(false);
    // Handle search submission logic here
  };
  return (
    <div
      className={`flex items-center justify-center w-full transition-all duration-300 ${isOpen ? "absolute top-0 left-0 w-full bg-white h-24 z-50" : "w-auto"} `}
    >
      {isOpen ? (
        <form onSubmit={handleSearch} className="relative flex items-center justify-center w-full">
          <div className="relative w-1/2">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-100 px-4 py-2 pl-2 pr-12 rounded-lg focus:outline-none w-full placeholder:text-gray-700"
            />
            {/*search button */}
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
            >
              <HiMagnifyingGlass className="h-6 w-6"></HiMagnifyingGlass>
            </button>
          </div>
          {/*search button */}
          <button
            type="button"
            onClick={handleSearchToogle}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
          >
            <HiMiniXMark className="h-6 w-6"></HiMiniXMark>
          </button>
        </form>
      ) : (
        <button onClick={handleSearchToogle}>
          <HiMagnifyingGlass className="h-6 w-6"></HiMagnifyingGlass>
        </button>
      )}
    </div>
  );
};

export default Searchbar;
