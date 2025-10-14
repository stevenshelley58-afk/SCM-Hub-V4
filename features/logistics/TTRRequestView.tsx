import React, { useState } from 'react';
import type { User, LogisticsTaskType, LogisticsTaskPriority, LogisticsLocation } from '../../types';
import { taskService } from '../../services/logistics/taskService';
import { getActiveWhitelistEntries, isWhitelisted } from '../../services/whitelistService';

export const TTRRequestView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [type, setType] = useState<LogisticsTaskType>('delivery');
    const [priority, setPriority] = useState<LogisticsTaskPriority>('normal');
    const [description, setDescription] = useState('');
    const [requestedDate, setRequestedDate] = useState<string>('');
    const [pickup, setPickup] = useState<string>('');
    const [dropoff, setDropoff] = useState<string>('');
    const [contactName, setContactName] = useState<string>('');
    const [contactPhone, setContactPhone] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const locations = getActiveWhitelistEntries('location');

    const handleSubmit = async () => {
        setError(null);
        setSuccess(null);

        if (!description.trim() || !requestedDate || !pickup || !dropoff) {
            setError('Please complete all required fields');
            return;
        }

        // Simple requestor whitelist check (email or name)
        const requestorKey = (currentUser.name || '').toLowerCase().includes('@') ? currentUser.name : `${currentUser.name}@company.com`;
        const allowed = isWhitelisted('requestor', requestorKey) || isWhitelisted('requestor', (currentUser as any).email || '');
        if (!allowed) {
            setError('You are not on the approved requestor list. Please contact MLC.');
            return;
        }

        setSubmitting(true);
        try {
            await taskService.createTask({
                type,
                priority,
                requester: { name: currentUser.name, department: 'N/A', phone: contactPhone },
                description,
                pickup: { location: pickup },
                dropoff: { location: dropoff },
                requested_date: new Date(requestedDate).toISOString()
            });
            setSuccess('Request submitted successfully');
            setDescription('');
            setRequestedDate('');
            setPickup('');
            setDropoff('');
            setContactName('');
            setContactPhone('');
        } catch (e: any) {
            setError(e.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>New Toll Task Request</h1>
            {error && <div style={{ background: '#ffdddd', padding: 12, borderRadius: 8, marginBottom: 12 }}>{error}</div>}
            {success && <div style={{ background: '#ddffdd', padding: 12, borderRadius: 8, marginBottom: 12 }}>{success}</div>}

            <div style={{ display: 'grid', gap: 12 }}>
                <label>
                    <div>Type</div>
                    <select value={type} onChange={e => setType(e.target.value as LogisticsTaskType)}>
                        <option value="delivery">Delivery</option>
                        <option value="collection">Collection</option>
                        <option value="adhoc">Ad-hoc</option>
                    </select>
                </label>

                <label>
                    <div>Description</div>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
                </label>

                <label>
                    <div>Required Date/Time</div>
                    <input type="datetime-local" value={requestedDate} onChange={e => setRequestedDate(e.target.value)} />
                </label>

                <label>
                    <div>Pickup Location</div>
                    <select value={pickup} onChange={e => setPickup(e.target.value)}>
                        <option value="">Select</option>
                        {locations.map(l => (
                            <option key={l.value} value={l.label}>{l.label}</option>
                        ))}
                    </select>
                </label>

                <label>
                    <div>Dropoff Location</div>
                    <select value={dropoff} onChange={e => setDropoff(e.target.value)}>
                        <option value="">Select</option>
                        {locations.map(l => (
                            <option key={l.value} value={l.label}>{l.label}</option>
                        ))}
                    </select>
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label>
                        <div>Contact Name</div>
                        <input value={contactName} onChange={e => setContactName(e.target.value)} />
                    </label>
                    <label>
                        <div>Contact Phone</div>
                        <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
                    </label>
                </div>

                <button onClick={handleSubmit} disabled={submitting || !description || !requestedDate || !pickup || !dropoff}
                    style={{ padding: '12px 16px', background: submitting ? '#888' : '#0066cc', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                    {submitting ? 'Submitting…' : 'Submit Request'}
                </button>
            </div>
        </div>
    );
};


