import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { API_URL } from "../main"

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)
interface UserType {
  id: string;
  name: string;
  mail: string;
  role: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  iat: number;
  username?: string;
}
interface AuthContextType {
  user: any
  loading: boolean
  error: string
  login: (credentials: any) => Promise<any>
  logout: () => Promise<void>
  isAuthenticated: () => boolean
  getUserProfile: () => Promise<any>
  updateProfile: (profileData: any) => Promise<any>
  changePassword: (passwordData: any) => Promise<any>
}

// Provider component that wraps your app and makes auth object available to any child component that calls useAuth().
export function AuthProvider({ children } : any) {
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const storedUser = localStorage.getItem("user")
        const accessToken = localStorage.getItem("accessToken")

        if (storedUser && accessToken) {
          try {
            if (accessToken) {
              // Verify token with backend
                 const response = await fetch(
                `${API_URL}/api/auth/profile`,
                {
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`, // Lấy token từ localStorage
                  },
                }
              );
              const data = await response.json();


              if (data) {
                // console.log(data)
                setUser({
                  id: data.userId,
                  name: data.name,
                  mail: data.mail,
                  role: data.role,
                  address: data.address,
                  city: data.city,
                  state: data.state,
                  phone: data.phone,
                  iat: data.iat,
                })
                // set
              }
            }
          } catch (error) {
            console.error('Auth check failed:', error);
            const refreshed = await refreshAccessToken()
            if (!refreshed) {
              // If token is invalid, clear it
              localStorage.removeItem('accessToken');
              // localStorage.removeItem('accessToken');
              localStorage.removeItem('user');

            }
          } finally {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Authentication error:", error)
        logout()
      } finally {
        setLoading(false)
      }
    }

    checkLoggedIn()
  }, [])

  // Refresh token function (optional, if you want to implement token refresh logic)
  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await fetch(
        `${API_URL}/api/auth/refresh-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await response.json();
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.userId,
          name: data.name,
          mail: data.mail,
          role: data.role,
          iat: data.iat,
        })
      )

      // Update state
      setUser({
        id: data.userId,
        name: data.name,
        mail: data.mail,
        role: data.role,
        address: data.address,
        city: data.city,
        state: data.state,
        phone: data.phone,
        iat: data.iat,
      })
      return true;
    } catch (error) {
      console.error("Error refreshing token:", error);
      // handleLogout();
      return false;
    }
  };

  // Login function
  const login = async (credentials : any) => {
    setError("")
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()
      console.log(data)
      if (response.ok) {
        // Store tokens in localStorage
        localStorage.setItem("accessToken", data.accessToken)
        localStorage.setItem("refreshToken", data.refreshToken)
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: data.userId,
            name: data.name,
            mail: data.mail,
            role: data.role,
            iat: data.iat,
          })
        )

        // Update state
        setUser({
          id: data.userId,
          name: data.name,
          mail: data.mail,
          role: data.role,
          address: data.address,
          city: data.city,
          state: data.state,
          phone: data.phone,
          iat: data.iat,
        })

        return { success: true, data }
      } else {
        setError(data.message || "Login failed")
        return { success: false, error: data.message || "Login failed" }
      }
    } catch (error) {
      const errorMessage = "Error connecting to server"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    // Clear localStorage

    try {
      // Gửi yêu cầu POST đến API logout
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`, // Lấy token từ localStorage
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Xóa token khỏi localStorage
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken"); // Nếu bạn cũng lưu refresh token
        localStorage.removeItem("user")

        // Clear state
        setUser(null)
        // Chuyển hướng đến trang đăng nhập
        navigate("/");
        alert(data.message); // Hiển thị thông báo đăng xuất thành công
      } else {
        // Xử lý lỗi từ API
        alert(data.message || "Logout failed");
        const refreshed = await refreshAccessToken()
        if (refreshed) {
          await logout();
        }
      }
    } catch (error) {
      console.error("Error during logout:", error);
      alert("An error occurred during logout");
    }
  }

  // Get user profile data
  const getUserProfile = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken")
      
      if (!accessToken) {
        throw new Error("No access token found")
      }

      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch user profile")
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error : any) {
      console.error("Error fetching user profile:", error)
      return { success: false, error: error.message }
    }
  }

  // Update user profile
  const updateProfile = async (profileData : any) => {
    try {
      const accessToken = localStorage.getItem("accessToken")
      
      if (!accessToken) {
        throw new Error("No access token found")
      }

      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(profileData),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      const data = await response.json()
      
      // Update local user data if needed
      if (profileData.username) {
        setUser((prev: UserType | null) => ({
          ...prev,
          username: profileData.username
        } as UserType))
        
        // Update localStorage
        const userString = localStorage.getItem("user")
        const storedUser = userString ? JSON.parse(userString) : null
        localStorage.setItem("user", JSON.stringify({
          ...storedUser,
          username: profileData.username
        }))
      }
      
      return { success: true, data }
    } catch (error : any) {
      console.error("Error updating profile:", error)
      return { success: false, error: error.message }
    }
  }

  // Change password
  const changePassword = async (passwordData : any) => {
    try {
      const accessToken = localStorage.getItem("accessToken")
      
      if (!accessToken) {
        throw new Error("No access token found")
      }

      const response = await fetch(`${API_URL}/api/users/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(passwordData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to change password")
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error : any) {
      console.error("Error changing password:", error)
      return { success: false, error: error.message }
    }
  }

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user
  }

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    getUserProfile,
    updateProfile,
    changePassword
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
