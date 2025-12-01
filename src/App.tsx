import { Route, Routes } from "react-router-dom";
import MainPage from "./pages";
import Paymentpage from "./pages/payment";
import Successpage from "./pages/success";

function App() {
  return (
    <>
        <Routes>
          <Route path="/" element={<MainPage/>}/>
          <Route path="/payment" element={<Paymentpage/>}/>
          <Route path="/success" element={<Successpage/>}/>
        </Routes>
    </>
  );
}

export default App;
