import { useEffect, useState, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import axios from 'axios'
import { get } from 'http';

const Home = () => {
 const [notification, setNotification] = useState('')
 const tabRef = useRef(null); // Ref to track the opened tab
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)
  // Declare form IDs
  const formId = '682be1800177e7718be6a872'
  const latId = '68240b6ab74eb850778cced6'
  const lngId = '68240b80810acfbebc50f572'





  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          console.log(lat, lng, 'latlng');
          setLatitude(lat);
          setLongitude(lng);

          // Show redirecting message and delay before opening the link
          if (lat && lng) {
            setNotification('Loading...');
            setTimeout(() => {
              const link = `https://form.gov.sg/${formId}?${latId}=${lat}&${lngId}=${lng}`;
              if (!tabRef.current || tabRef.current.closed) {
                tabRef.current = window.open(link, '_blank');
                if (!tabRef.current) {
                  // Fallback for Safari or blocked pop-ups
                  window.location.href = link;
                }
              } else {
                tabRef.current.location.href = link;
              }
              setNotification(''); // Clear notification after redirection
            }, 650); // delay as failsafe
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
  }, []) // Removed latitude and longitude from dependencies

  return (
    <div>
      {/* Notification Popup */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '90%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: notification === 'Loading...' ? 'transparent' : '#ff4d4f',
            color: notification === 'Loading...' ? 'black' : 'white',
            fontSize: notification === 'Loading...' ? '2rem' : '1rem',
            padding: '10px 20px',
            borderRadius: '5px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            zIndex: '1000',
            textAlign: 'center',
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