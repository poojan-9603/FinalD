import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc, getDocs, getDoc, query, collection, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './BikeCost.css';

const BikeCost = () => {
  const [bikePrice, setBikePrice] = useState(1);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [anonymousExpense, setAnonymousExpense] = useState('');
  const [userId, setUserId] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserId(user.uid);
      
      fetchUserDocument(user.uid);
    } else {
      alert('User not authenticated. Please log in.');
      navigate('/login');
    }
  }, [navigate]);
  console.log(userId)
  const fetchUserDocument = async (userId) => {
    try {
      const userQuery = query(collection(db, "users"), where("uid", "==", userId));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        setDocumentId(userDoc.id);
      } else {
        console.log('User document does not exist');
      }
    } catch (error) {
      alert('There was an error fetching user data. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!documentId) {
        alert('Document ID is not set. Cannot update document.');
        return;
    }

    const bikeCostData = {
        bikeInitialCost: parseFloat(bikePrice),
        bikeExpensePerMonth: parseFloat(monthlyExpenses),
        bikeAdditionalExpense: parseFloat(anonymousExpense || 0),
    };

    const totalExpenses = bikeCostData.bikeInitialCost + bikeCostData.bikeExpensePerMonth + bikeCostData.bikeAdditionalExpense;

    const userDocRef = doc(db, 'users', documentId);

    try {
        // Use getDoc to check if the document exists
        const docSnapshot = await getDoc(userDocRef);
        if (!docSnapshot.exists()) {
            alert('No document found to update. Please check your user data.');
            return;
        }

        await updateDoc(userDocRef, {
            bikeCost: bikeCostData,
            expenses: totalExpenses,
        });
        alert('Bike cost data saved successfully!');
        navigate('/go-out'); // Redirect to GoOut after saving
    } catch (error) {
        console.error('Error updating document:', error); // Log the error for debugging
        alert('There was an error saving your bike cost data. Please try again.');
    }
};

  const getPriceEmoji = () => {
    if (bikePrice < 3000) {
      return '🚲';
    } else if (bikePrice < 5000) {
      return '🚴‍♂️';
    } else {
      return '🚵‍♀️';
    }
  };

  return (
    <div className="bike-cost-container">
      <h1 className="bike-cost-title">🚴 Bike Cost Estimator</h1>
      <p className="bike-cost-description">Let's calculate the total cost of owning your bike!</p>
      <form className="bike-cost-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="bikePrice" className="form-label">
            💲 Price of the Bike (in USD): {getPriceEmoji()}
          </label>
          <div className="slider-container">
            <input
              type="range"
              id="bikePrice"
              min="1"
              max="5000" // Updated max range to 5000
              value={bikePrice}
              onChange={(e) => setBikePrice(e.target.value)}
              className="slider"
            />
            <div className="price-display">${bikePrice}</div>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="monthlyExpenses" className="form-label">🛠️ Monthly Maintenance Expenses (in USD):</label>
          <div className="slider-container">
            <input
              type="range"
              id="monthlyExpenses"
              min="0"
              max="1000"
              value={monthlyExpenses}
              onChange={(e) => setMonthlyExpenses(e.target.value)}
              className="slider"
            />
            <div className="price-display">${monthlyExpenses}</div>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="anonymousExpense" className="form-label">🤫 Optional Anonymous Expense (in USD):</label>
          <div className="inputContainer">
            <span className="inputIcon">$</span>
            <input
              type="number"
              id="anonymousExpense"
              value={anonymousExpense}
              onChange={(e) => setAnonymousExpense(e.target.value)}
              className="fancy-input"
              placeholder="Optional"
            />
          </div>
        </div>
        <button type="submit" className="submit-button">💾 Save My Costs</button>
      </form>
    </div>
  );
};

export default BikeCost;