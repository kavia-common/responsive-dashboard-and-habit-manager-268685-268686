import React from 'react';

// PUBLIC_INTERFACE
export function DashboardPage() {
    /** Dashboard landing page (placeholder). */
    return (
        <div>
            <h1 className="pageTitle">Dashboard</h1>
            <p className="pageHint">Overview of today’s habits, streaks, and quick check-ins.</p>

            <div className="grid2">
                <div className="card">
                    <div className="cardTitle">Today</div>
                    <div className="mutedText">Quick summary will appear here.</div>
                </div>
                <div className="card">
                    <div className="cardTitle">Streaks</div>
                    <div className="mutedText">Progress streaks will appear here.</div>
                </div>
            </div>
        </div>
    );
}
