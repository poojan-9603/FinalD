import React, { useEffect, useState, useCallback } from 'react';
import { db, auth } from '../firebase'; 
import { query, collection, where, getDocs, doc, updateDoc } from 'firebase/firestore'; 
import './Streaks.css'; 

const Streaks = ({ predictionStatus }) => {
  const [streaks, setStreaks] = useState({}); 
  const [totalDistance, setTotalDistance] = useState(0); 
  const [savings, setSavings] = useState(0); 

  const initializeStreaks = useCallback(async () => {
    const user = auth.currentUser; 
    if (!user) return;

    const userId = user.uid; 
    const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
    const userSnapshot = await getDocs(userQuery);

    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0]; 
      const routes = userDoc.data().routes || [];
      const firstRoute = routes[0] || {}; 
      const dailyRouteDistance = firstRoute.distance || 0; 
      const dailyRouteCost = firstRoute.cost || 0; 

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const streaksData = {};

      // Fetch existing streaks from Firestore
      const existingStreaks = userDoc.data().streaks || [];

      for (let day = 1; day <= 31; day++) {
        const date = new Date(currentYear, currentMonth, day);
        if (date.getMonth() === currentMonth) {
          const isPastDate = date <= new Date();
          const dateString = date.toISOString();

          // Set streaks based on existing streaks
          streaksData[day] = existingStreaks.includes(dateString); // true if the date is in existing streaks, false otherwise
        }
      }

      setStreaks(streaksData); 

      const totalGreenDays = Object.values(streaksData).filter(value => value === true).length; 
      const newTotalDistance = totalGreenDays * dailyRouteDistance * 2; 
      const newSavings = totalGreenDays * dailyRouteCost * 2; 

      setTotalDistance(newTotalDistance); 
      setSavings(newSavings); 

      await updateDoc(doc(db, 'users', userDoc.id), {
        totalDistance: newTotalDistance,
        savings: newSavings 
      });
    }
  }, []); 

  useEffect(() => {
    initializeStreaks(); 
  }, [initializeStreaks]); 

  const toggleStreak = async (day) => {
    const user = auth.currentUser; 
    if (user) {
      const userId = user.uid; 
      const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0]; 
        const existingStreaks = userDoc.data().streaks || [];
        const date = new Date(new Date().getFullYear(), new Date().getMonth(), day).toISOString();

        const updatedStreaks = { ...streaks };
        const currentPrediction = updatedStreaks[day]; // Get the current prediction

        // Toggle the streak
        updatedStreaks[day] = !currentPrediction; // Change true to false or false to true

        // Update the streaks in the database
        if (updatedStreaks[day]) {
          // If the date is now green (true)
          if (!existingStreaks.includes(date)) {
            existingStreaks.push(date);
          }
        } else {
          // If the date is now red (false)
          const index = existingStreaks.indexOf(date);
          if (index > -1) {
            existingStreaks.splice(index, 1);
          }
        }

        // Update the database with the new streaks and prediction
        await updateDoc(doc(db, 'users', userDoc.id), {
          streaks: existingStreaks,
          goingOutPrediction: updatedStreaks[day] // Update the prediction based on the current toggle
        });

        // Calculate new totals
        const totalGreenDays = Object.values(updatedStreaks).filter(value => value === true).length; 
        const routes = userDoc.data().routes || [];
        const firstRoute = routes[0] || {}; 
        const dailyRouteDistance = firstRoute.distance || 0; 
        const dailyRouteCost = firstRoute.cost || 0; 

        const newTotalDistance = totalGreenDays * dailyRouteDistance * 2; 
        const newSavings = totalGreenDays * dailyRouteCost * 2; 

        setTotalDistance(newTotalDistance); 
        setSavings(newSavings); 

        await updateDoc(doc(db, 'users', userDoc.id), {
          totalDistance: newTotalDistance,
          savings: newSavings 
        });

        // Update the local state
        setStreaks(updatedStreaks);
      }
    }
  };

  const totalGreenDays = Object.values(streaks).filter(value => value === true).length;

  useEffect(() => {
    const logResults = async () => {
      const user = auth.currentUser; 
      if (user) {
        const userId = user.uid; 
        const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0]; 
          const routes = userDoc.data().routes || [];
          const firstRoute = routes[0] || {}; 
          const dailyRouteDistance = firstRoute.distance || 0; 
          const dailyRouteCost = firstRoute.cost || 0; 

          const calculatedTotalDistance = totalGreenDays * dailyRouteDistance * 2; 
          const calculatedSavings = totalGreenDays * dailyRouteCost * 2; 

          await updateDoc(doc(db, 'users', userDoc.id), {
            totalDistance: calculatedTotalDistance,
            savings: calculatedSavings 
          });
        }
      }
    };

    logResults(); 
  }, [totalGreenDays]); 

  return (
    <div className="streaks-container">
      <h1 className="title">Your Biking Streaks</h1>
      <div className="instructions">Click on a date box to mark it as a successful ride (green) or an unsuccessful ride (red).</div>
      <div className="total-green-days">🎉 Total Green Days: {totalGreenDays} 🎉</div>
      <div className="streaks-grid">
        {Object.keys(streaks).map(day => {
          const date = new Date(new Date().getFullYear(), new Date().getMonth(), day);
          const dayOfWeek = date.toLocaleString('default', { weekday: 'short' }); 
          
          const isFutureDate = date > new Date(); 
          const isToday = date.toDateString() === new Date().toDateString(); 

          const dayStyle = {
            backgroundColor: isToday ? (streaks[day] === true ? '#4caf50' : '#f44336') : (streaks[day] === true ? '#4caf50' : 'gray'), 
            color: '#fff', 
            cursor: isFutureDate ? 'not-allowed' : 'pointer', 
            opacity: isFutureDate ? 0.5 : 1 
          };

          return (
            <div
              key={day}
              className="streak-day"
              style={dayStyle} 
              onClick={() => !isFutureDate && toggleStreak(day)} 
            >
              {day} <br /> {dayOfWeek}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Streaks;