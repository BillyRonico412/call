import { nanoid } from "nanoid"
import { useCallback } from "react"
import { useLocation } from "wouter"

export const Home = () => {
	const [, setLocation] = useLocation()
	const onClickCreateCall = useCallback(() => {
		const callId = nanoid()
		setLocation(`/call/offer/${callId}`)
	}, [setLocation])
	return (
		<div className="w-screen h-screen flex">
			<div className="container px-4 py-8 mx-auto my-auto flex flex-col items-center gap-y-8">
				<h1 className="text-3xl font-bold text-center">Call App</h1>
				<button
					className=" bg-blue-600 px-4 py-2 text-white font-semibold rounded max-w-sm"
					onClick={onClickCreateCall}
				>
					Create a new call
				</button>
			</div>
		</div>
	)
}
