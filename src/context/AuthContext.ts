import { createContext } from "react"
import type { AuthContextType } from "../store/AuthContext"

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
