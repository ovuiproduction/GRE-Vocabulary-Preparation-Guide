import { useState } from "react";

import Login from "../pages/Login";
import Signup from "../pages/Signup";

const AuthComponentUser = ({onClose}) => {
    const [isLogin, setIsLogin] = useState(true);
    return (
        <div>
            {isLogin ? (
                <Login onClose={onClose} setIsLogin={setIsLogin} />
            ) : (
                <Signup onClose={onClose} setIsLogin={setIsLogin} />
            )}
        </div>
    );
};


export default{ AuthComponentUser};
