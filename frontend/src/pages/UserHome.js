// Home page for users
function UserHome() {
    const username = localStorage.getItem("username") || "user";
    return (
        <div style={{ padding: 24 }}>
            <h1>User Portal</h1>
            <p>Welcome, {username}!!!</p>
            <p>Next: Submit Ticket + My Tickets</p>
        </div>
    )
}

export default UserHome;