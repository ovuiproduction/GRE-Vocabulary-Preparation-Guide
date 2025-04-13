import React from "react";

import "../css/NotFound.css";

import { useNavigate } from "react-router-dom";

export default function NotFound(){
    const navigate = useNavigate();
    
    return(
        <div className="notfound-cover">
            <div className="notfound-block">
                <h1>404 - Not Found</h1>
                <p>The page you're looking for doesn't exist.</p>
                <button className="notfound-button" onClick={() => navigate(-1)}>
                    Go Back
                </button>
            </div>
        </div>
    );
}