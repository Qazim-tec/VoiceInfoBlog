// src/hooks/useCategories.ts
import { useState, useEffect, useRef } from "react";
import { useUser } from "../context/UserContext";

interface Category {
  id: number;
  name: string;
  createdAt: string;
  // Note: isDeleted is not returned by CategoryResponseDto, so we won't include it here
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const cache = useRef<Category[] | null>(null); // Client-side cache

  useEffect(() => {
    const fetchCategories = async () => {
      if (cache.current) {
        setCategories(cache.current);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const headers: HeadersInit = {};
        if (user?.token) {
          headers["Authorization"] = `Bearer ${user.token}`;
        }

        const response = await fetch("https://voiceinfo.onrender.com/api/Category/all", {
          headers,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data: Category[] = await response.json();
        cache.current = data; // Store in client-side cache
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [user?.token]); // Re-fetch if token changes

  return { categories, loading, error };
};