import React, { useState } from 'react';
import {
    getAllFeatureFlags,
    toggleFeature,
    updateRolloutPercentage,
    updateFeatureEnvironment,
    addFeatureFlag,
    deleteFeatureFlag,
    FeatureFlag
} from '../../services/featureToggleService';

export const FeatureTogglesView: React.FC = () => {
    const [features, setFeatures] = useState<FeatureFlag[]>(getAllFeatureFlags());
    const [showAddModal, setShowAddModal] = useState(false);
    const [newFeature, setNewFeature] = useState({
        key: '',
        name: '',
        description: '',
        enabled: false,
        environment: 'development' as FeatureFlag['environment'],
        rolloutPercentage: 0
    });
    
    const refreshFeatures = () => {
        setFeatures(getAllFeatureFlags());
    };
    
    const handleToggle = (key: string) => {
        toggleFeature(key);
        refreshFeatures();
    };
    
    const handleRolloutChange = (key: string, percentage: number) => {
        updateRolloutPercentage(key, percentage);
        refreshFeatures();
    };
    
    const handleEnvironmentChange = (key: string, env: FeatureFlag['environment']) => {
        updateFeatureEnvironment(key, env);
        refreshFeatures();
    };
    
    const handleAddFeature = () => {
        if (!newFeature.key || !newFeature.name) {
            alert('Please fill in required fields');
            return;
        }
        
        const success = addFeatureFlag(newFeature);
        if (success) {
            setShowAddModal(false);
            setNewFeature({
                key: '',
                name: '',
                description: '',
                enabled: false,
                environment: 'development',
                rolloutPercentage: 0
            });
            refreshFeatures();
        } else {
            alert('Feature key already exists');
        }
    };
    
    const handleDelete = (key: string) => {
        if (confirm(`Delete feature flag "${key}"?`)) {
            deleteFeatureFlag(key);
            refreshFeatures();
        }
    };
    
    const getEnvironmentColor = (env: string) => {
        switch (env) {
            case 'production': return 'bg-green-100 text-green-800';
            case 'staging': return 'bg-yellow-100 text-yellow-800';
            case 'development': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Feature Toggles</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Enable/disable features per environment with gradual rollout
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Feature Flag
                </button>
            </div>
            
            {/* Feature List */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feature</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Environment</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rollout %</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {features.map((feature) => (
                                <tr key={feature.key}>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{feature.name}</div>
                                        <div className="text-xs text-gray-500">{feature.description}</div>
                                        <div className="text-xs text-gray-400 mt-1 font-mono">{feature.key}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={feature.environment}
                                            onChange={(e) => handleEnvironmentChange(feature.key, e.target.value as FeatureFlag['environment'])}
                                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getEnvironmentColor(feature.environment)}`}
                                        >
                                            <option value="all">All</option>
                                            <option value="development">Development</option>
                                            <option value="staging">Staging</option>
                                            <option value="production">Production</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={feature.rolloutPercentage}
                                                onChange={(e) => handleRolloutChange(feature.key, parseInt(e.target.value))}
                                                className="w-24"
                                            />
                                            <span className="text-sm font-semibold text-gray-900 w-12">
                                                {feature.rolloutPercentage}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                            <div
                                                className="bg-blue-600 h-1.5 rounded-full"
                                                style={{ width: `${feature.rolloutPercentage}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={feature.enabled}
                                                onChange={() => handleToggle(feature.key)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            <span className="ml-3 text-sm font-medium text-gray-900">
                                                {feature.enabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </label>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => handleDelete(feature.key)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Add Feature Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Add Feature Flag</h3>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Feature Key * (lowercase, underscores)
                                    </label>
                                    <input
                                        type="text"
                                        value={newFeature.key}
                                        onChange={(e) => setNewFeature({ ...newFeature, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                                        placeholder="e.g., new_feature_name"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Feature Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newFeature.name}
                                        onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                                        placeholder="e.g., New Feature Name"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={newFeature.description}
                                        onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                                        placeholder="Describe what this feature does..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        rows={3}
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Environment
                                        </label>
                                        <select
                                            value={newFeature.environment}
                                            onChange={(e) => setNewFeature({ ...newFeature, environment: e.target.value as FeatureFlag['environment'] })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="development">Development</option>
                                            <option value="staging">Staging</option>
                                            <option value="production">Production</option>
                                            <option value="all">All</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Rollout % (0-100)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={newFeature.rolloutPercentage}
                                            onChange={(e) => setNewFeature({ ...newFeature, rolloutPercentage: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={newFeature.enabled}
                                        onChange={(e) => setNewFeature({ ...newFeature, enabled: e.target.checked })}
                                        className="rounded border-gray-300"
                                    />
                                    <label className="ml-2 text-sm text-gray-700">
                                        Enable immediately
                                    </label>
                                </div>
                            </div>
                            
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddFeature}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Add Feature
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
