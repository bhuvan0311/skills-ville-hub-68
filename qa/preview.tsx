import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Workspace from "../src/pages/erp/Workspace";
import "../src/index.css";

createRoot(document.getElementById("root")!).render(
  <>
    <div
      style={{
        position: "fixed",
        bottom: 12,
        left: 12,
        zIndex: 100,
        background: "#fff8d8",
        color: "#785b17",
        border: "1px solid #dbc87e",
        padding: "9px 13px",
        borderRadius: 8,
        fontSize: 11,
        boxShadow: "0 2px 10px #0001",
      }}
    >
      Design preview · Sample records · Saving is disabled
    </div>
    <BrowserRouter>
      <Routes>
        <Route path="/erp/:module" element={<Workspace />} />
        <Route path="*" element={<Navigate to="/erp/overview" replace />} />
      </Routes>
    </BrowserRouter>
  </>,
);
