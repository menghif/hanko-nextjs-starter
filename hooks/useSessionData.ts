import { useState, useEffect } from "react";
import { Hanko } from "@teamhanko/hanko-elements";
import { cookies } from "next/headers";
import * as jose from "jose";

const hankoApi = process.env.NEXT_PUBLIC_HANKO_API_URL || "";

interface HankoSession {
  userID: string;
  jwt: string;
  isValid: boolean;
  loading: boolean;
  error: string | null;
}

export async function userId() {
  const token = cookies().get("hanko")?.value;
  const payload = jose.decodeJwt(token ?? "");

  const userID = payload.sub;
  return userID;
}

export function useSessionData(): HankoSession {
  const [hanko, setHanko] = useState<Hanko>();
  const [sessionState, setSessionState] = useState<HankoSession>({
    userID: "",
    jwt: "",
    isValid: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    import("@teamhanko/hanko-elements").then(({ Hanko }) =>
      setHanko(new Hanko(hankoApi))
    );
  }, []);

  useEffect(() => {
    async function fetchSessionData() {
      if (hanko) {
        const isValid = hanko.session.isValid();
        const session = hanko.session.get();

        if (isValid && session) {
          const { jwt = "" } = session;
          try {
            const userID = await userId() ?? "";
            setSessionState({
              userID,
              jwt,
              isValid,
              loading: false,
              error: null,
            });
          } catch (error) {
            setSessionState({
              userID: "",
              jwt: "",
              isValid: false,
              loading: false,
              error: "Failed to fetch user ID",
            });
          }
        } else {
          setSessionState((prevState) => ({
            ...prevState,
            isValid: false,
            loading: false,
            error: "Invalid session",
          }));
        }
      }
    }

    fetchSessionData();
  }, [hanko]);

  return sessionState;
}
