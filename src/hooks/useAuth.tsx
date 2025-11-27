import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getCollegeById } from "@/lib/colleges";

export type UserRole = "student" | "alumni" | "college" | "admin";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      const role = data?.role as UserRole;
      setUserRole(role);
      return role;
    } catch (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole, collegeId?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        let collegeDbId: string | null = null;

        // Handle college selection
        if (collegeId && role !== "admin") {
          // Get college data from our list
          const college = getCollegeById(collegeId);
          
          if (college) {
            // Use find_or_create_college RPC function for consistency
            // This handles case-insensitive matching and ensures we get the same college_id
            const { data: rpcCollegeId, error: rpcError } = await (supabase.rpc as any)(
              'find_or_create_college',
              {
                p_name: college.name,
                p_location: college.location,
              }
            );

            if (!rpcError && rpcCollegeId) {
              collegeDbId = rpcCollegeId as string;
            } else {
              // Fallback: try case-insensitive search
              const { data: existingCollege } = await supabase
                .from("colleges")
                .select("id")
                .ilike("name", college.name)
                .maybeSingle();

              if (existingCollege) {
                collegeDbId = existingCollege.id;
              } else {
                // Create college if it doesn't exist
                const { data: newCollege, error: collegeCreateError } = await supabase
                  .from("colleges")
                  .insert({
                    name: college.name,
                    location: college.location,
                    website: null,
                  })
                  .select("id")
                  .single();

                if (collegeCreateError) {
                  console.error("Error creating college:", collegeCreateError);
                  // Continue without college if creation fails
                } else if (newCollege) {
                  collegeDbId = newCollege.id;
                }
              }
            }

            // For college role, check if college already has an admin
            if (role === "college" && collegeDbId) {
              const { data: existingCollegeAdmin } = await supabase
                .from("profiles")
                .select("user_id")
                .eq("college_id", collegeDbId)
                .eq("role", "college")
                .single();

              if (existingCollegeAdmin) {
                throw new Error("This college already has a representative. Please contact support if you need to update it.");
              }
            }
          }
        }

        // Use the database function to create profile and role (bypasses RLS issues)
        // Now includes college_id as a parameter for atomic creation
        const { error: functionError } = await (supabase.rpc as any)('create_user_profile', {
          p_user_id: data.user.id,
          p_full_name: fullName,
          p_email: email,
          p_role: role,
          p_college_id: collegeDbId, // Pass college_id directly to the RPC
        });

        if (functionError) {
          console.error("Error calling create_user_profile RPC:", functionError);
          // Fallback to direct inserts if function doesn't exist or fails
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              user_id: data.user.id,
              full_name: fullName,
              email: email,
              role: role,
              college_id: collegeDbId,
            });

          if (profileError) throw profileError;

          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({
              user_id: data.user.id,
              role: role,
            });

          if (roleError) throw roleError;
          
          // For college role, update the college's admin_id
          if (role === "college" && collegeDbId) {
            await supabase
              .from("colleges")
              .update({ admin_id: data.user.id })
              .eq("id", collegeDbId);
          }
        }
        // Note: The RPC function now handles college_id and admin_id update atomically

        toast({
          title: "Success",
          description: "Account created successfully!",
          variant: "success",
        });
      }

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch role after successful login
      if (data.user) {
        await fetchUserRole(data.user.id);
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
        variant: "success",
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const signInWithOAuth = async (provider: "google" | "linkedin" | "github") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Signed out",
        description: "Successfully signed out.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent a password reset link to your email address.",
        variant: "success",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your password has been updated successfully.",
        variant: "success",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const getDashboardPath = (role: UserRole | null): string => {
    if (!role) return "/auth";
    const dashboardMap: Record<UserRole, string> = {
      student: "/student/dashboard",
      alumni: "/alumni/dashboard",
      college: "/college/dashboard",
      admin: "/admin/dashboard",
    };
    return dashboardMap[role] || "/auth";
  };

  return {
    user,
    session,
    loading,
    userRole,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    resetPasswordForEmail,
    updatePassword,
    getDashboardPath,
    fetchUserRole,
  };
}
