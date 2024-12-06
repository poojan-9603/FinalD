// import React, { useEffect, useState } from 'react';
// import { db, auth } from '../firebase'; 
// import { query, collection, where, getDocs, updateDoc, doc } from 'firebase/firestore'; 
// import { useNavigate, useLocation } from 'react-router-dom'; 
// import './Dashboard.css'; 
// import axios from 'axios'; 
// import { fetchTotalDistance, calculateCaloriesBurned, calculateCO2EmissionsSaved } from './otherCalculations'; 

// const Dashboard = () => {
//   const [userData, setUserData] = useState(null); 
//   const [isVisible, setIsVisible] = useState(false); 
//   const [loading, setLoading] = useState(true); 
//   const [repaymentDays, setRepaymentDays] = useState(0); 
//   const [weatherPrediction, setWeatherPrediction] = useState(''); 
//   const [predictionStatus, setPredictionStatus] = useState(''); 
//   const [userCategory, setUserCategory] = useState(''); 
//   const [totalDistance, setTotalDistance] = useState(0); 
//   const [caloriesBurned, setCaloriesBurned] = useState(0); 
//   const [co2EmissionsSaved, setCo2EmissionsSaved] = useState(0); 
//   const navigate = useNavigate(); 
//   const location = useLocation(); 
//   const referenceId = location.state?.referenceId; 

//   const currentDate = new Date().toLocaleDateString(); 

//   const fetchUserData = async (userId) => {
//     try {
//         const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
//         const userSnapshot = await getDocs(userQuery);
//         if (!userSnapshot.empty) {
//             const userDoc = userSnapshot.docs[0];
//             setUserData(userDoc.data());
//             const category = userDoc.data().weatherPreference; 
//             setUserCategory(category); 
//             await updateDoc(userDoc.ref, {
//                 userCategory: category || 'Cautious' // Default to 'Cautious' if not set
//             });
//         } else {
//             alert('User document does not exist. Please complete your profile.');
//             navigate('/first-time-login');
//         }
//     } catch (error) {
//         alert('There was an error fetching user data. Please try again.');
//     } finally {
//         setLoading(false);
//     }
// };

//   useEffect(() => {
//     const user = auth.currentUser; 
//     if (user) {
//       fetchUserData(user.uid); 
//     } else {
//       navigate('/login'); 
//     }
//   }, [navigate]);

//   useEffect(() => {
//     const calculateMetrics = async () => {
//       const user = auth.currentUser;
//       if (user) {
//         const distance = await fetchTotalDistance(user.uid); 
//         setTotalDistance(distance); 
//         const calories = calculateCaloriesBurned(distance); 
//         const co2 = calculateCO2EmissionsSaved(distance); 
//         setCaloriesBurned(Math.round(calories)); 
//         setCo2EmissionsSaved(Math.round(co2)); 
//       }
//     };

//     calculateMetrics();
//   }, []);

//   const updateDailyRouteData = async () => {
//     const user = auth.currentUser;
//     if (user && userData) {
//       const today = new Date().toLocaleDateString();
//       if (today !== userData.lastUpdatedDate) { 
//         const dailyRoute = userData.routes && userData.routes.length > 0 ? userData.routes[0] : null; 
//         if (dailyRoute) {
//           const newDistance = dailyRoute.distance || 0; 
//           const newCost = dailyRoute.cost || 0; 

//           const updatedTotalDistance = totalDistance + newDistance; 
//           const updatedSavings = (userData.savings || 0) + newCost; 

//           await updateDoc(doc(db, 'users', user.uid), {
//             totalDistance: updatedTotalDistance,
//             savings: updatedSavings,
//             lastUpdatedDate: today // Update last updated date
//           });

//           setTotalDistance(updatedTotalDistance);
//         }
//       }
//     }
//   };

//   useEffect(() => {
//     updateDailyRouteData();
//   }, [userData]);

//   const totalExpenses = userData ? 
//     (userData.bikeCost?.bikeInitialCost || 0) + 
//     (userData.bikeCost?.bikeExpensePerMonth || 0) + 
//     (userData.bikeCost?.bikeAdditionalExpense || 0) : 0;

