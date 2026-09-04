import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAfylH8YEQvoKpYKy-XlM9lfcuv4jcSHLQ",
  authDomain: "letsbet-platform.firebaseapp.com",
  projectId: "letsbet-platform",
  storageBucket: "letsbet-platform.firebasestorage.app",
  messagingSenderId: "1010086716108",
  appId: "1:1010086716108:web:baa2714017acaafe5e1869",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
