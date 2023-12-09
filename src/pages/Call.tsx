import to from "await-to-js"
import {
	getDatabase,
	off,
	onChildAdded,
	onValue,
	push,
	ref,
	set,
} from "firebase/database"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useRoute } from "wouter"
import { notyf } from "../utils"

export const Call = () => {
	const [peerConnection, setPeerConnection] =
		useState<RTCPeerConnection | null>(null)
	const [localStream, setLocalStream] = useState<MediaStream | null>(null)
	const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
	const [, paramsOffer] = useRoute("/call/offer/:id")
	const [, paramsAnswer] = useRoute("/call/answer/:id")
	const [, setLocation] = useLocation()
	const [localVideo, setLocalVideo] = useState<HTMLVideoElement | null>(null)
	const [remoteVideo, setRemoteVideo] = useState<HTMLVideoElement | null>(null)
	const [isAddOfferForAnswer, setIsAddOfferForAnswer] = useState(false)

	const refLocalVideo = useCallback((video: HTMLVideoElement) => {
		setLocalVideo(video)
	}, [])
	const refRemoteVideo = useCallback((video: HTMLVideoElement) => {
		setRemoteVideo(video)
	}, [])

	const offerId = useMemo(() => {
		return paramsOffer?.id
	}, [paramsOffer])

	const answerId = useMemo(() => {
		return paramsAnswer?.id
	}, [paramsAnswer])

	useEffect(() => {
		;(async () => {
			if (!peerConnection) {
				return
			}
			const [err, localStream] = await to(
				navigator.mediaDevices.getUserMedia({
					audio: true,
				}),
			)
			if (err) {
				notyf.error("Failed to get local stream")
				console.error(err)
				return
			}
			const remoteStream = new MediaStream()
			for (const track of localStream.getTracks()) {
				peerConnection.addTrack(track, localStream)
			}
			peerConnection.ontrack = (event) => {
				for (const track of event.streams[0].getTracks()) {
					remoteStream.addTrack(track)
				}
			}
			setLocalStream(localStream)
			setRemoteStream(remoteStream)
		})()
	}, [peerConnection])

	useEffect(() => {
		if (!localVideo || !localStream) {
			return
		}
		localVideo.srcObject = localStream
	}, [localVideo, localStream])

	useEffect(() => {
		if (!remoteVideo || !remoteStream) {
			return
		}
		remoteVideo.srcObject = remoteStream
	}, [remoteVideo, remoteStream])

	useEffect(() => {
		setPeerConnection(
			new RTCPeerConnection({
				iceServers: [
					{
						urls: ["stun:stun.l.google.com:19302"],
					},
				],
				iceCandidatePoolSize: 10,
			}),
		)
	}, [])

	// Init peer connection for offer
	useEffect(() => {
		;(async () => {
			if (!peerConnection || !offerId) {
				return
			}
			peerConnection.onicecandidate = async (event) => {
				if (!event.candidate) {
					return
				}
				const offerCandidatesRef = push(
					ref(db, `calls/${offerId}/offerCandidates/`),
				)
				const [errSetIceCandidate] = await to(
					set(offerCandidatesRef, event.candidate.toJSON()),
				)
				if (errSetIceCandidate) {
					notyf.error("Failed to set ice candidate")
					console.error(errSetIceCandidate)
					return
				}
			}
			const [errOfferDescription, offerDescription] = await to(
				peerConnection.createOffer({
					offerToReceiveAudio: true,
				}),
			)
			if (errOfferDescription) {
				notyf.error("Failed to create offer")
				console.error(errOfferDescription)
				return
			}
			const [errSetLocalDescription] = await to(
				peerConnection.setLocalDescription(offerDescription),
			)
			if (errSetLocalDescription) {
				notyf.error("Failed to set local description")
				console.error(errSetLocalDescription)
				return
			}
			const db = getDatabase()
			const offerRef = ref(db, `calls/${offerId}/offer`)
			const [errSetOffer] = await to(
				set(offerRef, {
					type: offerDescription.type,
					sdp: offerDescription.sdp,
				}),
			)
			if (errSetOffer) {
				notyf.error("Failed to set offer")
				console.error(errSetOffer)
				return
			}
		})()
	}, [offerId, peerConnection])

	// Init peer connection for answer
	useEffect(() => {
		;(async () => {
			if (!peerConnection || !answerId || !isAddOfferForAnswer) {
				return
			}
			peerConnection.onicecandidate = async (event) => {
				if (!event.candidate) {
					return
				}
				const answerCandidatesRef = push(
					ref(db, `calls/${answerId}/answerCandidates`),
				)
				const [errSetAnswerCandidate] = await to(
					set(answerCandidatesRef, event.candidate.toJSON()),
				)
				if (errSetAnswerCandidate) {
					notyf.error("Failed to set ice candidate")
					console.error(errSetAnswerCandidate)
					return
				}
			}
			const [errAnswerDescription, answerDescription] = await to(
				peerConnection.createAnswer({
					offerToReceiveAudio: true,
				}),
			)
			if (errAnswerDescription) {
				notyf.error("Failed to create offer")
				console.error(errAnswerDescription)
				return
			}
			const [errSetLocalDescription] = await to(
				peerConnection.setLocalDescription(answerDescription),
			)
			if (errSetLocalDescription) {
				notyf.error("Failed to set local description")
				console.error(errSetLocalDescription)
				return
			}
			const db = getDatabase()
			const offerRef = ref(db, `calls/${answerId}/answer`)
			const [errSetAnswer] = await to(
				set(offerRef, {
					type: answerDescription.type,
					sdp: answerDescription.sdp,
				}),
			)
			if (errSetAnswer) {
				notyf.error("Failed to set offer")
				console.error(errSetAnswer)
				return
			}
		})()
	}, [answerId, peerConnection, isAddOfferForAnswer])

	// Set remote description for offer
	useEffect(() => {
		if (!peerConnection || !offerId) {
			return
		}
		const db = getDatabase()
		const answerRef = ref(db, `calls/${offerId}/answer`)
		onValue(answerRef, (snapshot) => {
			const data = snapshot.val()
			if (!data) {
				return
			}
			if (peerConnection.currentRemoteDescription || !data) {
				return
			}
			peerConnection.setRemoteDescription(new RTCSessionDescription(data))
		})
		return () => {
			off(answerRef)
		}
	}, [offerId, peerConnection])

	// Set remote description for answer
	useEffect(() => {
		if (!peerConnection || !answerId) {
			return
		}
		const db = getDatabase()
		const offerRef = ref(db, `calls/${answerId}/offer`)
		onValue(offerRef, (snapshot) => {
			const data = snapshot.val()
			if (!data) {
				return
			}
			if (peerConnection.currentRemoteDescription || !data) {
				return
			}
			peerConnection.setRemoteDescription(new RTCSessionDescription(data))
			setIsAddOfferForAnswer(true)
		})
		return () => {
			off(offerRef)
		}
	}, [answerId, peerConnection])

	// Set ice candidates for offer
	useEffect(() => {
		if (!peerConnection || !offerId) {
			return
		}
		const db = getDatabase()
		const answerCandidates = ref(db, `calls/${offerId}/answerCandidates`)
		onChildAdded(answerCandidates, (snapshot) => {
			const data = snapshot.val()
			if (!data) {
				return
			}
			peerConnection.addIceCandidate(new RTCIceCandidate(data))
		})
	}, [offerId, peerConnection])

	// Set ice candidates for answer
	useEffect(() => {
		if (!peerConnection || !answerId) {
			return
		}
		const db = getDatabase()
		const offerCandidates = ref(db, `calls/${answerId}/offerCandidates`)
		onChildAdded(offerCandidates, (snapshot) => {
			const data = snapshot.val()
			if (!data) {
				return
			}
			peerConnection.addIceCandidate(new RTCIceCandidate(data))
		})
	}, [answerId, peerConnection])

	const link = useMemo(() => {
		if (!offerId) {
			return
		}
		return `${window.location.origin}/call/answer/${offerId}`
	}, [offerId])

	const onClickCopyLink = useCallback(async () => {
		if (!link) {
			return
		}
		const [errCopy] = await to(navigator.clipboard.writeText(link))
		if (errCopy) {
			console.error(errCopy)
			notyf.error("Failed to copy link")
			return
		}
		notyf.success("Copied link")
	}, [link])

	const onClickHangUp = useCallback(() => {
		setPeerConnection(null)
		setLocation("/")
	}, [setLocation])

	return (
		<div className="w-screen h-screen overflow-x-hidden">
			<div className="container px-4 py-8 mx-auto flex flex-col gap-y-12">
				<h1 className="text-3xl font-bold text-center">Call App</h1>
				{link && (
					<div className="flex  gap-x-4">
						<p className="bg-gray-100 px-4 py-2 flex-grow rounded truncate">
							{link}
						</p>
						<button
							className="bg-blue-600 px-4 py-2 text-white font-semibold rounded"
							onClick={onClickCopyLink}
						>
							Copy
						</button>
					</div>
				)}
				<div className="flex flex-col sm:flex-row gap-x-8 gap-y-4">
					<div className="flex-grow relative">
						<video
							id="localVideo"
							autoPlay={true}
							playsInline={true}
							muted={true}
							className="border aspect-video shadow w-full bg-gray-100"
							ref={refLocalVideo}
							controls={true}
						/>
						<div className="absolute top-1/2 left-1/2 -translate-x-1/2">
							Local video
						</div>
					</div>
					<div className="flex-grow relative">
						<video
							id="remoteVideo"
							autoPlay={true}
							playsInline={true}
							muted={true}
							controls={true}
							className="border aspect-video shadow w-full bg-gray-100"
							ref={refRemoteVideo}
						/>
						<div className="absolute top-1/2 left-1/2 -translate-x-1/2">
							Remote video
						</div>
					</div>
				</div>
				<button
					className="bg-red-600 px-4 py-2 text-white font-semibold rounded max-w-sm mx-auto"
					onClick={onClickHangUp}
				>
					Hang up
				</button>
			</div>
		</div>
	)
}
