import { Button } from "@mantine/core";
import { useAppDispatch } from "../hooks";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { useState } from "react";

export function GoogleLogin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const dispatch = useAppDispatch();
  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();
  function handleClick() {
    signInWithPopup(auth, googleProvider).then((result) => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      // const credential = GoogleAuthProvider.credentialFromResult(result);
      // const token = credential.accessToken;
      // The signed-in user info.
      const user = result.user;
      console.log(user.uid);
      dispatch({ type: `auth/logInUser`, payload: user.uid });
      setLoggedIn(true);
    });
    // .catch((error) => {
    // Handle Errors here.
    // const errorCode = error.code;
    // const errorMessage = error.message;
    // The email of the user's account used.
    // const email = error.customData.email;
    // The AuthCredential type that was used.
    // const credential = GoogleAuthProvider.credentialFromError(error);
    // ...
    // });
  }
  function handleSignOut() {
    signOut(auth).then(() => {
      dispatch({ type: "auth/logInUser", payload: "demoUser" });
      console.log("Signed out successfully");
      setLoggedIn(false);
    });
  }
  if (loggedIn) {
    return <Button onClick={handleSignOut}>Sign Out</Button>;
  } else {
    return <Button onClick={handleClick}>Login with Google</Button>;
  }
}
