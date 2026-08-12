/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { useSearchParams } from "react-router-dom";
const Sortoption = () => {
  const [searchParams, setSearchParams] = useSearchParams("");
  const handleSortChange = (e) => {
    const sortBy = e.target.value;
    const nextParams = new URLSearchParams(searchParams);
    if (sortBy) nextParams.set("sortBy", sortBy);
    else nextParams.delete("sortBy");
    setSearchParams(nextParams);
  };
  return (
    <div className="mb-4 flex items-center justify-end">
      <select
        name=""
        id="sort"
        onChange={handleSortChange}
        value={searchParams.get("sortBy") || ""}
        className="border py-2 rounded-md focus:outline-none"
      >
        <option value="">Default</option>
        <option value="priceAsc">Price: Low to High</option>
        <option value="priceDesc">Price: High to Low</option>
        <option value="popularity">Popularity</option>
      </select>
    </div>
  );
};

export default Sortoption;
