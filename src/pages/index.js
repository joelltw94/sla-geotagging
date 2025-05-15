import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import axios from 'axios'

const Home = () => {
  const mapContainerRef = useRef(null) // Create a ref for the map container
  const mapInstanceRef = useRef(null) // Keep track of map instance
  const markerRef = useRef(null) // Keep track of the marker
  const [suggestions, setSuggestions] = useState([]) // State to hold suggestions
  const [searchValue, setSearchValue] = useState('') // State to hold the input value
  const [isSearchBarActive, setIsSearchBarActive] = useState(false) // State to track search bar focus
  const [notification, setNotification] = useState('') // State to hold notification messages
  const [isLoading, setIsLoading] = useState(false) // State to track loading status
  const [accessToken, setAccessToken] = useState('')
  const [geoCodeInfo, setGeocodeInfo] = useState([])

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

  useEffect(() => {
    getToken()
    // console.log(process.env.NEXT_PUBLIC_ONEMAP_EMAIL, 'process.env.NEXT_PUBLIC_ONEMAP_EMAIL')
    const loadLeaflet = async () => {
      const L = await import('leaflet')

      if (!mapInstanceRef.current && mapContainerRef.current) {
        mapInstanceRef.current = L.map(mapContainerRef.current, {
          zoomControl: false // Disable default zoom control
        }).setView([1.363, 103.817], 14)

        // Move zoom control to the bottom left
        L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current)

        L.tileLayer('https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png', {
          attribution:
            '<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20pxwidth:20px"/>&nbsp<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>&nbsp&copy&nbspcontributors&nbsp&#124&nbsp<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>',
        }).addTo(mapInstanceRef.current)

        mapInstanceRef.current.locate({ setView: true, maxZoom: 17, enableHighAccuracy: true })

        let marker
        const customIcon = L.icon({
          iconUrl: 'https://mobile.onemap.gov.sg/web/images/icon-main_locator.png',
          iconSize: [30, 35],
          iconAnchor: [19, 38],
          popupAnchor: [0, -38],
        })

        const onLocationFound = (e) => {
          addMarker(e.latlng, createSelectionPopup(e))
        }
        

        mapInstanceRef.current.on('locationfound', onLocationFound)

        function onLocationError() {
          marker = L.marker([1.363, 103.817], {icon: customIcon, draggable: true }).addTo(mapInstanceRef.current)
          showNotification('L')
        }

        mapInstanceRef.current.on('locationerror', onLocationError)

       

        const onMapClick = (e) => {
          addMarker(e.latlng, createPopup(e))
        }
       
        mapInstanceRef.current.on('click', onMapClick)
        function createSelectionPopup(e) {
          const radius = e.accuracy
          const div = document.createElement('div')
          div.innerHTML = `<p style="text-align: center">LOCATION SELECTED WITHIN ${radius}m: </br> <b>${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}</b></p>`
          div.className = 'popup-container'
          

          const button = document.createElement('button')
          button.innerHTML = 'Select this location'
          button.className = 'button-class'
          button.onclick = function () {
            goToLink(e.latlng.lat, e.latlng.lng)
          }

          div.appendChild(button)
          return div
        }

        function createPopup(e) {
          const div = document.createElement('div')
          div.innerHTML = `<p style="text-align: center">POINT SELECTED:</br> <b>${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}</b></p>`
          div.className = 'popup-container'

          const button = document.createElement('button')
          button.innerHTML = 'Select this location'
          button.className = 'button-class'
          button.onclick = function () {
            goToLink(e.latlng.lat, e.latlng.lng)
          }

          div.appendChild(button)
          return div
        }
      }
    }

    if (typeof window !== 'undefined') {
      loadLeaflet()
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off()
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])
  const addMarker = (latlng, popupContent) => {
    if (markerRef.current) {
      markerRef.current.remove() // Remove existing marker before adding a new one
    }
  
    const customIcon = L.icon({
      iconUrl: 'https://mobile.onemap.gov.sg/web/images/icon-main_locator.png',
      iconSize: [30, 35],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
    })
  
    markerRef.current = L.marker(latlng, { icon: customIcon, draggable: true })
      .addTo(mapInstanceRef.current)
      .bindPopup(popupContent)
      .openPopup()
  }
  const handleSearchInput = (e) => {
    const value = e.target.value
    setSearchValue(value)

    if (value.length >= 3) {
      fetchSuggestions(value)
    } else {
      setSuggestions([])
    }
  }

  const handleSearchBarFocus = () => {
    setIsSearchBarActive(true)
  }

  const handleSearchBarBlur = () => {
    setTimeout(() => setIsSearchBarActive(false), 200) // Delay to allow click on suggestions
  }

  const fetchSuggestions = (value) => {
    const xhr = new XMLHttpRequest()
    xhr.addEventListener('readystatechange', function () {
      if (this.readyState === this.DONE && this.status === 200) {
        const response = JSON.parse(this.responseText)
        if (response.found > 0 && response.results.length > 0) {
          setSuggestions(response.results)
        } else {
          setSuggestions([])
        }
      }
    })

    xhr.open(
      'GET',
      `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${value}&returnGeom=Y&getAddrDetails=Y&pageNum=1`
    )
    xhr.send()
  }
  
  const handleSuggestionClick = (suggestion) => {
    setSearchValue(suggestion.SEARCHVAL) // Set input value to the selected suggestion
    setSuggestions([]) // Close the search results
    handleSearch(suggestion.LATITUDE, suggestion.LONGITUDE) // Perform search
  }
  const handleSearch = (lat, lng) => {
    addMarker([lat, lng], createSearchPopup(lat, lng))
    mapInstanceRef.current.setView([lat, lng], 15)
  }

  const handleLocateUser = () => {
    if (mapInstanceRef.current) {
      // Request high-accuracy location
      mapInstanceRef.current.locate({ setView: true, maxZoom: 17, enableHighAccuracy: true })
  
      mapInstanceRef.current.on('locationfound', (e) => {
        const latlng = e.latlng
  
        // Add or update the marker at the user's location with the custom icon and draggable feature
        if (markerRef.current) {
          markerRef.current.setLatLng(latlng) // Update marker position
        } else {
          const customIcon = L.icon({
            iconUrl: 'https://mobile.onemap.gov.sg/web/images/icon-main_locator.png',
            iconSize: [30, 35],
            iconAnchor: [19, 38],
            popupAnchor: [0, -38],
          })
  
          markerRef.current = L.marker(latlng, { icon: customIcon, draggable: true }).addTo(mapInstanceRef.current)
        }
  
        // Create the popup with the "Select this location" button
        const div = document.createElement('div')
        div.innerHTML = `<p style="text-align: center">CURRENT LOCATION:</br> <b>${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}</b></p>`
        div.className = 'popup-container'
  
        const button = document.createElement('button')
        button.innerHTML = 'Select this location'
        button.className = 'button-class'
        
        button.onclick = function () {
          goToLink(latlng.lat, latlng.lng)
        }
  
        div.appendChild(button)
  
        markerRef.current.bindPopup(div).openPopup()
      })
  
      mapInstanceRef.current.on('locationerror', () => {
        showNotification('Unable to retrieve your location. Please enable location services.')
      })
    }
  }
  


  const createSearchPopup = (lat, lng) => {
    const div = document.createElement('div')
  
    // Ensure lat and lng are numbers before using toFixed
    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)
  
    div.innerHTML = `<p style="text-align: center">You have selected this point at:</br> <b>${latitude.toFixed(4)}, ${longitude.toFixed(4)}</b></p>`
    div.className = 'popup-container'
  
    const button = document.createElement('button')
    button.innerHTML = 'Select this location'
    button.className = 'button-class'
    button.onclick = function () {
      goToLink(latitude, longitude)
    }
  
    div.appendChild(button)
    return div
  }

  const getToken = async () => {
    try {
      const res = await axios.post('/api/getToken')
      if (res) {
        // console.log(res, 'res')
        const { data: { token } } = res
        setAccessToken(token)

      }
    } catch(err) {
      console.log(err)
    }
  }

  console.log(accessToken, 'accessToken')
  
  const goToLink = async (lat, lng) => {
    showLoadingNotification()
    console.log(accessToken, 'accessToken')
    // Fetch a fresh token
    if (accessToken) {
      try {
        // Reverse geocode API call
        const geocodeResponse = await axios.get(
          `https://www.onemap.gov.sg/api/public/revgeocode?location=${lat},${lng}&buffer=18&addressType=All&otherFeatures=N`,
          {
            method: 'GET',
            headers: {
            Authorization: accessToken
          },
        }
      )
      // console.log(geocodeResponse, 'GR')
      if(geocodeResponse) {
        const { data: { GeocodeInfo } } = geocodeResponse
        // console.log(GeocodeInfo, 'GeocodeInfo')
        setGeocodeInfo(GeocodeInfo)
      }

      if (!geoCodeInfo && geoCodeInfo.length === 0) {
        hideLoadingNotification()
        showNotification('No geocode information found for this location')
        return
      }

      const xyResponse = await axios.get(
        `https://www.onemap.gov.sg/api/common/convert/4326to3414?latitude=${lat}&longitude=${lng}`,
        {
          headers: {
            Authorization: accessToken
          }
        }
      )

      const { X, Y } = xyResponse.data

      if (!X || !Y) {
        hideLoadingNotification()
        showNotification('Failed to convert latitude and longitude to X and Y.')
        return
      }

      showGeocodeOverlay(geoCodeInfo, lat, lng, X, Y)

      hideLoadingNotification()

      } catch (error) {
        hideLoadingNotification()
        showNotification(error.message)
      }
    } else {
      hideLoadingNotification()
      showNotification('Failed to retrieve authentication token.')
      return
    }
  }

  const showGeocodeOverlay = (geoCodeInfo, lat, lng, X, Y) => {
    // Create the overlay element
    const overlay = document.createElement("div")
    overlay.className = "new-overlay"
  
    // Create the overlay content
    const overlayContent = document.createElement("div")
    overlayContent.className = "new-overlay-content"
  
    // Header
    const header = document.createElement('div')
    header.className = "new-overlay-header"
    header.textContent = "Select a Geocode"
    overlayContent.appendChild(header)
  
    // Description
    const description = document.createElement('div')
    description.className = "new-overlay-description"
    description.textContent = "Pick the point that best fits your situation."
    overlayContent.appendChild(description)
  
    // List of geocode options
    const geocodeList = document.createElement('ul')
    geocodeList.className = "new-overlay-list"
  
    geoCodeInfo.forEach((info) => {
      // console.log(info, 'info')
      const listItem = document.createElement('li')
      listItem.className = "new-overlay-list-item"
  
      const addressParts = [
        info.BUILDINGNAME && info.BUILDINGNAME !== 'NIL' && info.BUILDINGNAME !== "null" ? info.BUILDINGNAME : " ",
        info.BLOCK && info.BLOCK !== 'NIL' && info.BLOCK !== 'null' ? info.BLOCK : " ",
        info.ROAD && info.ROAD !== "NIL" && info.ROAD !== "null" ? info.ROAD : " ",
        info.POSTALCODE && info.POSTALCODE !== "NIL" && info.POSTALCODE !== 'null' ? info.POSTALCODE : " ",
      ]

      let address = addressParts.join(" ")
  
      // Create button container
      const button = document.createElement('button')
      button.className = "new-overlay-button"
      button.onclick = function () {
        const link = `https://form.gov.sg/${formId}?${latId}=${lat}&${lngId}=${lng}&=${address}`
        window.open(link, "_blank")
        document.body.removeChild(overlay)
      }
  
      // Name Section
      const nameSection = document.createElement("div")
      nameSection.style.fontWeight = "bold"
      nameSection.textContent = name
  
      // Address Section
      const addressSection = document.createElement("div")
      addressSection.style.color = "#555"
      addressSection.textContent = address
  
      // Append sections to button
      button.appendChild(nameSection)
      button.appendChild(addressSection)
  
      listItem.appendChild(button)
      geocodeList.appendChild(listItem)
    })
  
    overlayContent.appendChild(geocodeList)
  
    // Close button
    const closeButton = document.createElement("button")
    closeButton.className = "new-overlay-close-btn"
    closeButton.textContent = "Close"
    closeButton.onclick = function () {
      document.body.removeChild(overlay)
    }
  
    overlayContent.appendChild(closeButton)
    overlay.appendChild(overlayContent)
    document.body.appendChild(overlay)
  }
  

  
  // Function to fetch address by postal code and navigate to the URL
  const fetchAddressByPostalCode = (postalCode, lat, lng) => {
    const xhr = new XMLHttpRequest()
    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === this.DONE) {
        if (this.status === 200) {
          const response = JSON.parse(this.responseText)
          if (response.found > 0 && response.results.length > 0) {
            const address = response.results[0].ADDRESS // Use the first result's address
  
            // Create the link for redirection using the full address
            const link = `https://form.gov.sg/${formId}?${latId}=${lat}&${lngId}=${lng}&${addId}=${address}`
            window.open(link, '_blank')
          } else {
            showNotification('No address found for this postal code.')
          }
        } else {
          showNotification('Error fetching address details.')
        }
      }
    })
  
    xhr.open("GET", `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${postalCode}&returnGeom=Y&getAddrDetails=Y&pageNum=1`)
    xhr.send()
  }

  return (
    <div>
      {/* Loading Notification */}
      {isLoading && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px', 
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#007bff',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '5px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            zIndex: '1000',
            textAlign: 'center',
          }}
        >
          Loading geocode information...
          <div
            style={{
              marginTop: '10px',
              height: '5px',
              width: '100%',
              backgroundColor: '#ccc',
              borderRadius: '5px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: '50%', // Simulate progress (adjust dynamically if needed)
                backgroundColor: '#295fdc',
                transition: 'width 0.5s ease',
              }}
            ></div>
          </div>
        </div>
      )}

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
        </div>
      )}

      <div
        style={{
          top: 'env(safe-area-inset-top, 10px)', // Add safe area inset for the top
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: '1000',
          width: '100%',
          maxWidth: '600px', // Ensure consistent width for search bar and results
          padding: '0 10px', // Add padding to prevent it from touching the edges
          boxSizing: 'border-box', // Include padding in the element's total width
        }}
      >
        <input
        
          type="text"
          id="search"
          value={searchValue}
          onChange={handleSearchInput}
          onFocus={handleSearchBarFocus}
          onBlur={handleSearchBarBlur}
          placeholder="Search for a location"
          style={{
            top: 'env(safe-area-inset-top, 10px)', // Add safe area inset for the top
            background: '#ffffff',
            padding: '15px',
            width: '100%', // Ensure it matches the container width
            border: 'none',
            boxShadow: '2px 2px 10px rgba(0, 0, 0, 0.1)',
            borderRadius: '10px',
            outline: 'none',
            textAlign: 'center',
            boxSizing: 'border-box', // Include padding in the element's total width
          }}
        />
        {isSearchBarActive && suggestions.length > 0 && (
          <ul
            style={{
              position: 'absolute',
              top: '50px',
              left: '0',
              width: '100%', // Match the width of the container
              maxWidth: '100%', // Ensure it doesn't exceed the container's width
              maxHeight: '200px', // Limit height of search results
              overflowY: 'auto', // Enable scrolling for extra results
              background: '#fff',
              boxShadow: '2px 2px 10px rgba(0, 0, 0, 0.1)',
              borderRadius: '10px',
              listStyleType: 'none',
              padding: '10px',
              margin: '0 auto', // Center the results
              boxSizing: 'border-box', // Include padding in the element's total width
              zIndex: '1001',
            }}
          >
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.SEARCHVAL}
                onClick={() => handleSuggestionClick(suggestion)}
                style={{
                  padding: '10px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #ddd',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
              >
                <div>{suggestion.SEARCHVAL}</div>
                <small style={{ color: '#7e7e7e' }}>{suggestion.ADDRESS}</small>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        id="map"
        ref={mapContainerRef}
        style={{
          height: '99vh',
          width: '100%',
          touchAction: 'pinch-zoom', // Allow pinch-to-zoom on the map
          overscrollBehavior: 'contain', // Contain overscroll behavior to the map
        }}
      ></div>

      <button
        onClick={handleLocateUser}
        style={{
          position: 'fixed',
          bottom: '12 0px',
          right: '8px',
          width: '40px',
          height: '40px',
          backgroundImage: 'url(https://mobile.onemap.gov.sg/web/images/locate_me.png)',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          border: 'none',
          borderRadius: '50%',
          boxShadow: '2px 2px 10px rgba(0, 0, 0, 0.2)',
          cursor: 'pointer',
          zIndex: '1000',
        }}
      ></button>
    </div>
  )
}

export default Home