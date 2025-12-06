const mongoose = require('mongoose');

const metricDefinitionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  section: {
    type: String,
    required: true,
    enum: ['income', 'balance', 'cashflow']
  },
  unit: {
    type: String,
    default: 'USD'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: String
}, {
  timestamps: true
});

module.exports = mongoose.model('MetricDefinition', metricDefinitionSchema);

