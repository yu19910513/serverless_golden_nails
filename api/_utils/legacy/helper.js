import fs from 'fs';
import handlebars from 'handlebars';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { DateTime } from 'luxon';
import { overlap } from './overlap.js';
import { getTechnicianAppointmentsByDay } from '../appointment.js';
// Get the ESM equivalents of __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Groups appointments into future, present, and past, and sorts each group.
 * (This function does not use the database and is unchanged)
 */
export const groupAppointments = (appointments) => {
    const today = now().startOf('day');

    const groupedAppointments = {
        future: [],
        present: [],
        past: [],
    };

    appointments.forEach((appointment) => {
        const appointmentDate = DateTime.fromISO(appointment.date, { zone: 'America/Los_Angeles' }).startOf('day');

        if (appointmentDate > today) {
            groupedAppointments.future.push(appointment);
        } else if (appointmentDate.equals(today)) {
            groupedAppointments.present.push(appointment);
        } else {
            groupedAppointments.past.push(appointment);
        }
    });

    // Sort each group by date (most recent first)
    Object.keys(groupedAppointments).forEach((group) => {
        groupedAppointments[group].sort((a, b) => {
            const dateA = DateTime.fromISO(a.date, { zone: 'America/Los_Angeles' });
            const dateB = DateTime.fromISO(b.date, { zone: 'America/Los_Angeles' });
            return dateB.toMillis() - dateA.toMillis(); // Descending order
        });
    });

    return groupedAppointments;
};

/**
 * Returns the current date and time in the 'America/Los_Angeles' timezone.
 * (This function does not use the database and is unchanged)
 */
export const now = () => {
    return DateTime.now().setZone('America/Los_Angeles');
};

/**
 * Checks if a technician is available to be assigned to a new appointment.
 *
 * This function performs two main checks:
 * 1. Verifies the technician is not marked as unavailable on that specific weekday.
 * 2. Fetches all of the technician's existing appointments for that day and checks
 * for any time conflicts using the `overlap` helper.
 *
 * @note This function was modified as part of a migration from a legacy MySQL
 * database to Postgres (Supabase) and now uses Supabase queries.
 *
 * @param {object} technician - The technician object.
 * @param {number} technician.id - The technician's unique ID.
 * @param {string} [technician.unavailability] - A comma-separated string of unavailable weekdays (e.g., "0,6").
 * @param {object} appointment - The appointment object to check.
 * @param {string} appointment.date - The appointment date in "YYYY-MM-DD" format.
 * @param {string} appointment.start_service_time - The start time in "HH:mm" format.
 * @param {Array<object>} appointment.Services - An array of service objects, each with a `time` property.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the technician can be assigned,
 * or `false` if they are unavailable or a time conflict exists.
 */
export const okayToAssign = async (technician, appointment) => {
    try {
        if (!technician) {
            console.log("Technician not found");
            return false;
        }

        if (!appointment || !appointment.date || !appointment.start_service_time) {
            console.log("Appointment or start time not found");
            return false;
        }

        const appointmentServices = appointment.Services;
        if (!appointmentServices || appointmentServices.length === 0) {
            console.log("No services found for the appointment");
            return false;
        }

        const startServiceTime = DateTime.fromISO(
            `${appointment.date}T${appointment.start_service_time}`,
            { zone: "America/Los_Angeles" }
        );
        if (!startServiceTime.isValid) {
            console.log("Invalid start service time");
            return false;
        }

        const totalServiceMinutes = appointmentServices.reduce(
            (sum, service) => sum + service.time,
            0
        );
        const endServiceTime = startServiceTime.plus({
            minutes: totalServiceMinutes,
        });

        const selectedWeekday = startServiceTime.weekday % 7; // Make Sunday = 0

        const unavailableDays = (technician.unavailability || "")
            .split(",")
            .map((day) => day.trim())
            .filter((day) => day !== "")
            .map(Number)
            .filter((day) => !isNaN(day) && day >= 0 && day <= 6);

        if (unavailableDays.includes(selectedWeekday)) {
            console.log("Technician is unavailable on this weekday");
            return false;
        }

        const existingAppointments = await getTechnicianAppointmentsByDay(
            technician.id,
            appointment.date
        );

        const hasConflict = overlap(
            existingAppointments,
            startServiceTime,
            endServiceTime
        );

        return !hasConflict;
    } catch (err) {
        console.error("Error in okayToAssign:", err);
        return false;
    }
};

/**
 * Validates whether the input is an email or a phone number.
 * (This function does not use the database and is unchanged)
 */
export const validateContactType = (input) => {
    const emailRegex = /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/;
    const phoneRegex = /^\+?\d{1,3}?[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;

    if (emailRegex.test(input)) {
        return "email";
    } else if (phoneRegex.test(input)) {
        return "phone";
    } else {
        return "invalid";
    }
};

/**
 * Generates HTML from a Handlebars template.
 * (This function does not use the database and is unchanged)
 */
export const generateHtmlFromTemplate = (data_object) => {
    try {
        // Resolve the template path
        const templatePath = path.resolve(__dirname, '../templates', data_object.template);

        // Check if the template file exists
        if (!fs.existsSync(templatePath)) {
            console.warn(`Template file ${data_object.template} not found.`);
            return null;
        }

        // Read the .handlebars file
        const templateFile = fs.readFileSync(templatePath, 'utf-8');

        // Compile the template using Handlebars
        const compiledTemplate = handlebars.compile(templateFile);

        // Return the populated template
        return compiledTemplate(data_object.content);
    } catch (error) {
        console.error("Error generating HTML from template:", error.message);
        throw error; // Re-throw the error after logging it
    }
};

// Re-export 'overlap' along with the other helpers
export { overlap };