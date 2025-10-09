/**
 * Logistics Configuration View
 * MLC god-mode control panel for system configuration
 */

import React, { useState, useEffect } from 'react';
import { driverService } from '../../services/logistics/driverService';
import { vehicleService } from '../../services/logistics/vehicleService';
import { IntegrationHealthMonitor } from '../../components/logistics/IntegrationHealthMonitor';
import { materialsEventConsumer } from '../../services/integrations/materialsEventConsumer';
import type { Driver, Vehicle } from '../../types';

export const LogisticsConfigView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles' | 'integration' | 'settings'>('drivers');
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [driversData, vehiclesData] = await Promise.all([
                driverService.listDrivers(),
                vehicleService.listVehicles(),
            ]);
            setDrivers(driversData);
            setVehicles(vehiclesData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDriver = async () => {
        const name = prompt('Driver Name:');
        if (!name) return;
        
        const phone = prompt('Phone Number:');
        if (!phone) return;

        try {
            await driverService.createDriver({ name, phone });
            await loadData();
            alert('Driver added successfully!');
        } catch (error: any) {
            alert(`Error adding driver: ${error.message}`);
        }
    };

    const handleAddVehicle = async () => {
        const registration = prompt('Vehicle Registration:');
        if (!registration) return;
        
        const type = prompt('Vehicle Type (truck/van/forklift/crane/ute/other):');
        if (!type) return;

        try {
            await vehicleService.createVehicle({
                registration,
                vehicle_type: type as any,
            });
            await loadData();
            alert('Vehicle added successfully!');
        } catch (error: any) {
            alert(`Error adding vehicle: ${error.message}`);
        }
    };

    return (
        <div className="logistics-config-view" style={{ padding: '20px' }}>
            <h1>⚙️ Logistics Configuration</h1>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                    onClick={() => setActiveTab('drivers')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'drivers' ? '#0066cc' : '#f0f0f0',
                        color: activeTab === 'drivers' ? 'white' : 'black',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                    }}
                >
                    Drivers
                </button>
                <button
                    onClick={() => setActiveTab('vehicles')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'vehicles' ? '#0066cc' : '#f0f0f0',
                        color: activeTab === 'vehicles' ? 'white' : 'black',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                    }}
                >
                    Vehicles
                </button>
                <button
                    onClick={() => setActiveTab('integration')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'integration' ? '#0066cc' : '#f0f0f0',
                        color: activeTab === 'integration' ? 'white' : 'black',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                    }}
                >
                    Integration
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'settings' ? '#0066cc' : '#f0f0f0',
                        color: activeTab === 'settings' ? 'white' : 'black',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                    }}
                >
                    Settings
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Loading...</p>
                </div>
            ) : (
                <>
                    {activeTab === 'drivers' && (
                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px',
                            }}>
                                <h2>Drivers ({drivers.length})</h2>
                                <button
                                    onClick={handleAddDriver}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#44aa44',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    + Add Driver
                                </button>
                            </div>
                            
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                backgroundColor: 'white',
                            }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Name</th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Phone</th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Tasks Completed</th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Available</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {drivers.map(driver => (
                                        <tr key={driver.driver_id}>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{driver.name}</td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{driver.phone}</td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    backgroundColor: driver.status === 'active' ? '#44aa44' : '#888',
                                                    color: 'white',
                                                }}>
                                                    {driver.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{driver.tasks_completed}</td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                                                {driver.availability ? '✓' : '✗'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'vehicles' && (
                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px',
                            }}>
                                <h2>Vehicles ({vehicles.length})</h2>
                                <button
                                    onClick={handleAddVehicle}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#44aa44',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    + Add Vehicle
                                </button>
                            </div>
                            
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                backgroundColor: 'white',
                            }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Registration</th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Type</th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Make/Model</th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Tasks Completed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vehicles.map(vehicle => (
                                        <tr key={vehicle.vehicle_id}>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{vehicle.registration}</td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{vehicle.vehicle_type}</td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                                                {vehicle.make && vehicle.model ? `${vehicle.make} ${vehicle.model}` : '-'}
                                            </td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    backgroundColor: vehicle.status === 'available' ? '#44aa44' : '#888',
                                                    color: 'white',
                                                }}>
                                                    {vehicle.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{vehicle.total_tasks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'integration' && (
                        <div>
                            <h2>Materials Integration</h2>
                            <div style={{ marginBottom: '24px' }}>
                                <IntegrationHealthMonitor />
                            </div>
                            
                            <div style={{
                                backgroundColor: 'white',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                padding: '20px',
                            }}>
                                <h3 style={{ marginBottom: '12px' }}>Event-Driven Integration</h3>
                                <p style={{ color: '#666', marginBottom: '16px' }}>
                                    The Logistics App integrates with the Materials app via Redis Streams for real-time event communication.
                                </p>
                                
                                <h4 style={{ marginBottom: '8px' }}>Materials → Logistics Events:</h4>
                                <ul style={{ color: '#666', marginBottom: '16px' }}>
                                    <li>✅ MRF Ready for Collection (auto-creates logistics task)</li>
                                    <li>✅ MRF Updated (updates logistics task)</li>
                                    <li>✅ MRF Cancelled (cancels logistics task)</li>
                                    <li>✅ MRF On Hold (holds logistics task)</li>
                                </ul>
                                
                                <h4 style={{ marginBottom: '8px' }}>Logistics → Materials Events:</h4>
                                <ul style={{ color: '#666' }}>
                                    <li>✅ Task Accepted (driver assigned)</li>
                                    <li>✅ Task In Transit (materials picked up)</li>
                                    <li>✅ Task Delivered (POD captured)</li>
                                    <li>✅ Task Exception (issues reported)</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div>
                            <h2>System Settings</h2>
                            <div style={{
                                backgroundColor: 'white',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                padding: '20px',
                            }}>
                                <p>Coming soon: Request types, SLA configuration, site zones, notification rules, etc.</p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

