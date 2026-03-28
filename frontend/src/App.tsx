import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LoanManager from './pages/LoanManager';
import PaymentDetails from './pages/PaymentDetails';
import Forecast from './pages/Forecast';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/loans" element={<LoanManager />} />
        <Route path="/details" element={<PaymentDetails />} />
        <Route path="/forecast" element={<Forecast />} />
      </Routes>
    </Router>
  );
}

export default App;
