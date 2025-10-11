import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Main from "./components/layout/Main";
import ProblemPage from "./components/problems/ProblemPage";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/problems/:id" element={<ProblemPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
