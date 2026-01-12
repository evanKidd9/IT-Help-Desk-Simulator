// Home page for technicians
function TechHome() {
    const username = localStorage.getItem("username") || "user";
    return (
        <div style={{ padding: 24 }}>
            <h1>Technician Dashboard</h1>
            <p>Welcome, {username}!!!</p>
            <p>Next: View Tickets + Update Status</p>
        </div>
    )
}

export default TechHome;