/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the license file for more information.
 */
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-9xl font-bold text-stone-200 mb-4">404</div>
        <h1 className="text-3xl font-bold text-stone-900 mb-4">Page Not Found</h1>
        <p className="text-stone-600 mb-8 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-stone-800 transition-colors"
          >
            Go Home
          </Link>
          <Link
            to="/collections/all"
            className="px-6 py-3 border-2 border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors"
          >
            Browse Products
          </Link>
        </div>
        <div className="mt-12 pt-8 border-t border-stone-100">
          <p className="text-stone-500 text-sm mb-4">Popular categories:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { path: "/collections/all?gender=Men", label: "Men" },
              { path: "/collections/all?gender=Women", label: "Women" },
              { path: "/collections/all?category=Top+Wear", label: "Top Wear" },
              { path: "/collections/all?category=Bottom+Wear", label: "Bottom Wear" },
            ].map((cat) => (
              <Link
                key={cat.path}
                to={cat.path}
                className="px-3 py-1.5 text-sm text-stone-600 hover:text-zyra-primary hover:bg-stone-100 rounded-lg transition-colors"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;