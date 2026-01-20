// Home page for users
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function TicketCard({t}) {
    const progress = t.progress ?? 0;

    return (
        <div style={{ border: "1px #ddd", padding: 12, marginBottom: 10 }}>
            <div style={{ diplay: "flex", justifyContent: "space-between"}}>
                <strong>#{t.id} - {t.title}</strong>
                <span>{t.status}</span>
            </div>
            <div style={{ marginTop: 6 }}>
                Priority: {t.priority}
            </div>
            <div style={{ marginTop: 8 }}>
                Progress: {progress}%
                <div style={{ height: 10, border: "1px solid #ccc", marginTop: 6, width: "100%" }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: "#4caf50"}}>
                    </div>
                </div>
            </div>
        </div>
    );
}



function UserHome() {
    const username = localStorage.getItem("username") || "user";
    
    const [tickets, setTickets] = useState([]);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadTickets() {
            setErr("");
            setLoading(true);

            const token = localStorage.getItem("token");
            if (!token) {
                setErr("Not logged in");
                setLoading(false);
                return;
            }

            try {
                const res = await fetch("http://127.0.0.1:5000/api/tickets/mine", {
                    headers: { Authorization: `Bearer ${token}` },
                })
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    setErr(data.error || "Failed to load tickets");
                    return;
                }

                setTickets(data.items || []);
            }   catch {
                setErr("Network error. Flask server may not be running.");
            } finally {
                setLoading(false);
            }
        }

        loadTickets();
    }, []);

    return (
        <div tyle={{ padding: 24 }}>
            <h1>User Portal</h1>

            <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                <div style={{ flex: "0 0 280px", border: "1px solid #ddd", padding: 12 }}>
                    <p><strong>Welcome, {username}</strong></p>
                    <p>
                        <Link to="/user/submit-ticket">Submit a new Ticket</Link>
                    </p>
                    <p style={{ flex: 1 , opacity: 0.8}}>
                        More functionality will be added here later
                    </p>
                </div>

                {/* Tickets list */}
                <div style={{ flex: 1 }}>
                    <h2 style={{ marginTop: 0 }}>My Tickets</h2>

                    {loading && <p>Loading ...</p>}
                    {err ** <p style={{ color: "crimson" }}>{err}</p>}

                    {!loading && !err && tickets.length === 0 && (
                        <p>You have no tickets yet! Submit one to get started!</p>
                    )}

                    {tickets.map((t) => (
                        <TicketCard key={t.id} t={t} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default UserHome;