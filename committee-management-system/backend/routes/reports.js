const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Committee = require('../models/Committee');
const Member = require('../models/Member');
const Payment = require('../models/Payment');
const { authenticate, authorize } = require('../middleware/auth');

// Generate member statement PDF
router.post('/member-statement', authenticate, async (req, res) => {
  try {
    const { memberId } = req.body;
    const member = await Member.findById(memberId).populate('committeeId');
    const payments = await Payment.find({ memberId }).sort({ year: 1, month: 1 });
    
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=member-statement-${member.name}.pdf`);
    
    doc.pipe(res);
    
    // Header
    doc.fontSize(20).text('Committee Management System', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text('Member Payment Statement', { align: 'center' });
    doc.moveDown();
    
    // Member Info
    doc.fontSize(12).text(`Name: ${member.name}`);
    doc.text(`Phone: ${member.phone}`);
    doc.text(`Email: ${member.email || 'N/A'}`);
    doc.text(`Committee: ${member.committeeName}`);
    doc.text(`Committee Order: ${member.committeeOrder}${getOrdinal(member.committeeOrder)}`);
    doc.moveDown();
    
    // Payment History Table
    doc.fontSize(14).text('Payment History', { underline: true });
    doc.moveDown(0.5);
    
    // Table headers
    let y = doc.y;
    doc.fontSize(10);
    doc.text('Month', 50, y);
    doc.text('Due Date', 150, y);
    doc.text('Amount', 250, y);
    doc.text('Status', 350, y);
    doc.text('Late Fee', 450, y);
    
    doc.moveDown();
    y = doc.y;
    doc.lineWidth(0.5).moveTo(50, y).lineTo(550, y).stroke();
    doc.moveDown();
    
    // Table rows
    for (const payment of payments) {
      y = doc.y;
      doc.text(`${payment.month}/${payment.year}`, 50, y);
      doc.text(new Date(payment.dueDate).toLocaleDateString(), 150, y);
      doc.text(`₹${payment.amount}`, 250, y);
      doc.text(payment.status.toUpperCase(), 350, y);
      doc.text(`₹${payment.lateFee}`, 450, y);
      doc.moveDown();
    }
    
    // Summary
    doc.moveDown();
    const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const totalLateFees = payments.reduce((sum, p) => sum + p.lateFee, 0);
    
    doc.fontSize(12);
    doc.text(`Total Paid: ₹${totalPaid}`, { align: 'right' });
    doc.text(`Total Late Fees: ₹${totalLateFees}`, { align: 'right' });
    doc.text(`Pending Amount: ₹${member.pendingAmount}`, { align: 'right' });
    
    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate committee summary PDF
router.post('/committee-summary', authenticate, authorize(['super_admin', 'moderator']), async (req, res) => {
  try {
    const { committeeId } = req.body;
    const committee = await Committee.findById(committeeId);
    const members = await Member.find({ committeeId }).sort({ committeeOrder: 1 });
    
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=committee-summary-${committee.name}.pdf`);
    
    doc.pipe(res);
    
    // Header
    doc.fontSize(20).text('Committee Management System', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(`Committee Summary: ${committee.name}`, { align: 'center' });
    doc.moveDown();
    
    // Committee Info
    doc.fontSize(12);
    doc.text(`Start Date: ${new Date(committee.startDate).toLocaleDateString()}`);
    doc.text(`End Date: ${new Date(committee.endDate).toLocaleDateString()}`);
    doc.text(`Total Amount: ₹${committee.totalAmount}`);
    doc.text(`Monthly Installment: ₹${committee.monthlyInstallment}`);
    doc.text(`Status: ${committee.status.toUpperCase()}`);
    doc.moveDown();
    
    // Members Table
    doc.fontSize(14).text('Members List', { underline: true });
    doc.moveDown(0.5);
    
    let y = doc.y;
    doc.fontSize(10);
    doc.text('#', 50, y);
    doc.text('Name', 100, y);
    doc.text('Phone', 250, y);
    doc.text('Order', 400, y);
    doc.text('Total Paid', 480, y);
    doc.text('Status', 580, y);
    
    doc.moveDown();
    y = doc.y;
    doc.lineWidth(0.5).moveTo(50, y).lineTo(700, y).stroke();
    doc.moveDown();
    
    for (const member of members) {
      y = doc.y;
      doc.text(member.committeeOrder.toString(), 50, y);
      doc.text(member.name, 100, y);
      doc.text(member.phone, 250, y);
      doc.text(`${member.committeeOrder}${getOrdinal(member.committeeOrder)}`, 400, y);
      doc.text(`₹${member.totalPaid}`, 480, y);
      doc.text(member.status.toUpperCase(), 580, y);
      doc.moveDown();
    }
    
    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

module.exports = router;