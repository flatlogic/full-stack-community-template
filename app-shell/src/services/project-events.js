const axios = require('axios');
const config = require('../config.js');

class ProjectEventsService {
    /**
     * Sends a project event to the Rails backend
     *
     * @param {string} eventType - Type of the event
     * @param {object} payload - Event payload data
     * @param {object} options - Additional options
     * @param {string} [options.conversationId] - Optional conversation ID
     * @param {boolean} [options.isError=false] - Whether this is an error event
     * @returns {Promise<object>} - Response from the webhook
     */
    static async sendEvent(eventType, payload = {}, options = {}) {
        try {
            console.log(`[DEBUG] Sending project event: ${eventType}`);

            const webhookUrl = `https://flatlogic.com/projects/events_webhook`;

            // Prepare the event data
            const eventData = {
                project_uuid: config.project_uuid,
                event_type: eventType,
                payload: {
                    ...payload,
                    message: `[APP] ${payload.message}`,
                    is_error: options.isError || false,
                    system_message: true,
                    is_command_info: true
                }
            };

            // Add conversation ID if provided
            if (options.conversationId) {
                eventData.conversation_id = options.conversationId;
            }

            const headers = {
                'Content-Type': 'application/json',
                'x-project-uuid': config.project_uuid
            };

            console.log(`[DEBUG] Event data: ${JSON.stringify(eventData)}`);

            const response = await axios.post(webhookUrl, eventData, { headers });

            console.log(`[DEBUG] Event sent successfully, status: ${response.status}`);
            return response.data;
        } catch (error) {
            console.error(`[ERROR] Failed to send project event: ${error.message}`);
            if (error.response) {
                console.error(`[ERROR] Response status: ${error.response.status}`);
                console.error(`[ERROR] Response data: ${JSON.stringify(error.response.data)}`);
            }

            // Don't throw the error, just return a failed status
            // This prevents errors in the event service from breaking app functionality
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = ProjectEventsService;