import { useState } from "react";

import Login from "../pages/Login";
import Signup from "../pages/Signup";

const AuthComponentUser = ({isClose}) => {
    const [isLogin, setIsLogin] = useState(true);
    return (
        <div>
            {isLogin ? (
                <Login setIsLogin={setIsLogin} />
            ) : (
                <Signup setIsLogin={setIsLogin} />
            )}
        </div>
    );
};


export default{ AuthComponentUser};
