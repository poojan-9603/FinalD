import { db } from '../firebase'; 
import { query, collection, where, getDocs } from 'firebase/firestore'; 

export const fetchTotalDistance = async (userId) => {
  const userQuery = query(collection(db, 'users'), where('uid', '==', userId)); 
  const userSnapshot = await getDocs(userQuery);

  if (!userSnapshot.empty) {
    const userDoc = userSnapshot.docs[0].data();
    return userDoc.totalDistance || 0; 
  }
  return 0; 
};


export const calculateCaloriesBurned = (distance) => {
  const caloriesPerKm = 23; 
  return Math.round(distance * caloriesPerKm);
};

export const calculateCO2EmissionsSaved = (distance) => {
  const co2PerKm = 0.21; 
  return Math.round(distance * co2PerKm); 
};