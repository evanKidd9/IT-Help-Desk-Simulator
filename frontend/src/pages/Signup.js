import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Signup() {
    const nav = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setErr("");
        setMsg("");
        setLoading(true);

        try {
            const res = await fetch("http://127.0.0.1:5000/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({username, password }),
            });

            const data = await res.json().catch(() => ({}));

            if(!res.ok) {
                setErr(data.error || "Sign up failed");
                setLoading(false);
                return;
            }

            setMsg(data.message || "Account created!!! Redirecting to login ...");
            setLoading(false);

            // redirect after a short pause
            setTimeout(() => nav("/login"), 900);
        } catch {
            setErr("Network error! Check if the Flask server is running");
            setLoading(false);
        }
    }

    return (
        <div style={{ padding: 24, maxWidth: 420 }}>
            <h1>Create Account</h1>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 12}}>
                    <label>Username</label>
                    <input
                        style={{ width: "100%", padding: 8}}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"/>
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label>Password</label>
                    <input
                        style={{ width: "100%", padding: 8}}
                        value={password}
                        type="password"
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"/>
                </div>

                {err && <p style={{ color: "crimson" }}>{err}</p>}
                {msg && <p style={{ color: "green" }}>{msg}</p>}

                <button style={{ padding: "8px 12px" }} type="submit" disabled={loading}>
                    {loading ? "Creating ..." : "Sign up"}
                </button>
            </form>

            <p style={{ marginTop: 12 }}>
                Already have an account? <Link to="/login">Go back to login page</Link>
            </p>
        </div>
    );
}

export default Signup;