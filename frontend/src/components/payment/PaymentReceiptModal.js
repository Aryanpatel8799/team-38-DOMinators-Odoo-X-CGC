import React, { useRef } from 'react';
import { XMarkIcon, DocumentArrowDownIcon, PrinterIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { PAYMENT_STATUS_LABELS } from '../../utils/constants';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

const PaymentReceiptModal = ({ isOpen, onClose, payment }) => {
  const receiptRef = useRef();

  const downloadPDF = async () => {
    try {
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`roadguard-receipt-${payment._id}.pdf`);
      toast.success('Receipt downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to download receipt');
    }
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    const receiptHTML = receiptRef.current.innerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt - ${payment._id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .receipt-container { max-width: 600px; margin: 0 auto; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .text-lg { font-size: 1.125rem; }
            .text-2xl { font-size: 1.5rem; }
            .text-sm { font-size: 0.875rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .border-t { border-top: 1px solid #e5e7eb; }
            .border-b { border-bottom: 1px solid #e5e7eb; }
            .pt-4 { padding-top: 1rem; }
            .pb-4 { padding-bottom: 1rem; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .gap-4 { gap: 1rem; }
            .bg-gray-50 { background-color: #f9fafb; }
            .p-4 { padding: 1rem; }
            .rounded { border-radius: 0.375rem; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            ${receiptHTML}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      success: 'text-green-600 bg-green-100',
      failed: 'text-red-600 bg-red-100',
      refunded: 'text-gray-600 bg-gray-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-secondary-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-secondary-900">Payment Receipt</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={printReceipt}
                icon={<PrinterIcon className="h-4 w-4" />}
              >
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadPDF}
                icon={<DocumentArrowDownIcon className="h-4 w-4" />}
              >
                Download
              </Button>
              <button
                onClick={onClose}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Receipt Content */}
          <div className="p-6">
            <div ref={receiptRef} className="bg-white">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">R</span>
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-secondary-900">RoadGuard</h1>
                <p className="text-sm text-secondary-600">Payment Receipt</p>
              </div>

              {/* Receipt Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-bold text-secondary-900 mb-2">Receipt Details</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-secondary-600">Receipt ID:</span>
                      <span className="ml-2 font-mono">{payment._id}</span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Date:</span>
                      <span className="ml-2">{formatDateTime(payment.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Payment Method:</span>
                      <span className="ml-2">Razorpay</span>
                    </div>
                    {payment.razorpayPaymentId && (
                      <div>
                        <span className="text-secondary-600">Transaction ID:</span>
                        <span className="ml-2 font-mono">{payment.razorpayPaymentId}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-secondary-900 mb-2">Customer Details</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-secondary-600">Name:</span>
                      <span className="ml-2">{payment.customer?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Email:</span>
                      <span className="ml-2">{payment.customer?.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Phone:</span>
                      <span className="ml-2">{payment.customer?.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="mb-6">
                <h3 className="font-bold text-secondary-900 mb-2">Service Details</h3>
                <div className="bg-secondary-50 rounded p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-secondary-600">Service Type:</span>
                      <span className="ml-2">
                        {payment.serviceRequest?.issueType?.replace('_', ' ')
                          .replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Priority:</span>
                      <span className="ml-2 capitalize">
                        {payment.serviceRequest?.priority || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Vehicle:</span>
                      <span className="ml-2">
                        {payment.serviceRequest?.vehicleInfo?.model || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary-600">License Plate:</span>
                      <span className="ml-2">
                        {payment.serviceRequest?.vehicleInfo?.plate || 'N/A'}
                      </span>
                    </div>
                    {payment.serviceRequest?.mechanic && (
                      <>
                        <div>
                          <span className="text-secondary-600">Mechanic:</span>
                          <span className="ml-2">{payment.serviceRequest.mechanic.name}</span>
                        </div>
                        <div>
                          <span className="text-secondary-600">Mechanic Phone:</span>
                          <span className="ml-2">{payment.serviceRequest.mechanic.phone}</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {payment.serviceRequest?.description && (
                    <div className="mt-3 pt-3 border-t border-secondary-200">
                      <span className="text-secondary-600">Description:</span>
                      <p className="mt-1 text-sm">{payment.serviceRequest.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="border-t border-secondary-200 pt-4">
                <h3 className="font-bold text-secondary-900 mb-4">Payment Summary</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Service Amount:</span>
                    <span>{formatCurrency(payment.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Tax (0%):</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Processing Fee:</span>
                    <span>₹0.00</span>
                  </div>
                </div>
                
                <div className="border-t border-secondary-200 mt-4 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-secondary-900">Total Amount:</span>
                    <span className="text-lg font-bold text-secondary-900">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-secondary-600">Payment Status:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                    {PAYMENT_STATUS_LABELS[payment.status]}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-secondary-200 text-center">
                <p className="text-sm text-secondary-600 mb-2">
                  Thank you for using RoadGuard!
                </p>
                <p className="text-xs text-secondary-500">
                  For support, contact us at support@roadguard.com or call +91-XXXX-XXXXXX
                </p>
                <p className="text-xs text-secondary-500 mt-2">
                  This is a computer-generated receipt and does not require a signature.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceiptModal;
