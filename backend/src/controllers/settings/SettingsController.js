const SystemSettings = require('../../models/settings/SystemSettings');

class SettingsController {
    static async getAll(req, res) {
        try {
            const settings = await SystemSettings.getAll();
            res.json({ success: true, data: settings });
        } catch (error) {
            console.error('Get settings error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async updateSettings(req, res) {
        try {
            const { settings } = req.body;

            if (!Array.isArray(settings) || settings.length === 0) {
                return res.status(400).json({ success: false, message: 'settings array is required' });
            }

            // Validate each entry has key and value
            for (const s of settings) {
                if (!s.key || s.value === undefined) {
                    return res.status(400).json({ success: false, message: 'Each setting must have key and value' });
                }
                // Only allow numeric values for known numeric settings
                const numericKeys = [
                    'leave_annual_days', 'leave_sick_days', 'leave_casual_days',
                    'leave_maternity_days', 'leave_paternity_days', 'leave_unpaid_days',
                    'max_public_holidays', 'working_hours_per_day', 'working_days_per_week',
                ];
                if (numericKeys.includes(s.key)) {
                    const num = parseInt(s.value);
                    if (isNaN(num) || num < 0) {
                        return res.status(400).json({
                            success: false,
                            message: `Invalid value for ${s.key}: must be a non-negative number`
                        });
                    }
                }
            }

            await SystemSettings.bulkUpdate(settings);
            const updated = await SystemSettings.getAll();
            res.json({ success: true, message: 'Settings saved successfully', data: updated });
        } catch (error) {
            console.error('Update settings error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = SettingsController;
