/**
 * Site Switcher Component
 * Allows switching between different sites with different configurations
 */

import React, { useState, useEffect } from 'react';
import { siteConfigManager } from '../config/siteConfig';
import type { SiteConfig } from '../config/siteConfig';

export const SiteSwitcher: React.FC = () => {
    const [currentSite, setCurrentSite] = useState(siteConfigManager.getCurrentSiteId());
    const [sites, setSites] = useState<SiteConfig[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        loadSites();
    }, []);

    const loadSites = () => {
        // Load available sites from localStorage
        const storedSites = localStorage.getItem('available_sites');
        if (storedSites) {
            const siteIds = JSON.parse(storedSites);
            const configs = siteIds.map((id: string) => siteConfigManager.getConfig(id));
            setSites(configs);
        } else {
            // Default sites
            const defaultSites = [
                { id: 'qld', name: 'Queensland', code: 'QLD' },
                { id: 'nsw', name: 'New South Wales', code: 'NSW' },
                { id: 'vic', name: 'Victoria', code: 'VIC' },
                { id: 'wa', name: 'Western Australia', code: 'WA' },
                { id: 'sa', name: 'South Australia', code: 'SA' },
            ];
            
            const configs = defaultSites.map(site => {
                const config = siteConfigManager.getConfig(site.id);
                config.site_name = site.name;
                config.site_code = site.code;
                return config;
            });
            
            setSites(configs);
            localStorage.setItem('available_sites', JSON.stringify(defaultSites.map(s => s.id)));
        }
    };

    const handleSiteChange = (siteId: string) => {
        siteConfigManager.setCurrentSite(siteId);
        setCurrentSite(siteId);
        setShowDropdown(false);
        
        // Trigger page reload to apply new config
        window.location.reload();
    };

    const currentConfig = sites.find(s => s.site_id === currentSite) || sites[0];

    if (!currentConfig) return null;

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                }}
            >
                <span style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: currentConfig.ui_config.branding.primary_color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '12px',
                }}>
                    {currentConfig.site_code}
                </span>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>Site</div>
                    <div style={{ fontWeight: 'bold' }}>{currentConfig.site_name}</div>
                </div>
                <span style={{ marginLeft: '8px' }}>▼</span>
            </button>

            {showDropdown && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setShowDropdown(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 999,
                        }}
                    />
                    
                    {/* Dropdown */}
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '4px',
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        minWidth: '250px',
                        zIndex: 1000,
                        maxHeight: '400px',
                        overflowY: 'auto',
                    }}>
                        <div style={{
                            padding: '12px',
                            borderBottom: '1px solid #eee',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            color: '#666',
                        }}>
                            SELECT SITE
                        </div>
                        {sites.map(site => (
                            <button
                                key={site.site_id}
                                onClick={() => handleSiteChange(site.site_id)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    border: 'none',
                                    backgroundColor: site.site_id === currentSite ? '#f0f8ff' : 'white',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    borderBottom: '1px solid #f0f0f0',
                                }}
                            >
                                <span style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    backgroundColor: site.ui_config.branding.primary_color,
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                }}>
                                    {site.site_code}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                        {site.site_name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                        {site.enabled ? '🟢 Active' : '🔴 Disabled'}
                                    </div>
                                </div>
                                {site.site_id === currentSite && (
                                    <span style={{ color: '#0066cc', fontSize: '18px' }}>✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

