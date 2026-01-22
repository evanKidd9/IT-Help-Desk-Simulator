// Login Page
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Login() {
    const nav = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setErr("");

        try {
            const res = await fetch("http://127.0.0.1:5000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({username, password}),
            });

            const data = await res.json();

            if(!res.ok) {
                setErr(data.error || "Login failed");
                return;
            }

            // store tokens for API calls
            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.role);
            localStorage.setItem("username", data.username);
            localStorage.setItem("user_id", data.id);

            // route based on role
            if (data.role === "tech") nav("/tech");
            else nav("/user");
        } catch (e2) {
            setErr("Network error!! Check if Flask server is running");
        }
    }

    return (
        <div style={{ padding: 24, maxWidth: 420 }}>
            <h1>Login Page</h1>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label>Username</label>
                    <input
                        style={{ width: "100%", padding: 8 }}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                    />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label>Password</label>
                    <input
                        style={{ width: "100%", padding: 8 }}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                    />    
                </div>

                {err && <p style={{color: "crimson" }}>{err}</p>}

                <button style={{ padding: "8px 12px" }} type="submit">Sign In</button>
            </form>

            <p style={{ marginTop: 12 }}>
                You new here? <Link to="/signup">Create an account!</Link>
            </p>
        </div>
    );
}

export default Login;