import { Route, Routes } from "react-router-dom";
import MainPage from "./pages";
import Paymentpage from "./pages/payment";

function App() {
  return (
    <>
        <Routes>
          <Route path="/" element={<MainPage/>}/>
          <Route path="/payment" element={<Paymentpage/>}/>
        </Routes>
    </>
  );
}

export default App;
