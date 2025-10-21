import fs from 'fs';
import handlebars from 'handlebars';
import path from 'path';
import { DateTime } from 'luxon';
import { overlap } from './overlap.js';
import { supabase } from '../supabaseClient.js';

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
 * Determines whether a technician can be assigned to a given appointment
 * without overlapping existing appointments.
 *
 * (CONVERTED TO USE SUPABASE)
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

        // Renamed to avoid conflict with 'services' table name
        const appointmentServices = appointment.Services;
        if (!appointmentServices || appointmentServices.length === 0) {
            console.log("No services found for the appointment");
            return false;
        }

        // Parse start time correctly with Luxon
        const startServiceTime = DateTime.fromISO(`${appointment.date}T${appointment.start_service_time}`, { zone: "America/Los_Angeles" });
        if (!startServiceTime.isValid) {
            console.log("Invalid start service time");
            return false;
        }

        // Calculate end time
        const totalServiceMinutes = appointmentServices.reduce((sum, service) => sum + service.time, 0);
        const endServiceTime = startServiceTime.plus({ minutes: totalServiceMinutes });

        // Luxon weekday: Monday = 1, Sunday = 7
        const selectedWeekday = startServiceTime.weekday % 7; // Make Sunday = 0

        // Parse technician's unavailability (array of numbers 0-6)
        const unavailableDays = (technician.unavailability || "")
            .split(",")
            .map(day => day.trim())
            .filter(day => day !== "")
            .map(Number)
            .filter(day => !isNaN(day) && day >= 0 && day <= 6);

        if (unavailableDays.includes(selectedWeekday)) {
            console.log("Technician is unavailable on this weekday");
            return false;
        }

        // --- CONVERTED QUERY ---
        // Fetch existing appointments for the technician on that date
        // We join 'appointments_technicians' to filter by technician.id
        // We join 'appointments_services' and then 'services' to get service times
        const { data: existingAppointments, error } = await supabase
            .from('appointments')
            .select(`
        *,
        services ( time ),
        technicians!inner ( id )
      `)
            .eq('date', appointment.date)
            .eq('technicians.id', technician.id) // Filter by technician ID
            .or('note.is.null,note.neq.deleted'); // Filter out "deleted" notes

        if (error) {
            console.error("Error fetching existing appointments:", error);
            throw error; // Let the catch block handle it
        }
        // --- END CONVERTED QUERY ---

        // Check for overlap — PASS Luxon objects directly
        // NOTE: The `overlap` function must be compatible with the data
        // structure returned by Supabase, which is:
        // [ { ..., services: [ { time: 30 }, { time: 60 } ] }, ... ]
        const hasConflict = overlap(existingAppointments, startServiceTime, endServiceTime);

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
        const templatePath = path.resolve(__dirname, 'templates', data_object.template);

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