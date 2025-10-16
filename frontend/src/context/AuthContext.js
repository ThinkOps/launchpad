import React, { createContext, useState, useEffect } from "react";
import { getUserFromToken, isTokenExpired } from "../utils/token";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);  // user details
  const [token, setToken] = useState(null); // jwt token

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken && !isTokenExpired(storedToken)) {
      setToken(storedToken);
      setUser(getUserFromToken(storedToken));
    }
  }, []);

  const login = (token) => {
    localStorage.setItem("access_token", token);
    setToken(token);
    setUser(getUserFromToken(token));
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};