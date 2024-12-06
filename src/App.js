import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import GoOut from './pages/GoOut';
import FirstTimeLogin from './pages/FirstTimeLogin';
import BikeCost from './pages/BikeCost';
import LoginPage from './pages/LoginPage';
import './App.css';
import Streaks from './pages/Streaks';
import CreateAccount from './pages/CreateAccount';

const App = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/go-out" element={<GoOut />} />
          <Route path="/first-time-login" element={<FirstTimeLogin />} />
          <Route path="/bike-cost" element={<BikeCost />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/streaks" element={<Streaks />} />
          <Route path="/create-account" element={<CreateAccount />} />

        </Routes>
      </div>
    </Router>
  );
};

export default App;