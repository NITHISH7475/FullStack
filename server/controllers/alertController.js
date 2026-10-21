const Alert = require('../models/Alert');

// GET all alerts, sorted by createdAt DESC. Support type and severity filters. Also support ?unreadOnly=true.
exports.getAlerts = async (req, res) => {
  try {
    const { type, severity, unreadOnly } = req.query;
    const filter = {};

    if (type) {
      filter.type = type;
    }

    if (severity) {
      filter.severity = severity;
    }

    if (unreadOnly === 'true' || unreadOnly === true) {
      filter.$or = [
        { isRead: false },
        { read: false }
      ];
    }

    const alerts = await Alert.find(filter).sort({ createdAt: -1 });
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET count of unread alerts
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Alert.countDocuments({
      $or: [
        { isRead: false },
        { read: false }
      ]
    });
    res.status(200).json({ unreadCount: count, count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT mark alert as read by ID
exports.markAsRead = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isRead: true, read: true },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.status(200).json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT mark all unread alerts as read
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Alert.updateMany(
      {
        $or: [
          { isRead: false },
          { read: false }
        ]
      },
      { isRead: true, read: true }
    );

    res.status(200).json({
      message: 'All unread alerts marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT mark alert as resolved by ID
exports.resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        isResolved: true,
        resolved: true,
        status: 'resolved',
        resolvedAt: new Date()
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.status(200).json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE alert by ID
exports.deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.status(200).json({ message: 'Alert deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
