import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function SubmitTicket() {
    const nav = useNavigate();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("Low");

    const [err, setErr] = useState("");
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setErr("");
        setMsg("");

        if (title.trim().length < 5) {
            setErr("Title must be at least 5 characters");
            return;
        }

        if (description.trim().length < 10) {
            setErr("Description must be at least 10 characters");
            return;
        }

        const token = localStorage.getItem("token");
        if(!token) {
            setErr("You must the logged in to submit a ticket");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("http://127.0.0.1:5000/api/tickets", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    priority
                }),
            })

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setErr(data.error || "Failed to create ticket.");
                return;
            }

        // redirect back to home after a moment
        setTimeout(() => nav("/user"), 900);
        } catch {
            setErr("Network error. Check if Flask server is running");
        } finally {
            setLoading(false);
        }
    }
    
    return (
        <div style={{ padding: 24, maxWidth: 600 }}>
            <h1>Submit Ticket</h1>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label>Title</label>
                    <input 
                        style={{ width: "100%", padding: 8 }}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Name the issue"
                    />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label>Description</label>
                    <textarea 
                        style={{ width: "100%", padding: 8, minHeight: 120 }}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the issue in detail"
                    />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label>Priority</label>
                    <select 
                        style={{ width: "100%", padding: 8 }}
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                    >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                    </select>
                    <p>Priority is subject to change by the technician</p>
                </div>

                {err && <p style={{ color: "crimson"}}>{err}</p>}
                {msg && <p style={{ color: "green"}}>{msg}</p>}

                <button type="submit" disabled={loading} style={{ padding: "8px 12px" }}>
                    {loading ? "Submitting..." : "Create Ticket"}
                </button>
            </form>

            <p style={{ marginTop: 12 }}>
                <Link to="/user">Back to user Portal</Link>
            </p>
        </div>
    );
}

export default SubmitTicket;