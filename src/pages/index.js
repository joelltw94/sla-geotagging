import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import axios from 'axios'
import { get } from 'http';

const Home = () => {
 const [latitude, setLatitude] = useState('')
 const [longitude, setLongitude] = useState('')
 const [notification, setNotification] = useState('')
  

  // Declare form IDs
  const formId = '68230208ee7d3f1058d82464'
  const latId = '68240b6ab74eb850778cced6'
  const lngId = '68240b80810acfbebc50f572'

  const showNotification = (message) => {
    setNotification(message)
    setTimeout(() => setNotification(''), 3000) // Clear notification after 3 seconds
  }

  const showLoadingNotification = () => {
    setIsLoading(true)
  }

  const hideLoadingNotification = () => {
    setIsLoading(false)
  }

  const getformsg = () => {
    const link = `https://form.gov.sg/${formId}?${latId}=${latitude}&${lngId}=${longitude}`
    window.open(link, "_blank")
  } 

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          console.log(lat, lng, 'latlng');
          setLatitude(lat);
          setLongitude(lng);
          if (lat && lng) {
            getformsg();
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          if (error.code === error.PERMISSION_DENIED) {
            setNotification('Location access denied. Please enable location services and try again.');
          } else {
            setNotification('Unable to retrieve your location. Please try again.');
          }
        }
      );
    } else {
      setNotification('Geolocation is not supported by this browser.');
    }
  };

  const retryLocationAccess = () => {
    setNotification('');
    getUserLocation();
  };

  useEffect(() => {
    getUserLocation()
    return () => {

    }
  }, [latitude, longitude])

  return (
    <div>
      {/* Notification Popup */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#ff4d4f',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '5px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            zIndex: '1000',
          }}
        >
          {notification}
          {notification.includes('enable location services') && (
            <button
              onClick={retryLocationAccess}
              style={{
                marginLeft: '10px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default Home