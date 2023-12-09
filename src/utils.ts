import { atom } from "jotai"
import { Notyf } from "notyf"

export const peerConnectionAtom = atom<RTCPeerConnection | null>(null)
export const localStreamAtom = atom<MediaStream | null>(null)
export const remoteStreamAtom = atom<MediaStream | null>(null)

export const notyf = new Notyf()
