import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { setDoc, doc, getDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import './GoOut.css';

const GoOut = () => {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [cost, setCost] = useState(null);
  const [distance, setDistance] = useState(null);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [coords1, setCoords1] = useState(null);
  const [coords2, setCoords2] = useState(null);
  const [dailyRoute, setDailyRoute] = useState(null); // State to hold daily route data

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          alert('User not authenticated.');
          return;
        }

        const userId = user.uid;
        console.log('Current User ID:', userId); // Log the current user ID

        // Query to find the user document based on uid
        const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0]; // Get the first document
          console.log('User Document Data:', userDoc.data()); // Log the user document data
          setUserData(userDoc.data());

          // Check if daily route exists and set it
          if (userDoc.data().routes && userDoc.data().routes.length > 0) {
            setDailyRoute(userDoc.data().routes[0]); // Assuming we want to show the first route
          }
        } else {
          alert('User document does not exist. Please complete your profile.');
          navigate('/first-time-login'); // Redirect to first-time login if document does not exist
        }
      } catch (error) {
        console.error('Error fetching user data: ', error);
        alert('There was an error fetching user data. Please try again.');
      }
    };

    fetchUserData();
  }, [navigate]);

  const calculateDistance = async () => {
    if (!source || !destination) {
      setError('Please enter both source and destination.');
      return;
    }

    setError('');

    const sourceResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(source)}&format=json`);
    const sourceData = await sourceResponse.json();

    const destinationResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json`);
    const destinationData = await destinationResponse.json();

    if (sourceData.length === 0 || destinationData.length === 0) {
      setError('Could not find one or both locations.');
      return;
    }

    const newCoords1 = { lat: parseFloat(sourceData[0].lat), lon: parseFloat(sourceData[0].lon) };
    const newCoords2 = { lat: parseFloat(destinationData[0].lat), lon: parseFloat(destinationData[0].lon) };

    setCoords1(newCoords1);
    setCoords2(newCoords2);

    const distanceValue = calculate(newCoords1, newCoords2);
    const costValue = calculateCost(distanceValue);

    setCost(costValue);
    setDistance(distanceValue);

    alert(`Distance: ${distanceValue.toFixed(2)} km\nCost: $${costValue.toFixed(2)}`);
  };

  const calculate = (coords1, coords2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lon - coords1.lon);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(coords1.lat)) * Math.cos(toRad(coords2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const calculateCost = (distance) => {
    const costPerKm = 1.5;
    return distance * costPerKm;
  };

  const saveDailyRoute = async () => {
    if (!source || !destination || distance === null || cost === null || !coords1 || !coords2) {
      alert('Please calculate the distance before saving the daily route.');
      return;
    }

    const user = auth.currentUser; 
    if (!user) {
      alert('User not authenticated.');
      return;
    }

    // Query to find the user document based on uid
    const userQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      alert('User document does not exist. Please complete your profile.');
      return;
    }

    const userDoc = userSnapshot.docs[0]; // Get the first document

    const dailyRouteData = {
      id: uuidv4(),
      source,
      destination,
      distance,
      cost,
      location: coords1, 
    };

    // Save the daily route in the existing user document
    await setDoc(doc(db, 'users', userDoc.id), { routes: [...(userDoc.data().routes || []), dailyRouteData] }, { merge: true });

    // Update the totalDistance and savings in the user document
    await updateDoc(doc(db, 'users', userDoc.id), {
      totalDistance: (userDoc.data().totalDistance || 0) + distance, // Increment totalDistance
      savings: (userDoc.data().savings || 0) + cost // Increment savings by the cost of the route
    });

    alert('Daily route saved!');
    navigate('/dashboard', { state: { referenceId: dailyRouteData.id } }); // Ensure this is correct
  };

  const goOnce = async () => {
    if (!source || !destination || distance === null || cost === null) {
      alert('Please calculate the distance before using Go Once.');
      return;
    }

    const user = auth.currentUser; 
    if (!user) {
      alert('User not authenticated.');
      return;
    }

    // Query to find the user document based on uid
    const userQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      alert('User document does not exist. Please complete your profile.');
      return;
    }

    const userDoc = userSnapshot.docs[0]; // Get the first document

    // Update the totalDistance and savings in the user document
    await updateDoc(doc(db, 'users', userDoc.id), {
      totalDistance: (userDoc.data().totalDistance || 0) + distance, // Increment totalDistance
      savings: (userDoc.data().savings || 0) + cost // Increment savings by the cost
    });

    const routeInfo = {
      source,
      destination,
      distance,
      cost,
    };

    console.log('Go Once Route Info:', routeInfo); // Log the route info to the console
    alert('Go Once action executed! Check console for details.');

    // Redirect to the dashboard after "Go Once" action
    navigate('/dashboard');
  };

  const fetchSuggestions = async (query, type) => {
    if (!query) {
      if (type === 'source') setSourceSuggestions([]);
      if (type === 'destination') setDestinationSuggestions([]);
      return;
    }

    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json`);
    const data = await response.json();

    if (type === 'source') {
      setSourceSuggestions(data);
    } else {
      setDestinationSuggestions(data);
    }
  };

  const handleSourceChange = (e) => {
    setSource(e.target.value);
    fetchSuggestions(e.target.value, 'source');
  };

  const handleDestinationChange = (e) => {
    setDestination(e.target.value);
    fetchSuggestions(e.target.value, 'destination');
  };

  const handleSuggestionClick = (place, type) => {
    if (type === 'source') {
      setSource(place.display_name);
      setSourceSuggestions([]);
    } else {
      setDestination(place.display_name);
      setDestinationSuggestions([]);
    }
  };

  return (
    <div className="go-out-container">
      <h1 className="title">Go Out</h1>
      <div className="input-container">
        <input
          type="text"
          placeholder="Source"
          value={source}
          onChange={handleSourceChange}
          className="input"
        />
        {sourceSuggestions.length > 0 && (
          <ul className="suggestions">
            {sourceSuggestions.map((place) => (
              <li key={place.place_id} onClick={() => handleSuggestionClick(place, 'source')} className="suggestionItem">
                {place.display_name}
              </li>
            ))}
          </ul>
        )}
        <input
          type="text"
          placeholder="Destination"
          value={destination}
          onChange={handleDestinationChange}
          className="input"
        />
        {destinationSuggestions.length > 0 && (
          <ul className="suggestions">
            {destinationSuggestions.map((place) => (
              <li key={place.place_id} onClick={() => handleSuggestionClick(place, 'destination')} className="suggestionItem">
                {place.display_name}
              </li>
            ))}
          </ul>
        )}
        <button onClick={calculateDistance} className="doMathButton">Calculate</button>
        <button onClick={saveDailyRoute} className="doMathButton">Save Daily Route</button>
        <button onClick={goOnce} className="doMathButton">Go Once</button> {/* New Go Once button */}
      </div>
      <h2 className="title">Daily Route</h2>
      <div className="favLocation">
        <div className="placeholder">
          <strong>Daily Route Source:</strong> {dailyRoute ? dailyRoute.source : 'N/A'}
        </div>
        <div className="placeholder">
          <strong>Daily Route Destination:</strong> {dailyRoute ? dailyRoute.destination : 'N/A'}
        </div>
        <div className="placeholder">
          <strong>Daily Route Distance:</strong> {dailyRoute ? dailyRoute.distance.toFixed(2) : 'N/A'} km
        </div>
        <div className="placeholder">
          <strong>Daily Route Cost:</strong> {dailyRoute ? `$${dailyRoute.cost.toFixed(2)}` : 'N/A'}
        </div>
      </div>
    </div>
  );
};

export default GoOut;