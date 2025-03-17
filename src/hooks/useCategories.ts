import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";

interface Category {
  id: number;
  name: string;
  createdAt: string;
  isDeleted: boolean;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const headers: HeadersInit = {};
        if (user?.token) {
          headers["Authorization"] = `Bearer ${user.token}`;
        }
        
        const response = await fetch("https://localhost:7094/api/Category/all", {
          headers,
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        
        const data: Category[] = await response.json();
        setCategories(data.filter((cat) => !cat.isDeleted));
      } catch (err) {
        setError((err as Error).message || "An error occurred");
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories(); // Fetch categories regardless of user authentication
  }, [user?.token]); // Only refetch if token changes

  return { categories, loading, error };
};