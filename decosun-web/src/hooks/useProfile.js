import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";

export function useProfile() {
  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

      if (!error) {
        setProfile(data);
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  return {
    profile,
    loading,
  };
}