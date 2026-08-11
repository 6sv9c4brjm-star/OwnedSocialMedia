import { Routes, Route } from "react-router-dom";
import Nav from "./components/Nav";
import Overview from "./pages/Overview";
import Links from "./pages/Links";
import LinkDetail from "./pages/LinkDetail";
import Theories from "./pages/Theories";

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/links" element={<Links />} />
        <Route path="/links/:linkId" element={<LinkDetail />} />
        <Route path="/theories" element={<Theories />} />
      </Routes>
    </>
  );
}
