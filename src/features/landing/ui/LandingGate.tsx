import { useState } from "react";
import App from "@/App";
import LandingPage from "./LandingPage";
import { localStorageCache } from "@/core/cache/localStorageCache";

const ENTERED_KEY = "landing.entered";
/** ~10 years — the landing is a first-visit front door, not a tollbooth. */
const ENTERED_TTL_MS = 10 * 365 * 24 * 60 * 60 * 1000;

/**
 * Front door: first-time visitors get the animated landing; everyone else
 * goes straight into the studio. Entering the studio is remembered.
 */
export default function LandingGate() {
  const [entered, setEntered] = useState<boolean>(() =>
    Boolean(localStorageCache.read<boolean>(ENTERED_KEY, ENTERED_TTL_MS)),
  );

  if (entered) return <App />;

  return (
    <LandingPage
      onEnter={() => {
        localStorageCache.write(ENTERED_KEY, true);
        setEntered(true);
      }}
    />
  );
}
