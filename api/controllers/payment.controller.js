// controllers/payment.controller.js

import Razorpay from 'razorpay';
import { v4 as uuidv4 } from 'uuid';
import Payment from '../models/payment.model.js';

const razorpay = new Razorpay({
  key_id:"rzp_test_27gndSTbnRjv7h",
  key_secret:"zN0OvIaBvdg9havbygF5rvIY",
});

export const createPayment = async (req, res, next) => {
    try {
      const amount = req.body.amount;
      const paymentId = req.body.paymentId;
  
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
      }
  
      const options = {
        amount: amount * 100,
        currency: 'INR',
        receipt: paymentId, // Use paymentId for receipt
        payment_capture: 1,
      };
  
      razorpay.orders.create(options, async (err, order) => {
        if (err) {
          console.error('Failed to create payment order:', err);
          return res.status(500).json({ message: 'Failed to create payment order' });
        }
  
        try {
          const payment = new Payment({
            orderId: order.id,
            amount,
          });
          await payment.save();
        } catch (error) {
          console.error('Failed to save payment information:', error);
          return res.status(500).json({ message: 'Failed to save payment information' });
        }
  
        res.status(200).json({ orderId: order.id });
      });
    } catch (error) {
      next(error);
    }
  };