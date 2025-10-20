'use client'

import { Role } from './schemas'

const TAB_MEMORY_KEY = 'partkeeper:tab-memory'

export function getStoredTab(songId: string): Role | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(TAB_MEMORY_KEY)
    if (!stored) return null
    
    const tabMemory = JSON.parse(stored)
    return tabMemory[songId] || null
  } catch {
    return null
  }
}

export function setStoredTab(songId: string, role: Role): void {
  if (typeof window === 'undefined') return
  
  try {
    const stored = localStorage.getItem(TAB_MEMORY_KEY)
    const tabMemory = stored ? JSON.parse(stored) : {}
    tabMemory[songId] = role
    localStorage.setItem(TAB_MEMORY_KEY, JSON.stringify(tabMemory))
  } catch {
    // Silently fail if localStorage is not available
  }
}
