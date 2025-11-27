import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { colleges, getCollegeById, type College } from "@/lib/colleges";

export interface DatabaseCollege {
  id: string;
  name: string;
  location: string | null;
  website: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Central hook for managing colleges across the application.
 * Provides access to both static college list and database colleges.
 */
export function useColleges() {
  // Fetch all colleges from database
  const { data: dbColleges, isLoading: isLoadingDbColleges, error: dbCollegesError } = useQuery({
    queryKey: ["db-colleges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colleges")
        .select("id, name, location, website")
        .order("name");
      if (error) throw error;
      return (data || []) as DatabaseCollege[];
    },
  });

  /**
   * Find a college from the static list by matching name (case-insensitive, flexible matching)
   */
  const findStaticCollegeByName = (name: string): College | undefined => {
    if (!name) return undefined;
    const normalizedName = name.trim().toLowerCase();
    return colleges.find(
      (college) => college.name.toLowerCase() === normalizedName
    );
  };

  /**
   * Find a college from the static list by matching database college
   */
  const findStaticCollegeByDbCollege = (dbCollege: DatabaseCollege): College | undefined => {
    return findStaticCollegeByName(dbCollege.name);
  };

  /**
   * Get college ID from static list that matches a database college
   */
  const getStaticCollegeIdForDbCollege = (dbCollege: DatabaseCollege | null | undefined): string => {
    if (!dbCollege) return "";
    const staticCollege = findStaticCollegeByDbCollege(dbCollege);
    return staticCollege?.id || "";
  };

  /**
   * Find or create a college in the database using the find_or_create_college RPC function
   */
  const findOrCreateCollege = async (collegeName: string, location?: string): Promise<string | null> => {
    if (!collegeName) return null;

    try {
      // Try using the RPC function first
      const { data: collegeDbId, error: functionError } = await (supabase.rpc as any)(
        'find_or_create_college',
        {
          p_name: collegeName.trim(),
          p_location: location || "",
        }
      );

      if (!functionError && collegeDbId) {
        return collegeDbId as string;
      }

      // Fallback: try to find existing college using case-insensitive match
      const { data: existingCollege } = await supabase
        .from("colleges")
        .select("id")
        .ilike("name", collegeName.trim())
        .maybeSingle();

      if (existingCollege) {
        return existingCollege.id;
      }

      // Create new college if it doesn't exist
      const { data: newCollege, error: createError } = await supabase
        .from("colleges")
        .insert({
          name: collegeName.trim(),
          location: location || "",
        })
        .select("id")
        .single();

      if (createError) {
        console.error("Error creating college:", createError);
        return null;
      }

      return newCollege.id;
    } catch (error) {
      console.error("Error in findOrCreateCollege:", error);
      return null;
    }
  };

  /**
   * Get a database college by ID
   */
  const getDbCollegeById = (id: string): DatabaseCollege | undefined => {
    return dbColleges?.find((c) => c.id === id);
  };

  /**
   * Get a database college by name (case-insensitive)
   */
  const getDbCollegeByName = (name: string): DatabaseCollege | undefined => {
    if (!name || !dbColleges) return undefined;
    const normalizedName = name.trim().toLowerCase();
    return dbColleges.find((c) => c.name.toLowerCase() === normalizedName);
  };

  return {
    // Static college list
    staticColleges: colleges,
    
    // Database colleges
    dbColleges: dbColleges || [],
    isLoadingDbColleges,
    dbCollegesError,
    
    // Helper functions
    findStaticCollegeByName,
    findStaticCollegeByDbCollege,
    getStaticCollegeIdForDbCollege,
    findOrCreateCollege,
    getDbCollegeById,
    getDbCollegeByName,
    getCollegeById, // Re-export from lib/colleges
  };
}

