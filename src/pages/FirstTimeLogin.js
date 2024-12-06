import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './FirstTimeLogin.css';

const FirstTimeLogin = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [bikingExperience, setBikingExperience] = useState('');
  const [bikingFrequency, setBikingFrequency] = useState('');
  const [hardcoreLevel, setHardcoreLevel] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userInfo = {
      nickname,
      bikingExperience,
      bikingFrequency,
      hardcoreLevel,
    };

    // Classify user based on hardcore level
    let weatherPreference;
    if (hardcoreLevel === 'hardcore') {
      weatherPreference = 'resilient';
    } else if (hardcoreLevel === 'occasional') {
      weatherPreference = 'cautious';
    } else {
      weatherPreference = 'averse';
    }

    try {
      const user = auth.currentUser;
      const userId = user.uid;

      const userQuery = query(collection(db, "users"), where("uid", "==", userId));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        await setDoc(doc(db, "users", userId), {
          uid: userId,
          userInfo,
          firstTimeLogin: true,
          loggedIn: false,
          weatherPreference, // Store the user's classification
        });
      } else {
        await updateDoc(doc(db, "users", userSnapshot.docs[0].id), {
          userInfo,
          firstTimeLogin: false,
          loggedIn: false,
          weatherPreference, // Update the user's classification
        });
      }

      alert('Thank you for completing the survey!');
      navigate('/bike-cost');
    } catch (error) {
      console.error('Error updating document: ', error);
      alert('There was an error submitting your response. Please try again.');
    }
  };

  return (
    <div className="first-time-login-container">
      <h1 className="first-time-login-title">Welcome to the Application!</h1>
      <p className="first-time-login-description">This is your first time logging in. Please complete your profile.</p>
      <form className="first-time-login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nickname">Nickname:</label>
          <input
            type="text"
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Previous Biking Experience:</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="beginner"
                checked={bikingExperience === 'beginner'}
                onChange={(e) => setBikingExperience(e.target.value)}
              />
              Beginner
            </label>
            <label>
              <input
                type="radio"
                value="intermediate"
                checked={bikingExperience === 'intermediate'}
                onChange={(e) => setBikingExperience(e.target.value)}
              />
              Intermediate
            </label>
            <label>
              <input
                type="radio"
                value="advanced"
                checked={bikingExperience === 'advanced'}
                onChange={(e) => setBikingExperience(e.target.value)}
              />
              Advanced
            </label>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="bikingFrequency">How often do you wish to ride per week?</label>
          <select
            id="bikingFrequency"
            value={bikingFrequency}
            onChange={(e) => setBikingFrequency(e.target.value)}
            required
            className="form-input"
          >
            <option value="">Select...</option>
            <option value="0">0 (Never! 😂)</option>
            <option value="1">1 (Once a week! 😅)</option>
            <option value="2">2 (Twice a week! 🚴‍♂️)</option>
            <option value="3">3 (Thrice a week! 🚴‍♀️)</option>
            <option value="4">4 (Four times a week! 🚵)</option>
            <option value="5">5 (Five times a week! 🚴)</option>
            <option value="6">6 (Almost every day! 😎)</option>
            <option value="7">7 (Every day! 🚴‍♂️💪)</option>
          </select>
        </div>
        <div className="form-group">
          <label>How hardcore are you?</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="fair"
                checked={hardcoreLevel === 'fair'}
                onChange={(e) => setHardcoreLevel(e.target.value)}
              />
              Fair Weather Rider
            </label>
            <label>
              <input
                type="radio"
                value="occasional"
                checked={hardcoreLevel === 'occasional'}
                onChange={(e) => setHardcoreLevel(e.target.value)}
              />
              Occasional Adventurer
            </label>
            <label>
              <input
                type="radio"
                value="hardcore"
                checked={hardcoreLevel === 'hardcore'}
                onChange={(e) => setHardcoreLevel(e.target.value)}
              />
              Hardcore Adventurerr
            </label>
          </div>
        </div>
        <button type="submit" className="submit-button">Submit</button>
      </form>
    </div>
  );
};

export default FirstTimeLogin;