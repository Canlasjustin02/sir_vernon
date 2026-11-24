import SystemSetting from '../../database/models/SystemSetting.js';
export const getSetting = async (key, defaultValue = null) => {
    const setting = await SystemSetting.findOne({ key }).lean();
    return setting ? setting.value : defaultValue;
};
export const updateSetting = async (key, value, description) => {
    const setting = await SystemSetting.findOneAndUpdate({ key }, { value, ...(description && { description }) }, { upsert: true, new: true });
    return setting;
};
export const getFeedbackSettings = async () => {
    const aiSummaryEnabled = await getSetting('ai_summary_enabled', true);
    return { aiSummaryEnabled };
};
