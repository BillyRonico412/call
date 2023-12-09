import { initializeApp } from "firebase/app"
import "notyf/notyf.min.css"
import { createRoot } from "react-dom/client"
import { App } from "./App.tsx"
import "./index.css"

initializeApp({
	apiKey: "AIzaSyDGGuCATfPhGyn9MrcCdjoqQl0W0cDuM28",
	authDomain: "call-app-b971a.firebaseapp.com",
	projectId: "call-app-b971a",
	storageBucket: "call-app-b971a.appspot.com",
	messagingSenderId: "364800720647",
	appId: "1:364800720647:web:6bb3f61e705aec97d68fa2",
	measurementId: "G-4PF40M0WBY",
	databaseURL:
		"https://call-app-b971a-default-rtdb.europe-west1.firebasedatabase.app/",
})

createRoot(document.getElementById("root") as HTMLElement).render(<App />)