//   const savings = userData ? Math.floor(userData.savings || 0) : 0; 
//   const balance = savings - totalExpenses; 

//   const calculateRepaymentDays = (dailyRouteCost) => {
//     if (totalExpenses > 0 && dailyRouteCost > 0) {
//       return Math.ceil((totalExpenses - savings) / (2 * dailyRouteCost)); 
//     }
//     return 0; 
//   };

//   useEffect(() => {
//     if (userData) {
//       const dailyRouteCost = userData.routes && userData.routes.length > 0 ? userData.routes[0].cost : 0; 
//       const days = calculateRepaymentDays(dailyRouteCost); 
//       setRepaymentDays(days); 
//     }
//   }, [userData, totalExpenses, savings]);  

//   const checkWeather = async (source) => {
//     try {
//         const apiUrl = `http://api.weatherapi.com/v1/current.json?key=4b82c9f291e9483490162102240412&q=${source}&aqi=no`;
//         console.log('Fetching weather data from:', apiUrl); // Log the API URL
//         const response = await axios.get(apiUrl);
        
//         // Log the entire response to understand its structure
//         console.log('Weather API response:', response.data);

//         const weather = response.data.current; 

//         // Ensure that we are not directly modifying any read-only properties
//         const weatherCondition = weather.condition.text || 'No condition available'; // Fallback if condition is not available
//         setWeatherPrediction(weatherCondition); 

//         let isFavorable = false;

//         // Ensure userCategory is defined
//         const currentUserCategory = userCategory || 'Cautious'; 

//         if (currentUserCategory.trim() === 'Weather-Resilient') {
//             isFavorable = true; 
//         } else if (currentUserCategory.trim() === 'Cautious') {
//             isFavorable = !weatherCondition.toLowerCase().includes('rain') && 
//                           !weatherCondition.toLowerCase().includes('storm');
//         } else if (currentUserCategory.trim() === 'Weather-Averse') {
//             isFavorable = !weatherCondition.toLowerCase().includes('rain') && 
//                           !weatherCondition.toLowerCase().includes('storm') && 
//                           !weatherCondition.toLowerCase().includes('overcast');
//         }

//         setPredictionStatus(isFavorable ? 'favorable' : 'unfavorable'); 

//         const user = auth.currentUser;
//         if (user) {
//             const userQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
//             const userSnapshot = await getDocs(userQuery); 

//             if (!userSnapshot.empty) {
//                 const userDocRef = doc(db, 'users', userSnapshot.docs[0].id); 
//                 await updateDoc(userDocRef, {
//                     goingOutPrediction: isFavorable 
//                 });
//             }
//         }

//     } catch (error) {
//         console.error('Error fetching weather data:', error); // Log the error
//         setWeatherPrediction('Unable to fetch weather data.');
//         setPredictionStatus('unknown'); 
//     }
// };

// useEffect(() => {
//     if (userData) {
//         const source = userData.routeSource || 'London'; 
//         checkWeather(source); 
//     }
// }, [userData]);

//   useEffect(() => {
//     if (userData) {
//       const source = userData.routeSource || 'London'; 
//       checkWeather(source); 
//     }
//   }, [userData]);

//   const calculateCurrentStreak = () => {
//     if (!userData || !userData.streaks || userData.streaks.length === 0) {
//       return 0;
//     }

//     const streaks = userData.streaks.map(date => new Date(date)); 
//     streaks.sort((a, b) => b - a); 

//     let streak = 0;
//     const today = new Date();
//     const yesterday = new Date(today);
//     yesterday.setDate(today.getDate() - 1);

//     for (let date of streaks) {
//       if (date.toDateString() === today.toDateString()) {
//         streak++; 
//       } else if (date.toDateString() === yesterday.toDateString()) {
//         streak++; 
//         yesterday.setDate(yesterday.getDate() - 1); 
//       } else if (streak > 0) {
//         break;
//       }
//     }

//     return streak;
//   };

//   const currentStreak = calculateCurrentStreak(); 

