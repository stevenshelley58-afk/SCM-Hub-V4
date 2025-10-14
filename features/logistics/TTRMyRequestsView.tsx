import React, { useEffect, useState } from 'react';
import type { User, LogisticsTask } from '../../types';
import { taskService } from '../../services/logistics/taskService';

export const TTRMyRequestsView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [tasks, setTasks] = useState<LogisticsTask[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await taskService.listTasks({});
                const mine = data.filter(t => t.requester?.name === currentUser.name);
                setTasks(mine);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [currentUser.name]);

    if (loading) return <div>Loading…</div>;

    if (tasks.length === 0) {
        return <div style={{ padding: 16 }}>No Toll requests yet.</div>;
    }

    return (
        <div style={{ padding: 16 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>My Toll Requests</h1>
            <div style={{ display: 'grid', gap: 12 }}>
                {tasks.map(t => (
                    <div key={t.task_id} style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8, background: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <strong>{t.task_number}</strong>
                            <span>{t.status}</span>
                        </div>
                        <div style={{ fontSize: 14, color: '#555' }}>{t.description}</div>
                        <div style={{ fontSize: 12, color: '#777' }}>From: {t.pickup?.location} → To: {t.dropoff?.location}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};


