/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { Link } from "react-router-dom";
import { useState } from "react";
import login from "../assets/login.webp";
import { loginUser } from "../redux/slices/authSlice";
import { useDispatch } from "react-redux";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const handleSubmit = (e) => {
    e.preventDefault();
    // console.log("Email:", email);
    // console.log("Password:", password);
    dispatch(loginUser({ email, password }));
  };
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-white">
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-12">
        <form
          onSubmit={handleSubmit}
          action=""
          className="w-full max-w-lg bg-white p-8 md:p-10 rounded-2xl border shadow-sm"
        >
          <div className="flex justify-center mb-6">
            <h2 className="text-xl font-medium">ZYRA</h2>
          </div>
          <h2 className="text-2xl font-bold text-center mb-6">Hey there! </h2>
          <p className="text-center mb-6">
            Enter your username and password to login
          </p>
          <div className="mb-4">
            <label htmlFor="" className="block text0sm font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter your email address"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="" className="block text-sm font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white p-2 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            Sign In
          </button>
          <p className="mt-6 text-center text-sm">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-500">
              Register
            </Link>
          </p>
        </form>
      </div>

      <div className="hidden md:flex w-1/2 bg-gray-800 overflow-hidden">
        <img
          src={login}
          alt="Login to Account"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default Login;
