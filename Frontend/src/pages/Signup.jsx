// import React, { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import "../css/auth.css";

// export default function Signup({setIsLogin}) {
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [phone, setPhone] = useState("");
//   const [Apartment, setApartment] = useState("");
//   const [state, setState] = useState("");
//   const [district, setDistrict] = useState("");
//   const [pincode, setPincode] = useState("");
//   const [error, setError] = useState("");

//   const handleSignup = async (e) => {
//     e.preventDefault();
//     setError("");

//     try {
//       const response = await fetch("http://localhost:5000/signup-user", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ name, email, phone, Apartment, district, state, pincode, password }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || "Signup failed");
//       }
//       setIsLogin(true);
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   return (
//     <div className="auth-root">
//     <div className="authContainer">
//       <h2>Sign Up</h2>
//       {error && <p className="error">{error}</p>}
//       <form onSubmit={handleSignup}>
//         <div className="form-group">
//           <label htmlFor="name">Full Name</label>
//           <input
//             id="name"
//             type="text"
//             placeholder="Enter your full name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             required
//           />
//         </div>
//         <div className="form-group-grid">
//         <div className="form-group">
//           <label htmlFor="email">Email</label>
//           <input
//             id="email"
//             type="email"
//             placeholder="Enter your email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//           />
//         </div>

//         <div className="form-group">
//           <label htmlFor="division">Phone</label>
//           <input
//             id="phone"
//             type="text"
//             placeholder="Enter your phone no."
//             value={phone}
//             onChange={(e) => setPhone(e.target.value)}
//             required
//           />
//         </div>
// </div>

// <div className="form-group-grid">
//         <div className="form-group">
//           <label htmlFor="Apartment">Apartment Name</label>
//           <input
//             id="Apartment"
//             type="text"
//             placeholder="Enter your Apartment Name"
//             value={Apartment}
//             onChange={(e) => setApartment(e.target.value)}
//             required
//           />
//         </div>

//         <div className="form-group">
//           <label htmlFor="district">District</label>
//           <input
//             id="district"
//             type="text"
//             placeholder="Enter your district"
//             value={district}
//             onChange={(e) => setDistrict(e.target.value)}
//             required
//           />
//         </div>
//         </div>

//         <div className="form-group-grid">
//         <div className="form-group">
//           <label htmlFor="state">State</label>
//           <input
//             id="state"
//             type="text"
//             placeholder="Enter your state"
//             value={state}
//             onChange={(e) => setState(e.target.value)}
//             required
//           />
//         </div>

//         <div className="form-group">
//           <label htmlFor="pincode">Pincode</label>
//           <input
//             id="pincode"
//             type="text"
//             placeholder="Enter your pincode"
//             value={pincode}
//             onChange={(e) => setPincode(e.target.value)}
//             required
//           />
//         </div>
// </div>
//         {/* <div className="form-group">
//           <label htmlFor="password">Password</label>
//           <input
//             id="password"
//             type="password"
//             placeholder="Enter your password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//           />
//         </div> */}

//         <button type="submit">Sign Up</button>
//       </form>
//       <p>
//         Already have an account? <Link onClick={()=>setIsLogin(true)}>Login</Link>
//       </p>
//     </div>
//     </div>
//   );
// }

import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Signup({ setIsLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5000/signup-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }
      setIsLogin(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-root">
      <div className="authContainer">
        <h2>Sign Up</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSignup}>
          <>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </>
          <button type="submit">Submit</button>
        </form>
        <p>
          Already have an account?{" "}
          <Link onClick={() => setIsLogin(true)}>Login</Link>
        </p>
      </div>
    </div>
  );
}
