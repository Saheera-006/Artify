import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../config/firebase.js";
import { timestampToMillis } from "../utils/dates.js";

/** Owns the app subscriptions and unsubscribes when the component unmounts. */
export function useAppData(isAdminRoute) {
  const [rounds, setRounds] = useState([]);

  const [loadingRounds, setLoadingRounds] = useState(true);

  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "rounds"),
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        data.sort(
          (a, b) =>
            timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt),
        );

        setRounds(data);
        setLoadingRounds(false);
      },
      (error) => {
        console.error("Rounds error:", error);

        setLoadingRounds(false);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdminRoute) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });

    return () => unsubscribe();
  }, [isAdminRoute]);

  return { rounds, loadingRounds, user, setUser };
}
