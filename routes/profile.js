import express from 'express';
import { UserProfile } from '../models/UserProfile.js';
import { Address } from '../models/Address.js';
import { PaymentMethod } from '../models/PaymentMethod.js';
import { User } from '../models/User.js';

const router = express.Router();

// GET user profile, addresses & payment methods
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let profile = await UserProfile.findOne({ userId });
    
    // If profile does not exist yet, lookup user registration details
    if (!profile) {
      let realUser = null;
      try {
        realUser = await User.findById(userId);
      } catch (e) {}

      profile = new UserProfile({
        userId,
        name: realUser ? realUser.name : 'Patron Account',
        email: realUser ? realUser.email : 'patron@ratnaya.com',
        phone: realUser ? realUser.phone || '' : '',
        dob: '1995-01-01',
        anniversary: '2020-01-01'
      });
      await profile.save();
    }

    const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
    const paymentMethods = await PaymentMethod.find({ userId }).sort({ isDefault: -1, createdAt: -1 });

    res.json({
      profile,
      addresses,
      paymentMethods
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile data', error: error.message });
  }
});

// PUT update user profile details
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      req.body,
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (error) {
    res.status(400).json({ message: 'Error updating profile', error: error.message });
  }
});

// POST add new address
router.post('/:userId/addresses', async (req, res) => {
  try {
    const { userId } = req.params;
    const newAddress = new Address({ ...req.body, userId });
    await newAddress.save();
    res.status(201).json(newAddress);
  } catch (error) {
    res.status(400).json({ message: 'Error adding address', error: error.message });
  }
});

// DELETE address
router.delete('/:userId/addresses/:addressId', async (req, res) => {
  try {
    const { addressId } = req.params;
    await Address.findByIdAndDelete(addressId);
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting address', error: error.message });
  }
});

// POST add new payment method
router.post('/:userId/payments', async (req, res) => {
  try {
    const { userId } = req.params;
    const newPayment = new PaymentMethod({ ...req.body, userId });
    await newPayment.save();
    res.status(201).json(newPayment);
  } catch (error) {
    res.status(400).json({ message: 'Error adding payment method', error: error.message });
  }
});

// DELETE payment method
router.delete('/:userId/payments/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    await PaymentMethod.findByIdAndDelete(paymentId);
    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting payment method', error: error.message });
  }
});

export default router;
