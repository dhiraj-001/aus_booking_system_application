export const generateSlipHtml = (booking: any, allocations: any[], user: any): string => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const bookingId = (booking.booking_id || booking._id).slice(-6).toUpperCase();

  const allocationsHtml = allocations.map(alloc => `
    <div style="background-color: #F8FAFC; padding: 12px; border-radius: 6px; border: 1px solid #000; margin-bottom: 8px;">
      <p style="font-weight: bold; margin: 0; font-size: 14px;">${alloc.resource_id?.name || "Unknown Resource"} ${alloc.resource_id?.roomNo ? `- Room ${alloc.resource_id.roomNo}` : ''}</p>
      <p style="margin: 4px 0 0 0; font-size: 11px; color: #475569;">${alloc.resource_id?.buildingName || alloc.resource_id?.category?.replace("_", " ").toUpperCase()}</p>
    </div>
  `).join('');

  const paymentHtml = booking.payments ? `
    <div style="display: flex; gap: 20px;">
      <div style="flex: 1; border-right: 1px solid #E2E8F0; padding-right: 20px;">
        <p class="label" style="color: #000;">Phase 1: Booking Fee</p>
        <div style="display: flex; justify-content: space-between; margin-top: 8px;">
          <div>
            <p class="label" style="font-size: 8px; color: #64748B;">Amount</p>
            <p class="value" style="font-size: 12px;">₹${booking.payments.booking_fee?.amount || "0"}.00</p>
          </div>
          <div>
            <p class="label" style="font-size: 8px; color: #64748B;">Status</p>
            <p class="value" style="font-size: 10px; color: ${booking.payments.booking_fee?.status === 'completed' ? '#059669' : '#D97706'};">${booking.payments.booking_fee?.status === 'completed' ? 'PAID' : 'PENDING'}</p>
          </div>
        </div>
      </div>
      <div style="flex: 1;">
        <p class="label" style="color: #000;">Phase 2: Check-In Fee</p>
        <div style="display: flex; justify-content: space-between; margin-top: 8px;">
          <div>
            <p class="label" style="font-size: 8px; color: #64748B;">Amount</p>
            <p class="value" style="font-size: 12px;">₹${booking.payments.check_in_fee?.amount || "0"}.00</p>
          </div>
          <div>
            <p class="label" style="font-size: 8px; color: #64748B;">Status</p>
            <p class="value" style="font-size: 10px; color: ${booking.payments.check_in_fee?.status === 'completed' ? '#059669' : '#D97706'};">${booking.payments.check_in_fee?.status === 'completed' ? 'PAID' : 'PENDING'}</p>
          </div>
        </div>
      </div>
    </div>
  ` : `
    <div style="display: flex; justify-content: space-between;">
      <div>
        <p class="label" style="color: #000;">Total Paid</p>
        <p class="value" style="font-size: 14px;">₹${booking.payment_amount || "0"}.00</p>
      </div>
      <div>
        <p class="label" style="color: #000;">Transaction ID</p>
        <p class="value" style="font-size: 12px; font-family: monospace;">${booking.transaction_id || "N/A"}</p>
      </div>
      <div>
        <p class="label" style="color: #000;">Status</p>
        <p class="value" style="font-size: 12px; color: ${booking.payment_status === 'completed' ? '#059669' : '#D97706'};">${booking.payment_status === 'completed' ? 'PAID IN FULL' : 'PENDING'}</p>
      </div>
    </div>
  `;

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #0F172A; }
          .header { text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 24px; margin-bottom: 24px; }
          .title { font-size: 24px; font-weight: bold; text-transform: uppercase; margin: 0; }
          .subtitle { font-size: 14px; color: #64748B; margin-top: 8px; }
          .grid { display: flex; flex-wrap: wrap; margin-bottom: 24px; gap: 20px; }
          .col { flex: 1; min-width: 200px; }
          .label { font-size: 10px; font-weight: bold; color: #64748B; text-transform: uppercase; margin: 0 0 4px 0; }
          .value { font-size: 16px; font-weight: bold; margin: 0; }
          .sub-value { font-size: 12px; color: #64748B; margin-top: 4px; }
          .box { border: 1px solid #000; padding: 16px; border-radius: 8px; }
          .instructions { border: 1px dashed #000; padding: 16px; border-radius: 8px; margin-top: 32px; background-color: #FFFBEB; }
          .instructions-title { font-size: 12px; font-weight: bold; color: #92400E; text-transform: uppercase; margin: 0 0 8px 0; }
          .instructions ul { margin: 0; padding-left: 20px; font-size: 11px; color: #78350F; line-height: 1.5; }
          .signature { margin-top: 60px; text-align: right; }
          .sig-line { width: 150px; border-bottom: 1px solid #000; display: inline-block; margin-bottom: 8px; }
          .sig-text { font-size: 10px; font-weight: bold; color: #64748B; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">University Resource Management</h1>
          <p class="subtitle">Official Consolidated Allotment Slip</p>
        </div>

        <div class="grid">
          <div class="col">
            <div style="margin-bottom: 16px;">
              <p class="label">Booking Reference</p>
              <p class="value" style="color: #4F46E5;">${bookingId}</p>
            </div>
            <div>
              <p class="label">Booked By</p>
              <p class="value" style="font-size: 14px;">${user?.name || 'N/A'}</p>
              <p class="sub-value">${user?.uni_id || 'N/A'} | ${user?.dept || 'N/A'}</p>
            </div>
          </div>
          
          <div class="col box">
            <p class="label" style="border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-bottom: 12px; color: #000;">Schedule Details</p>
            <div style="display: flex; justify-content: space-between;">
              <div>
                <p class="label" style="color: #000;">Check-In / Start</p>
                <p class="value" style="font-size: 14px;">${formatDate(booking.check_in_time)}</p>
                <p class="sub-value" style="color: #000;">${formatTime(booking.check_in_time)}</p>
              </div>
              <div>
                <p class="label" style="color: #000;">Check-Out / End</p>
                <p class="value" style="font-size: 14px;">${formatDate(booking.check_out_time)}</p>
                <p class="sub-value" style="color: #000;">${formatTime(booking.check_out_time)}</p>
              </div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 32px;">
          <p class="label" style="border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-bottom: 16px; font-size: 12px; color: #000;">
            Allocated Resources (${allocations.length})
          </p>
          ${allocationsHtml || '<p style="font-size: 12px; font-style: italic;">No resources allocated.</p>'}
          ${booking.remark ? `<p style="font-size: 12px; font-weight: bold; color: #059669; margin-top: 12px;">Note: ${booking.remark}</p>` : ''}
        </div>

        <div class="box">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding-bottom: 12px; margin-bottom: 16px;">
            <p class="label" style="margin: 0; color: #000;">Payment Details</p>
            <p style="font-size: 14px; font-weight: bold; margin: 0;">Total Billed: ₹${booking.payment_amount || "0"}.00</p>
          </div>
          ${paymentHtml}
        </div>

        <div class="instructions">
          <p class="instructions-title">Important Instructions:</p>
          <ul>
            <li>Carry this slip (Digital/Physical) and University ID card for entry.</li>
            <li>This allotment is non-transferable and verified via Transaction ID.</li>
            <li>The payment is non-refundable unless canceled by the administration.</li>
          </ul>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 60px;">
          <div>
            <p style="font-size: 10px; color: #4F46E5; font-style: italic;">Digitally Secured Transaction</p>
          </div>
          <div style="text-align: center;">
            <div class="sig-line"></div>
            <br />
            <span class="sig-text">Issuing Authority</span>
          </div>
        </div>

      </body>
    </html>
  `;
};
