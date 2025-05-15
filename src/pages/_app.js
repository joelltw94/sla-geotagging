// pages/_app.js
import '../styles/style.css'
import Head from 'next/head'

import { useEffect } from 'react'
import { useRouter } from "next/router"
import { isMobileDevice } from "../utils/detectMobile"

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    if (isMobileDevice() && router.pathname !== "/mobile") {
      //router.replace("/mobile"); // Redirect for mobile.js... not in use right now 
    }
  }, [router]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
