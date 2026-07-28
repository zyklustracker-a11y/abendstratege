import { useEffect, useState } from 'react'
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from './firebase'
import { firebaseConfigured } from './firebase-config'
import { isStandalone } from './platform'

export interface AuthState {
  user: User | null
  /** Solange true, ist noch offen, ob eine Sitzung besteht – kein Login-Bildschirm zeigen. */
  pending: boolean
  error: string | null
}

/**
 * Anmeldung mit Google.
 *
 * Im Homescreen-Modus (iOS-PWA) öffnet ein Popup ein separates Safari-Fenster
 * und die Sitzung käme nie zurück – dort wird deshalb weitergeleitet statt
 * aufgeklappt. Auf dem Desktop bleibt das Popup, weil es angenehmer ist.
 */
export async function signInWithGoogle(): Promise<void> {
  const instance = auth()
  const provider = googleProvider()
  if (isStandalone()) {
    await signInWithRedirect(instance, provider)
    return
  }
  try {
    await signInWithPopup(instance, provider)
  } catch (error) {
    const code = (error as { code?: string }).code ?? ''
    // Popup blockiert oder vom Browser unterbunden – dann eben per Weiterleitung.
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(instance, provider)
      return
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return
    throw error
  }
}

export async function signOutUser(): Promise<void> {
  await signOut(auth())
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    pending: firebaseConfigured,
    error: null,
  })

  useEffect(() => {
    if (!firebaseConfigured) return
    const instance = auth()

    // Rückkehr von der Google-Weiterleitung abholen, bevor entschieden wird.
    getRedirectResult(instance).catch((error: unknown) => {
      setState((s) => ({ ...s, error: messageOf(error) }))
    })

    return onAuthStateChanged(
      instance,
      (user) => setState({ user, pending: false, error: null }),
      (error) => setState({ user: null, pending: false, error: messageOf(error) }),
    )
  }, [])

  return state
}

export function messageOf(error: unknown): string {
  const code = (error as { code?: string }).code ?? ''
  if (code === 'auth/network-request-failed') return 'Keine Verbindung zum Anmeldedienst.'
  if (code === 'auth/unauthorized-domain')
    return 'Diese Adresse ist bei Firebase noch nicht als erlaubte Domain eingetragen.'
  if (code === 'auth/popup-closed-by-user') return 'Die Anmeldung wurde abgebrochen.'
  return (error as { message?: string }).message ?? 'Unbekannter Fehler.'
}
