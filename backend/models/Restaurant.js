const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: '' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  gstNumber: { type: String, default: '' },
  logo: { type: String, default: '' },
  upiId: { type: String, default: '' }, // UPI ID for restaurant payments (e.g. restaurant@upi)
  taxSettings: {
    cgst: { type: Number, default: 2.5 },
    sgst: { type: Number, default: 2.5 },
    serviceCharge: { type: Number, default: 0 }
  },
  geofence: {
    enabled: { type: Boolean, default: false },
    latitude: { type: Number },
    longitude: { type: Number },
    radius: { type: Number, default: 50 } // radius in meters
  }
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);
