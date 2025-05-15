import axios from 'axios'

let cachedToken = null
let tokenExpiry = null

const getToken = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check if a cached token exists and is still valid
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return res.status(200).json({ token: cachedToken });
  }

  try {
    // Make the API request to get the token
    const response = await axios.post('https://www.onemap.gov.sg/api/auth/post/getToken', {
      email: process.env.NEXT_PUBLIC_ONEMAP_EMAIL,
      password: process.env.NEXT_PUBLIC_ONEMAP_EMAIL_PASSWORD,
    });

    // Extract the data from the response
    const { data } = response
    console.log(data, 'data')

    // Log the response for debugging
    console.log("Token response:", data);

    // Cache the token and set its expiry
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    return res.status(200).json({ token: cachedToken });
  } catch (error) {
    console.error("Error fetching token:", error.message);
    return res.status(500).json({ error: "Failed to fetch token" })
  }
}

export default getToken