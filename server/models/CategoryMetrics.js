const mongoose = require('mongoose');

const categoryMetricsSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  metrics: [{
    name: String,
    key: String,
    section: {
      type: String,
      enum: ['income', 'balance', 'cashflow']
    },
    unit: String,
    isDefault: Boolean
  }],
  createdAt: Date,
  updatedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('CategoryMetrics', categoryMetricsSchema);

