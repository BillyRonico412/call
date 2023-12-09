import { Redirect, Route, Switch } from "wouter"
import { Home } from "./pages/Home"
import { Call } from "./pages/Call"

export const App = () => {
	return (
		<Switch>
			<Route path="/" component={Home} />
			<Route path="/call/offer/:id" component={Call} />
			<Route path="/call/answer/:id" component={Call} />
			<Redirect to="/" />
		</Switch>
	)
}
