import "./App.css"
import { BrowserRouter } from "react-router-dom"
import Naviguation from "./naviguation"
import ThemeToggle from "./composants/ThemeToggle"

function App(){
    return(
        <BrowserRouter>
            <ThemeToggle />
            <Naviguation />
        </BrowserRouter>
    )
}

export default App;
