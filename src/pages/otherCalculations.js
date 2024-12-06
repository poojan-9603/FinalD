import { db } from '../firebase'; // Import Firestore database
import { query, collection, where, getDocs } from 'firebase/firestore'; // Import Firestore functions

// Function to fetch total distance from the database
export const fetchTotalDistance = async (userId) => {
  const userQuery = query(collection(db, 'users'), where('uid', '==', userId)); // Query to find the user document based on uid
  const userSnapshot = await getDocs(userQuery);

  if (!userSnapshot.empty) {
    const userDoc = userSnapshot.docs[0].data();
    return userDoc.totalDistance || 0; // Return total distance or 0 if not found
  }
  return 0; // Return 0 if user document does not exist
};

// Function to calculate calories burned based on distance
export const calculateCaloriesBurned = (distance) => {
  const caloriesPerKm = 50; // Example value: 50 calories burned per km
  return Math.round(distance * caloriesPerKm); // Calculate and round total calories burned
};

// Function to calculate CO2 emissions saved based on distance
export const calculateCO2EmissionsSaved = (distance) => {
  const co2PerKm = 0.21; // Example value: 0.21 kg of CO2 saved per km
  return Math.round(distance * co2PerKm); // Calculate and round total CO2 emissions saved
};