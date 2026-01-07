import { writable, derived } from 'svelte/store'
import { browser } from '$app/environment'

export interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState)

  return {
    subscribe,
    
    initialize: async () => {
      if (!browser) return
      
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'same-origin'
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.authenticated && data.user) {
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false
            })
            return
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
      }
      set({ ...initialState, isLoading: false })
    },
    
    login: async (email: string, password: string, rememberMe: boolean = false) => {
      update(state => ({ ...state, isLoading: true }))
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'same-origin',
          body: JSON.stringify({ email, password, rememberMe })
        })
        
        const data = await response.json()
        
        if (response.ok && data.success) {
          const user: User = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name || email.split('@')[0],
            role: data.user.role || 'Administrator'
          }
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false
          })
          
          return { success: true, redirectTo: data.redirectTo }
        } else {
          update(state => ({ ...state, isLoading: false }))
          return { success: false, message: data.message || 'Login failed' }
        }
      } catch (error) {
        update(state => ({ ...state, isLoading: false }))
        return { success: false, message: 'Connection error. Please try again.' }
      }
    },
    
    logout: async () => {
      try {
        await fetch('/api/auth/logout', { 
          method: 'POST',
          credentials: 'same-origin'
        })
      } catch (error) {
        console.error('Logout error:', error)
      }
      set({ user: null, isAuthenticated: false, isLoading: false })
    },
    
    clearError: () => {
      update(state => ({ ...state, error: undefined }))
    }
  }
}

export const auth = createAuthStore()

export const currentUser = derived(auth, $auth => $auth.user)
export const isAuthenticated = derived(auth, $auth => $auth.isAuthenticated)
export const isLoading = derived(auth, $auth => $auth.isLoading)