//   const handleLogout = async () => {
//     try {
//       const user = auth.currentUser; 
//       if (user) {
//         const userQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
//         const userSnapshot = await getDocs(userQuery); 

//         if (!userSnapshot.empty) {
//           const userDocRef = doc(db, 'users', userSnapshot.docs[0].id); 

//           await updateDoc(userDocRef, {
//             loggedIn: false,
//           });
//         } else {
//           alert('User document not found. Please try again.');
//           navigate('/login'); 
//           return; 
//         }

//         await auth.signOut(); 
//         navigate('/login'); 
//       } else {
//         alert('No user is currently logged in. Please log in first.');
//         navigate('/login'); 
//       }
//     } catch (error) {
//       alert('Error logging out. Please try again.');
//       navigate('/login'); 
//     }
//   };

//   useEffect(() => {
//     const handleBeforeUnload = (event) => {
//       const confirmationMessage = 'Refreshing the page will log you out. Do you want to continue?';
//       event.returnValue = confirmationMessage; 
//       return confirmationMessage; 
//     };

//     window.addEventListener('beforeunload', handleBeforeUnload);

//     return () => {
//       window.removeEventListener('beforeunload', handleBeforeUnload);
//     };
//   }, []);
// console.log(setIsVisible)
//   return (
//     <div className="dashboard-container">
//       <h1 className="dashboard-title">🚴 Your Bike Cost Dashboard</h1>
//       <div className="header">
//         <span className="current-date">{currentDate}</span> 
//         <div className="metrics">
//           <div className="metric-item">
//             <h3>Balance: ${balance}</h3>
//           </div>
//           <div className="metric-item">
//             <h3>Calories Burned: {caloriesBurned}</h3>
//           </div>
//           <div className="metric-item">
//             <h3>CO2 Emissions Saved: {co2EmissionsSaved} kg</h3>
//           </div>
//         </div>
//         <button className="streaks-button" onClick={() => navigate('/streaks', { state: { referenceId, predictionStatus } })}>
//           Streaks
//         </button> 
//       </div>
//       <div className="animation-container">
//         <div className="animated-scene">
//           <div className="running-man"></div>
//           <div className="bus"></div>
//           <div className="cycle"></div>
//         </div>
//       </div>
//       <div className="navbar">
//         <div className="nav-item">
//           <h2 className="nav-title">Total Expenses</h2>
//           <p className={`value ${isVisible ? 'fade-in' : ''}`}>${totalExpenses}</p>
//         </div>
//         <div className="nav-item">
//           <h2 className="nav-title">Savings</h2>
//           <p className={`value ${isVisible ? 'fade-in' : ''}`}>${savings}</p>
//         </div>
//       </div>
//       <h2 className={`balance-title ${isVisible ? 'fade-in' : ''}`}>Balance: ${balance}</h2>

//       <div className={`repayment-container ${isVisible ? 'fade-in' : ''}`}>
//         <h2 className="repayment-title">Days to Repay: {repaymentDays} Day{repaymentDays !== 1 ? 's' : ''}</h2>
//       </div>

//       <div className="user-category">
//         <h2>Your Category: {userCategory}</h2>
//         <p>
//           Prediction: If the weather is rainy, extremely windy, or below 10°C, it might not be a good day for riding based on your category.
//         </p>
//       </div>

//       <div className={`weather-prediction ${isVisible ? 'fade-in' : ''}`}>
//         <h2 className="weather-title">{weatherPrediction}</h2>
//         <h3>My prediction for you for {currentDate}: {predictionStatus === 'favorable' ? 'It looks like a great day to ride!' : 'You might want to reconsider your plans.'}</h3>
//       </div>

//       <div className={`streak-container ${isVisible ? 'fade-in' : ''}`}>
//         <div className="fire"></div> 
//         {loading ? (
//           <h2 className="streak-title">Loading...</h2> 
//         ) : (
//           <h2 className="streak-title">
//             Current Streak: {currentStreak > 0 ? currentStreak : 'No Streaks'} Day{currentStreak !== 1 ? 's' : ''}
//           </h2>
//         )}
//       </div>

