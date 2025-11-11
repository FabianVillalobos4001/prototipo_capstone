import { useEffect, useState } from "react";
import { getCurrentUser } from "../api/user";

export function useUser({ emailFallback } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const user = await getCurrentUser({ email: emailFallback });
        if (alive) setData(user);
      } catch (e) {
        if (alive) setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [emailFallback]);

  return { data, loading, error };
}
