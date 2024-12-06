import React, { useEffect, useState, useCallback } from 'react';
import { db, auth } from '../firebase'; 
import { query, collection, where, getDocs, doc, updateDoc } from 'firebase/firestore'; 
import './Streaks.css'; 

const Streaks = ({ predictionStatus }) => {
  const [streaks, setStreaks] = useState({}); 
  const [goingOutPrediction, setGoingOutPrediction] = useState(false); 

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

      const existingStreaks = userDoc.data().streaks || [];

      for (let day = 1; day <= 31; day++) {
        const date = new Date(currentYear, currentMonth, day);
        if (date.getMonth() === currentMonth) {
          const dateString = date.toISOString();
          streaksData[day] = existingStreaks.includes(dateString); 
        }
      }

      setStreaks(streaksData); 

      const totalGreenDays = Object.values(streaksData).filter(value => value === true).length; 
      const newTotalDistance = totalGreenDays * dailyRouteDistance * 2; 
      const newSavings = totalGreenDays * dailyRouteCost * 2; 

      const currentGoingOutPrediction = userDoc.data().goingOutPrediction || false; 
      setGoingOutPrediction(currentGoingOutPrediction); 

      await updateDoc(doc(db, 'users', userDoc.id), {
        totalDistance: newTotalDistance,
        savings: newSavings 
      });
    }
  }, []); 

  useEffect(() => {
    initializeStreaks(); 
  }, [initializeStreaks]); 

  const toggleGoingOutPrediction = async () => {
    const user = auth.currentUser; 
    if (user) {
      const userId = user.uid; 
      const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0]; 
        const currentPrediction = userDoc.data().goingOutPrediction || false; 

        const newPrediction = !currentPrediction;

        await updateDoc(doc(db, 'users', userDoc.id), {
          goingOutPrediction: newPrediction 
        });

        setGoingOutPrediction(newPrediction);
      }
    }
  };

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
            const currentPrediction = updatedStreaks[day]; 

            updatedStreaks[day] = !currentPrediction; 

            if (updatedStreaks[day]) {
                if (!existingStreaks.includes(date)) {
                    existingStreaks.push(date);
                }
            } else {
                const index = existingStreaks.indexOf(date);
                if (index > -1) {
                    existingStreaks.splice(index, 1);
                }
            }

            await updateDoc(doc(db, 'users', userDoc.id), {
                streaks: existingStreaks,
            });

            // const totalGreenDays = Object.values(updatedStreaks).filter(value => value === true).length; 

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
            backgroundColor: isToday ? (goingOutPrediction ? '#4caf50' : '#f44336') : (streaks[day] === true ? '#4caf50' : 'gray'), 
            color: '#fff', 
            cursor: isFutureDate ? 'not-allowed' : 'pointer', 
            opacity: isFutureDate ? 0.5 : 1 
          };

          return (
            <div
              key={day}
              className="streak-day"
              style={dayStyle} 
              onClick={() => {
                if (isToday) {
                  toggleGoingOutPrediction(); 
                  toggleStreak(day);
                } else if (!isFutureDate) {
                  toggleStreak(day); 
                }
              }} 
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