//       <div className="card">
//         <h2 className="card-title">Balance</h2>
//         <p className={`value ${isVisible ? 'fade-in' : ''}`}>${balance}</p>
//         <button className="button" onClick={() => navigate('/go-out')}>Go Out</button>
//         <button className="login-button" onClick={() => navigate('/login')}>Back to Login</button>
//       </div>

//       <div className="logout-container">
//         <button className="logout-button" onClick={handleLogout}>Logout</button> 
//       </div>
//     </div>
//   );
// };

// export default Dashboard;


import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase'; 
import { query, collection, where, getDocs, updateDoc, doc } from 'firebase/firestore'; 
import { useNavigate, useLocation } from 'react-router-dom'; 
import './Dashboard.css'; 
import axios from 'axios'; 
import { useCallback } from 'react';
import { fetchTotalDistance, calculateCaloriesBurned, calculateCO2EmissionsSaved } from './otherCalculations'; 

const Dashboard = () => {
  const [userData, setUserData] = useState(null); 
  const [isVisible, setIsVisible] = useState(false); 
  const [loading, setLoading] = useState(true); 
  const [repaymentDays, setRepaymentDays] = useState(0); 
  const [weatherPrediction, setWeatherPrediction] = useState(''); 
  const [predictionStatus, setPredictionStatus] = useState(''); 
  const [userCategory, setUserCategory] = useState(''); 
  const [totalDistance, setTotalDistance] = useState(0); 
  const [caloriesBurned, setCaloriesBurned] = useState(0); 
  const [co2EmissionsSaved, setCo2EmissionsSaved] = useState(0); 
  const navigate = useNavigate(); 
  const location = useLocation(); 
  const referenceId = location.state?.referenceId; 

  const currentDate = new Date().toLocaleDateString(); 

  const fetchUserData = async (userId) => {
    try {
        const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            setUserData(userDoc.data());
            const category = userDoc.data().weatherPreference; 
            setUserCategory(category); 
            await updateDoc(userDoc.ref, {
                userCategory: category || 'Cautious' // Default to 'Cautious' if not set
            });
        } else {
            alert('User document does not exist. Please complete your profile.');
            navigate('/first-time-login');
        }
    } catch (error) {
        alert('There was an error fetching user data. Please try again.');
    } finally {
        setLoading(false);
    }
};

  useEffect(() => {
    const user = auth.currentUser; 
    if (user) {
      fetchUserData(user.uid); 
    } else {
      navigate('/login'); 
    }
  }, );

  useEffect(() => {
    const calculateMetrics = async () => {
      const user = auth.currentUser;
      if (user) {
        const distance = await fetchTotalDistance(user.uid); 
        setTotalDistance(distance); 
        const calories = calculateCaloriesBurned(distance); 
        const co2 = calculateCO2EmissionsSaved(distance); 
        setCaloriesBurned(Math.round(calories)); 
        setCo2EmissionsSaved(Math.round(co2)); 
      }
    };

    calculateMetrics();
  }, []);
  const updateDailyRouteData = useCallback(async () => {
    const user = auth.currentUser;
    if (user && userData) {
        const today = new Date().toLocaleDateString();
        if (today !== userData.lastUpdatedDate) { 
            const dailyRoute = userData.routes && userData.routes.length > 0 ? userData.routes[0] : null; 
            if (dailyRoute) {
                const newDistance = dailyRoute.distance || 0; 
                const newCost = dailyRoute.cost || 0; 

                const updatedTotalDistance = totalDistance + newDistance; 
                const updatedSavings = (userData.savings || 0) + newCost; 

                await updateDoc(doc(db, 'users', user.uid), {
                    totalDistance: updatedTotalDistance,
                    savings: updatedSavings,
                    lastUpdatedDate: today // Update last updated date
                });

                setTotalDistance(updatedTotalDistance);
            }
        }
    }
}, [userData, totalDistance]);
  useEffect(() => {
    updateDailyRouteData();
  }, [userData,updateDailyRouteData]);

  const totalExpenses = userData ? 
    (userData.bikeCost?.bikeInitialCost || 0) + 
    (userData.bikeCost?.bikeExpensePerMonth || 0) + 
    (userData.bikeCost?.bikeAdditionalExpense || 0) : 0;

  const savings = userData ? Math.floor(userData.savings || 0) : 0; 
  const balance = savings - totalExpenses; 

  const calculateRepaymentDays = useCallback((dailyRouteCost) => {
    if (totalExpenses > 0 && dailyRouteCost > 0) {
      return Math.ceil((totalExpenses - savings) / (2 * dailyRouteCost)); 
    }
    return 0; 
  },[totalExpenses, savings]);

  useEffect(() => {
    if (userData) {
      const dailyRouteCost = userData.routes && userData.routes.length > 0 ? userData.routes[0].cost : 0; 
      const days = calculateRepaymentDays(dailyRouteCost); 
      setRepaymentDays(days); 
    }
  }, [userData, totalExpenses, savings,calculateRepaymentDays]);  

  const checkWeather = useCallback(async (source) => {
    try {
        const apiUrl = `http://api.weatherapi.com/v1/current.json?key=4b82c9f291e9483490162102240412&q=${source}&aqi=no`;
        console.log('Fetching weather data from:', apiUrl); // Log the API URL
        const response = await axios.get(apiUrl);
        
        // Log the entire response to understand its structure
        console.log('Weather API response:', response.data);

        const weather = response.data.current; 

        // Ensure that we are not directly modifying any read-only properties
        const weatherCondition = weather.condition.text || 'No condition available'; // Fallback if condition is not available
        setWeatherPrediction(weatherCondition); 

        let isFavorable = false;

        // Ensure userCategory is defined
        const currentUserCategory = userCategory || 'Cautious'; 

        if (currentUserCategory.trim() === 'Weather-Resilient') {
            isFavorable = true; 
        } else if (currentUserCategory.trim() === 'Cautious') {
            isFavorable = !weatherCondition.toLowerCase().includes('rain') && 
                          !weatherCondition.toLowerCase().includes('storm');
        } else if (currentUserCategory.trim() === 'Weather-Averse') {
            isFavorable = !weatherCondition.toLowerCase().includes('rain') && 
                          !weatherCondition.toLowerCase().includes('storm') && 
                          !weatherCondition.toLowerCase().includes('overcast');
        }

        setPredictionStatus(isFavorable ? 'favorable' : 'unfavorable'); 

        const user = auth.currentUser;
        if (user) {
            const userQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
            const userSnapshot = await getDocs(userQuery); 

            if (!userSnapshot.empty) {
                const userDocRef = doc(db, 'users', userSnapshot.docs[0].id); 
                await updateDoc(userDocRef, {
                    goingOutPrediction: isFavorable 
                });
            }
        }

    } catch (error) {
        console.error('Error fetching weather data:', error); // Log the error
        setWeatherPrediction('Unable to fetch weather data.');
        setPredictionStatus('unknown'); 
    }
}, [userCategory]); // Add userCategory as a dependency
useEffect(() => {
    if (userData) {
        const source = userData.routeSource || 'London'; 
        checkWeather(source); 
    }
}, [userData,checkWeather]);

  useEffect(() => {
    if (userData) {
      const source = userData.routeSource || 'London'; 
      checkWeather(source); 
    }
  }, [userData,checkWeather]);

  const calculateCurrentStreak = () => {
    if (!userData || !userData.streaks || userData.streaks.length === 0) {
      return 0;
    }

    const streaks = userData.streaks.map(date => new Date(date)); 
    streaks.sort((a, b) => b - a); 

    let streak = 0;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    for (let date of streaks) {
      if (date.toDateString() === today.toDateString()) {
        streak++; 
      } else if (date.toDateString() === yesterday.toDateString()) {
        streak++; 
        yesterday.setDate(yesterday.getDate() - 1); 
      } else if (streak > 0) {
        break;
      }
    }

    return streak;
  };

  const currentStreak = calculateCurrentStreak(); 

  const handleLogout = async () => {
    try {
      const user = auth.currentUser; 
      if (user) {
        const userQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
        const userSnapshot = await getDocs(userQuery); 

        if (!userSnapshot.empty) {
          const userDocRef = doc(db, 'users', userSnapshot.docs[0].id); 

          await updateDoc(userDocRef, {
            loggedIn: false,
          });
        } else {
          alert('User document not found. Please try again.');
          navigate('/login'); 
          return; 
        }

        await auth.signOut(); 
        navigate('/login'); 
      } else {
        alert('No user is currently logged in. Please log in first.');
        navigate('/login'); 
      }
    } catch (error) {
      alert('Error logging out. Please try again.');
      navigate('/login'); 
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      const confirmationMessage = 'Refreshing the page will log you out. Do you want to continue?';
      event.returnValue = confirmationMessage; 
      return confirmationMessage; 
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
console.log(setIsVisible)
  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">🚴 Your Bike Cost Dashboard</h1>
      <div className="header">
        <span className="current-date">{currentDate}</span> 
        <div className="metrics">
          <div className="metric-item">
            <h3>Balance: ${balance}</h3>
          </div>
          <div className="metric-item">
            <h3>Calories Burned: {caloriesBurned}</h3>
          </div>
          <div className="metric-item">
            <h3>CO2 Emissions Saved: {co2EmissionsSaved} kg</h3>
          </div>
        </div>
        <button className="streaks-button" onClick={() => navigate('/streaks', { state: { referenceId, predictionStatus } })}>
          Streaks
        </button> 
      </div>
      <div className="animation-container">
        <div className="animated-scene">
          <div className="running-man"></div>
          <div className="bus"></div>
          <div className="cycle"></div>
        </div>
      </div>
      <div className="navbar">
        <div className="nav-item">
          <h2 className="nav-title">Total Expenses</h2>
          <p className={`value ${isVisible ? 'fade-in' : ''}`}>${totalExpenses}</p>
        </div>
        <div className="nav-item">
          <h2 className="nav-title">Savings</h2>
          <p className={`value ${isVisible ? 'fade-in' : ''}`}>${savings}</p>
        </div>
      </div>
      <h2 className={`balance-title ${isVisible ? 'fade-in' : ''}`}>Balance: ${balance}</h2>

      <div className={`repayment-container ${isVisible ? 'fade-in' : ''}`}>
        <h2 className="repayment-title">Days to Repay: {repaymentDays} Day{repaymentDays !== 1 ? 's' : ''}</h2>
      </div>

      <div className="user-category">
        <h2>Your Category: {userCategory}</h2>
        <p>
          Prediction: If the weather is rainy, extremely windy, or below 10°C, it might not be a good day for riding based on your category.
        </p>
      </div>

      <div className={`weather-prediction ${isVisible ? 'fade-in' : ''}`}>
        <h2 className="weather-title">{weatherPrediction}</h2>
        <h3>My prediction for you for {currentDate}: {predictionStatus === 'favorable' ? 'It looks like a great day to ride!' : 'You might want to reconsider your plans.'}</h3>
      </div>

      <div className={`streak-container ${isVisible ? 'fade-in' : ''}`}>
        <div className="fire"></div> 
        {loading ? (
          <h2 className="streak-title">Loading...</h2> 
        ) : (
          <h2 className="streak-title">
            Current Streak: {currentStreak > 0 ? currentStreak : 'No Streaks'} Day{currentStreak !== 1 ? 's' : ''}
          </h2>
        )}
      </div>

      <div className="card">
        <h2 className="card-title">Balance</h2>
        <p className={`value ${isVisible ? 'fade-in' : ''}`}>${balance}</p>
        <button className="button" onClick={() => navigate('/go-out')}>Go Out</button>
        <button className="login-button" onClick={() => navigate('/login')}>Back to Login</button>
      </div>

      <div className="logout-container">
        <button className="logout-button" onClick={handleLogout}>Logout</button> 
      </div>
    </div>
  );
};

export default Dashboard;