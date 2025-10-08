
import React, { useState, useCallback, useRef } from 'react';
import { Toast } from '../../components/ui/Toast';
import { supabase } from '../../services/supabaseClient';

// --- Sub-component for Data Ingestion ---
const DataIngestionView = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: undefined });
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
        } else {
            setSelectedFile(null);
        }
    };

    const handleUpload = useCallback(async () => {
        if (!selectedFile) {
            setToast({ show: true, message: 'Please select a file first.', type: 'error' });
            return;
        }

        setIsLoading(true);
        setToast({ show: false, message: '', type: undefined });
        
        try {
            const fileContent = await selectedFile.text();
            
            // Call the 'ingest-master-data' Supabase Edge Function
            const { data, error } = await supabase.functions.invoke('ingest-master-data', {
                body: fileContent,
                headers: {
                    'Content-Type': 'text/csv'
                }
            });
            
            if (error) {
                throw new Error(error.message || 'The function returned an error.');
            }

            setToast({ show: true, message: data?.message || "✅ Success! Data ingested.", type: 'success' });
            setSelectedFile(null); 
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

        } catch (error) {
            setToast({ show: true, message: `🔥 Error! ${error.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [selectedFile]);

    return (
        React.createElement(React.Fragment, null,
            toast.show && React.createElement(Toast, { message: toast.message, type: toast.type, onClose: () => setToast({ show: false, message: '', type: undefined }) }),
            React.createElement('h1', { className: 'text-2xl font-bold text-gray-800' }, 'Master Data Ingestion'),
            React.createElement('p', { className: 'mt-2 text-gray-500 max-w-2xl' }, 
                "Upload the master mdtest.csv file from SharePoint here. This will run the hourly sync process on-demand and populate the WorkOrderMaterialLines table with the latest data."
            ),
            React.createElement('div', { className: 'mt-8 border-t border-gray-200 pt-6' },
                React.createElement('div', { className: 'flex flex-col space-y-4 max-w-xl' },
                     React.createElement('div', { className: 'flex-1' },
                        React.createElement('label', { htmlFor: 'file-upload', className: 'sr-only' }, 'Choose a file'),
                        React.createElement('input', { 
                            id: 'file-upload',
                            ref: fileInputRef, 
                            type: 'file', 
                            className: 'block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer',
                            accept: '.csv, text/csv',
                            onChange: handleFileChange 
                        })
                    ),
                    React.createElement('div', { className: 'flex-shrink-0' },
                        React.createElement('button', {
                            onClick: handleUpload,
                            disabled: isLoading || !selectedFile,
                            className: 'flex items-center justify-center w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        },
                            isLoading ? 
                                React.createElement('svg', { className: "animate-spin -ml-1 mr-3 h-5 w-5 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24" }, 
                                    React.createElement('circle', { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
                                    React.createElement('path', { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
                                ) : 
                                React.createElement('span', { className: 'mr-2', 'aria-hidden': true }, '🚀'),
                            isLoading ? 'Ingesting...' : 'Upload and Ingest Data'
                        )
                    )
                )
            )
        )
    );
};


// --- Main Panel View ---
const SectionPlaceholder = ({ sectionName }) => {
    return React.createElement(React.Fragment, null,
        React.createElement('h1', { className: 'text-2xl font-bold text-gray-800' }, sectionName),
        React.createElement('p', { className: 'mt-2 text-gray-500' }, `Configuration and management tools for ${sectionName} would be displayed here.`)
    );
};

export const AdminControlPanelView = () => {
    const [activeSection, setActiveSection] = useState('Data Inspector');

    const menuItems = ['Users & Scopes', 'List Manager', 'Workflow Rules', 'Notification Engine', 'Data Inspector'];

    const renderContent = () => {
        switch (activeSection) {
            case 'Data Inspector':
                return React.createElement(DataIngestionView, null);
            default:
                return React.createElement(SectionPlaceholder, { sectionName: activeSection });
        }
    };

    return React.createElement('div', { className: 'flex h-full bg-white rounded-xl border border-gray-200 overflow-hidden' },
        React.createElement('div', { className: 'w-64 border-r border-gray-200 p-4 flex-shrink-0' },
            React.createElement('h2', { className: 'text-lg font-semibold text-gray-800 mb-4' }, 'Admin Settings'),
            React.createElement('nav', { className: 'space-y-1' },
                menuItems.map(item => React.createElement('button', {
                    key: item,
                    onClick: () => setActiveSection(item),
                    className: `w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${activeSection === item ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`
                }, item))
            )
        ),
        React.createElement('div', { className: 'flex-1 p-8 overflow-y-auto' },
            renderContent()
        )
    );
};
