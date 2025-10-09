import React, { useState } from 'react';
import { ICONS } from './Icons';

interface DeliveryConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    rating?: number;
    feedback?: string;
    hasIssue: boolean;
    issueDescription?: string;
    issuePhotos?: string[];
  }) => void;
  requestId: string;
}

export const DeliveryConfirmationModal: React.FC<DeliveryConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  requestId
}) => {
  const [step, setStep] = useState<'choice' | 'confirm' | 'issue'>('choice');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [feedback, setFeedback] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issuePhotos, setIssuePhotos] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep('choice');
    setRating(undefined);
    setFeedback('');
    setIssueDescription('');
    setIssuePhotos([]);
  };

  const handleConfirmDelivery = () => {
    onConfirm({
      rating,
      feedback,
      hasIssue: false
    });
    handleReset();
  };

  const handleReportIssue = () => {
    onConfirm({
      hasIssue: true,
      issueDescription,
      issuePhotos
    });
    handleReset();
  };

  const handlePhotoCapture = () => {
    // Simulate photo capture (in real app, would use camera API)
    const mockPhoto = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150'%3E%3Crect fill='%23ddd' width='200' height='150'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23666' font-family='Arial' font-size='14'%3EPhoto ${issuePhotos.length + 1}%3C/text%3E%3C/svg%3E`;
    setIssuePhotos([...issuePhotos, mockPhoto]);
  };

  const handleRemovePhoto = (index: number) => {
    setIssuePhotos(issuePhotos.filter((_, i) => i !== index));
  };

  // Step 1: Choice - Confirm or Report Issue
  if (step === 'choice') {
    return React.createElement('div', {
      className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
      onClick: (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
      }
    },
      React.createElement('div', {
        className: 'bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6'
      }, [
        // Header
        React.createElement('div', {
          key: 'header',
          className: 'flex items-center justify-between mb-6'
        }, [
          React.createElement('div', { key: 'title', className: 'flex items-center gap-3' }, [
            React.createElement('span', { key: 'icon', className: 'text-3xl' }, '📦'),
            React.createElement('h2', { key: 'text', className: 'text-xl font-semibold text-gray-800' }, 'Delivery Received?')
          ]),
          React.createElement('button', {
            key: 'close',
            onClick: onClose,
            className: 'text-gray-400 hover:text-gray-600'
          }, ICONS.close)
        ]),

        // Content
        React.createElement('div', { key: 'content', className: 'mb-6' }, [
          React.createElement('p', {
            key: 'desc',
            className: 'text-gray-600 mb-6'
          }, `Request ${requestId} shows as delivered. Please confirm you've received the materials.`),

          React.createElement('div', { key: 'buttons', className: 'space-y-3' }, [
            React.createElement('button', {
              key: 'confirm',
              onClick: () => setStep('confirm'),
              className: 'w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2'
            }, [
              React.createElement('span', { key: 'icon' }, '✅'),
              React.createElement('span', { key: 'text' }, 'Yes, Confirm Delivery')
            ]),

            React.createElement('button', {
              key: 'issue',
              onClick: () => setStep('issue'),
              className: 'w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium flex items-center justify-center gap-2'
            }, [
              React.createElement('span', { key: 'icon' }, '⚠️'),
              React.createElement('span', { key: 'text' }, 'Report an Issue')
            ])
          ])
        ])
      ])
    );
  }

  // Step 2: Confirm Delivery with Rating
  if (step === 'confirm') {
    return React.createElement('div', {
      className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
      onClick: (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
          handleReset();
          onClose();
        }
      }
    },
      React.createElement('div', {
        className: 'bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6'
      }, [
        // Header
        React.createElement('div', {
          key: 'header',
          className: 'flex items-center justify-between mb-6'
        }, [
          React.createElement('h2', { key: 'title', className: 'text-xl font-semibold text-gray-800' }, 'Confirm Delivery'),
          React.createElement('button', {
            key: 'close',
            onClick: () => {
              handleReset();
              onClose();
            },
            className: 'text-gray-400 hover:text-gray-600'
          }, ICONS.close)
        ]),

        // Content
        React.createElement('div', { key: 'content', className: 'space-y-6 mb-6' }, [
          // Rating
          React.createElement('div', { key: 'rating' }, [
            React.createElement('label', {
              key: 'label',
              className: 'block text-sm font-medium text-gray-700 mb-2'
            }, 'Rate your experience (optional)'),
            React.createElement('div', {
              key: 'stars',
              className: 'flex gap-2'
            }, [1, 2, 3, 4, 5].map(star =>
              React.createElement('button', {
                key: star,
                onClick: () => setRating(star),
                className: `text-3xl ${rating && star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`
              }, '⭐')
            ))
          ]),

          // Feedback
          React.createElement('div', { key: 'feedback' }, [
            React.createElement('label', {
              key: 'label',
              className: 'block text-sm font-medium text-gray-700 mb-2'
            }, 'Additional feedback (optional)'),
            React.createElement('textarea', {
              key: 'input',
              value: feedback,
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedback(e.target.value),
              placeholder: 'Any comments about the delivery or materials?',
              className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none',
              rows: 3
            })
          ])
        ]),

        // Actions
        React.createElement('div', { key: 'actions', className: 'flex gap-3' }, [
          React.createElement('button', {
            key: 'back',
            onClick: () => setStep('choice'),
            className: 'flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50'
          }, 'Back'),
          React.createElement('button', {
            key: 'confirm',
            onClick: handleConfirmDelivery,
            className: 'flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium'
          }, 'Confirm Delivery')
        ])
      ])
    );
  }

  // Step 3: Report Issue
  if (step === 'issue') {
    return React.createElement('div', {
      className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
      onClick: (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
          handleReset();
          onClose();
        }
      }
    },
      React.createElement('div', {
        className: 'bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto'
      }, [
        // Header
        React.createElement('div', {
          key: 'header',
          className: 'flex items-center justify-between mb-6 sticky top-0 bg-white pb-2'
        }, [
          React.createElement('h2', { key: 'title', className: 'text-xl font-semibold text-gray-800' }, 'Report Issue'),
          React.createElement('button', {
            key: 'close',
            onClick: () => {
              handleReset();
              onClose();
            },
            className: 'text-gray-400 hover:text-gray-600'
          }, ICONS.close)
        ]),

        // Content
        React.createElement('div', { key: 'content', className: 'space-y-6 mb-6' }, [
          // Issue Description
          React.createElement('div', { key: 'description' }, [
            React.createElement('label', {
              key: 'label',
              className: 'block text-sm font-medium text-gray-700 mb-2'
            }, 'Describe the issue *'),
            React.createElement('textarea', {
              key: 'input',
              value: issueDescription,
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setIssueDescription(e.target.value),
              placeholder: 'e.g., Missing items, damaged materials, wrong quantities...',
              className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none',
              rows: 4
            })
          ]),

          // Photo Upload
          React.createElement('div', { key: 'photos' }, [
            React.createElement('label', {
              key: 'label',
              className: 'block text-sm font-medium text-gray-700 mb-2'
            }, 'Photos (optional)'),
            React.createElement('button', {
              key: 'add-btn',
              onClick: handlePhotoCapture,
              className: 'w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 text-gray-600'
            }, [
              React.createElement('span', { key: 'icon', className: 'text-xl' }, '📷'),
              React.createElement('span', { key: 'text' }, 'Add Photo')
            ]),

            // Photo Grid
            issuePhotos.length > 0 && React.createElement('div', {
              key: 'grid',
              className: 'mt-3 grid grid-cols-3 gap-2'
            }, issuePhotos.map((photo, index) =>
              React.createElement('div', {
                key: index,
                className: 'relative group'
              }, [
                React.createElement('img', {
                  key: 'img',
                  src: photo,
                  alt: `Issue photo ${index + 1}`,
                  className: 'w-full h-24 object-cover rounded border border-gray-300'
                }),
                React.createElement('button', {
                  key: 'remove',
                  onClick: () => handleRemovePhoto(index),
                  className: 'absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'
                }, '×')
              ])
            ))
          ])
        ]),

        // Actions
        React.createElement('div', { key: 'actions', className: 'flex gap-3 sticky bottom-0 bg-white pt-2' }, [
          React.createElement('button', {
            key: 'back',
            onClick: () => setStep('choice'),
            className: 'flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50'
          }, 'Back'),
          React.createElement('button', {
            key: 'submit',
            onClick: handleReportIssue,
            disabled: !issueDescription.trim(),
            className: `flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 font-medium ${!issueDescription.trim() ? 'opacity-50 cursor-not-allowed' : ''}`
          }, 'Submit Issue')
        ])
      ])
    );
  }

  return null;
};

export default DeliveryConfirmationModal;
