import { NavLink } from "react-router-dom";

export default function Nav() {
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <NavLink to="/" className="nav-brand">Relationship Atlas</NavLink>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>Overview</NavLink>
          <NavLink to="/links" className={({ isActive }) => (isActive ? "active" : "")}>Relationships</NavLink>
          <NavLink to="/theories" className={({ isActive }) => (isActive ? "active" : "")}>Theories</NavLink>
        </div>
      </div>
    </nav>
  );
}
