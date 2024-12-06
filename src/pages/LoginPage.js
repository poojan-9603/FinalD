import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      const userQuery = query(collection(db, "users"), where("uid", "==", user.uid));
      const userSnapshot = await getDocs(userQuery);
  
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        
        // Update the loggedIn status in Firestore
        await updateDoc(doc(db, "users", userSnapshot.docs[0].id), {
          firstTimeLogin: false,
          loggedIn: true // Set loggedIn to true
        });
  
        // Log the value of firstTimeLogin for debugging
        console.log("firstTimeLogin value:", userData.firstTimeLogin);
  
        // Check if firstTimeLogin is false
        if (userData.firstTimeLogin === false) {
          navigate('/dashboard'); // Redirect to dashboard if firstTimeLogin is false
        } else {
          navigate('/first-time-login'); // Redirect to first-time login if firstTimeLogin is true
        }
      } else {
        alert('User not found. Please check your credentials.');
      }
    } catch (error) {
      console.error('Error: ', error);
      alert('Error: ' + error.message);
    }
  };

  return (
    <div style={styles.loginContainer}>
      <h1 style={styles.loginTitle}>Hello</h1>
      <form style={styles.loginForm} onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <button type="submit" style={styles.submitButton}>
          Login
        </button>
      </form>
      <button 
        onClick={() => navigate('/create-account')}
        style={styles.toggleButton}
      >
        Switch to Create Account
      </button>
    </div>
  );
};

const styles = {
  loginContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#2c2c2c',
  },
  loginTitle: {
    fontSize: '2rem',
    marginBottom: '20px',
    color: '#ffffff',
  },
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    width: '300px',
    backgroundColor: '#3a3a3a',
    padding: '20px',
    borderRadius: '5px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
  },
  formGroup: {
    marginBottom: '15px',
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #007bff',
    backgroundColor: '#ffffff',
    transition: 'border-color 0.3s, box-shadow 0.3s',
  },
  submitButton: {
    padding: '10px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s, transform 0.3s',
  },
  toggleButton: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s, transform 0.3s',
  },
};

export default LoginPage;