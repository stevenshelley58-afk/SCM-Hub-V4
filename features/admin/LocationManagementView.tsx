import React, { useState, useMemo } from 'react';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { ICONS } from '../../components/ui/Icons';
import { mockLocations, addLocation, updateLocation, deleteLocation } from '../../services/api';
import type { DeliveryLocation } from '../../types/index';

interface LocationManagementViewProps {
  navigate: (view: string) => void;
}

export const LocationManagementView: React.FC<LocationManagementViewProps> = ({ navigate }) => {
  const [locations, setLocations] = useState(mockLocations);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<DeliveryLocation | null>(null);
  const [formData, setFormData] = useState<Partial<DeliveryLocation>>({
    building: '',
    floor: '',
    room: '',
    contactPerson: '',
    contactPhone: '',
    deliveryInstructions: '',
    isActive: true
  });

  // Filter locations based on search
  const filteredLocations = useMemo(() => {
    if (!searchTerm) return locations;
    const term = searchTerm.toLowerCase();
    return locations.filter(loc =>
      loc.building.toLowerCase().includes(term) ||
      loc.floor?.toLowerCase().includes(term) ||
      loc.room?.toLowerCase().includes(term) ||
      loc.contactPerson?.toLowerCase().includes(term) ||
      loc.fullAddress.toLowerCase().includes(term)
    );
  }, [locations, searchTerm]);

  const handleOpenModal = (location?: DeliveryLocation) => {
    if (location) {
      setEditingLocation(location);
      setFormData(location);
    } else {
      setEditingLocation(null);
      setFormData({
        building: '',
        floor: '',
        room: '',
        contactPerson: '',
        contactPhone: '',
        deliveryInstructions: '',
        isActive: true
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingLocation(null);
    setFormData({
      building: '',
      floor: '',
      room: '',
      contactPerson: '',
      contactPhone: '',
      deliveryInstructions: '',
      isActive: true
    });
  };

  const handleSave = () => {
    if (!formData.building) {
      alert('Building is required');
      return;
    }

    if (editingLocation) {
      // Update existing location
      const updated = updateLocation(editingLocation.id, formData);
      setLocations(prev => prev.map(loc => loc.id === editingLocation.id ? updated : loc));
    } else {
      // Add new location
      const newLocation = addLocation(formData);
      setLocations(prev => [...prev, newLocation]);
    }

    handleCloseModal();
  };

  const handleDelete = (location: DeliveryLocation) => {
    if (window.confirm(`Are you sure you want to delete "${location.fullAddress}"?`)) {
      deleteLocation(location.id);
      setLocations(prev => prev.filter(loc => loc.id !== location.id));
    }
  };

  const handleToggleActive = (location: DeliveryLocation) => {
    const updated = updateLocation(location.id, { isActive: !location.isActive });
    setLocations(prev => prev.map(loc => loc.id === location.id ? updated : loc));
  };

  const columns = [
    {
      accessorKey: 'building',
      header: 'Building',
      cell: ({ row, value }: any) => (
        <div className="font-medium text-gray-900">{value}</div>
      )
    },
    {
      accessorKey: 'floor',
      header: 'Floor',
      cell: ({ value }: any) => value || '-'
    },
    {
      accessorKey: 'room',
      header: 'Room',
      cell: ({ value }: any) => value || '-'
    },
    {
      accessorKey: 'contactPerson',
      header: 'Contact',
      cell: ({ value }: any) => value || '-'
    },
    {
      accessorKey: 'contactPhone',
      header: 'Phone',
      cell: ({ value }: any) => value || '-'
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ value }: any) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      enableFiltering: false,
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleOpenModal(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <ICONS.PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleToggleActive(row)}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded"
            title={row.isActive ? 'Deactivate' : 'Activate'}
          >
            {row.isActive ? (
              <ICONS.CheckCircleIcon className="h-4 w-4 text-green-600" />
            ) : (
              <ICONS.XCircleIcon className="h-4 w-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <ICONS.TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Locations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage delivery locations for material requests
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ICONS.PlusIcon className="h-5 w-5 mr-2" />
          Add Location
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <ICONS.BuildingIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Locations</p>
              <p className="text-2xl font-semibold text-gray-900">{locations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <ICONS.CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-semibold text-gray-900">
                {locations.filter(l => l.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">
              <ICONS.XCircleIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Inactive</p>
              <p className="text-2xl font-semibold text-gray-900">
                {locations.filter(l => !l.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <ICONS.SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search locations by building, floor, room, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <Table
          data={filteredLocations}
          columns={columns}
          uniqueId="id"
        />
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingLocation ? 'Edit Location' : 'Add New Location'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Building <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.building || ''}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Admin Building, Workshop A"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Floor
                </label>
                <input
                  type="text"
                  value={formData.floor || ''}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Ground, Level 2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room
                </label>
                <input
                  type="text"
                  value={formData.room || ''}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 201, Storeroom B"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contactPerson || ''}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone || ''}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Instructions
              </label>
              <textarea
                value={formData.deliveryInstructions || ''}
                onChange={(e) => setFormData({ ...formData, deliveryInstructions: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Special instructions for delivery..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive !== false}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active (available for selection in requests)
              </label>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {editingLocation ? 'Update' : 'Add'} Location
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

