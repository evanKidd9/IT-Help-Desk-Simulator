// Home page for users
import { Link } from "react-router-dom";

function UserHome() {
    const username = localStorage.getItem("username") || "user";
    return (
        <div style={{ padding: 24 }}>
            <h1>User Portal</h1>
            <p>Welcome, {username}!!!</p>
            <p>Next: Submit Ticket + My Tickets</p>
            <p>
                <Link to="/user/submit-ticket">Submit a Ticket</Link>
            </p>
        </div>
    )
}

export default UserHome;