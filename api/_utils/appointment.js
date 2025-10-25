import { supabase } from './supabaseClient.js';
import { DateTime } from 'luxon';
import { overlap, okayToAssign, groupAppointments } from './legacy/helper.js';
import { ClientError, OverlapError, NotFoundError, ConflictError } from './errors.js';

/**
 * Creates a new appointment with associated technicians and services.
 * Handles all validation, conflict checking, and database inserts.
 *
 * @param {object} options - The appointment creation data.
 * @param {number} options.customer_id - ID of the customer.
 * @param {string} options.date - The date of the appointment (YYYY-MM-DD).
 * @param {string} options.start_service_time - The start time (HH:mm).
 * @param {number|number[]} options.technician_id - A single ID or array of IDs for technicians.
 * @param {number[]} options.service_ids - An array of service IDs.
 *
 * @returns {Promise<object>} A promise that resolves to the newly created
 * appointment object from the database.
 * @throws {ClientError} If validation fails (e.g., missing fields, invalid services).
 * @throws {OverlapError} If a time conflict is detected for the technician.
 * @throws {Error} If a Supabase query fails.
 */
export async function createAppointment({
  customer_id,
  date,
  start_service_time,
  technician_id,
  service_ids,
}) {
  if (!date || !start_service_time) {
    throw new ClientError("Date and start service time are required.");
  }

  const startServiceTime = DateTime.fromISO(`${date}T${start_service_time}`, { zone: "America/Los_Angeles" });
  if (!startServiceTime.isValid) {
    throw new ClientError("Invalid date or start service time format.");
  }

  const { data: services, error: serviceError } = await supabase
    .from('services')
    .select('id, time')
    .in('id', service_ids);

  if (serviceError) throw serviceError;
  if (!services || services.length !== service_ids.length) {
    throw new ClientError("Some services are invalid or not found.");
  }

  const totalServiceMinutes = services.reduce((sum, service) => sum + service.time, 0);
  const endServiceTime = startServiceTime.plus({ minutes: totalServiceMinutes });

  const { data: techAppointments, error: techApptError } = await supabase
    .from('appointmenttechnician')
    .select('appointment_id')
    .eq('technician_id', technician_id);

  if (techApptError) throw techApptError;

  const appointmentIds = techAppointments.map(a => a.appointment_id);

  const { data: existingAppointments, error: apptError } = await supabase
    .from('appointments')
    .select('*, services ( time )')
    .in('id', appointmentIds)
    .eq('date', date)
    .or('note.is.null,note.neq.deleted');

  if (apptError) throw apptError;

  const hasOverlap = overlap(existingAppointments, startServiceTime, endServiceTime);

  if (hasOverlap) {
    throw new OverlapError(
      "Appointment overlaps with an existing appointment.",
      start_service_time
    );
  }

  const { data: newAppointment, error: createError } = await supabase
    .from('appointments')
    .insert({
      customer_id,
      date,
      start_service_time,
    })
    .select()
    .single();

  if (createError) throw createError;

  const techIds = Array.isArray(technician_id) ? technician_id : [technician_id];
  const techLinks = techIds.map(id => ({
    appointment_id: newAppointment.id,
    technician_id: id,
  }));

  const { error: techLinkError } = await supabase
    .from('appointmenttechnician')
    .insert(techLinks);

  if (techLinkError) throw techLinkError;

  if (service_ids && service_ids.length > 0) {
    const serviceLinks = service_ids.map(id => ({
      appointment_id: newAppointment.id,
      service_id: id,
    }));

    const { error: serviceLinkError } = await supabase
      .from('appointment_services')
      .insert(serviceLinks);

    if (serviceLinkError) throw serviceLinkError;
  }

  return newAppointment;
}

/**
 * Finds all active and available technicians for a given appointment's time slot.
 *
 * @param {string} appointmentId - The ID of the existing appointment.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of available technician objects.
 * @throws {NotFoundError} If the appointment with the given ID is not found or is marked as deleted.
 * @throws {Error} If a database error occurs.
 */
export async function getAlternativeTechs(appointmentId) {
  // Step 1: Fetch the target appointment to get its time slot
  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .select(`id, date, start_service_time, note, services (id, time)`)
    .eq('id', appointmentId)
    .or('note.is.null,note.neq.deleted')
    .single();

  if (apptError || !appointment) {
    // Throw a specific error for the handler to catch
    throw new NotFoundError('Appointment not found.');
  }

  // Step 2: Fetch all active technicians
  const { data: allTechnicians, error: techError } = await supabase
    .from('technicians')
    .select('id, name, description, unavailability')
    .eq('status', true);

  if (techError) {
    // Re-throw database errors
    throw techError;
  }

  // Step 3: Run availability checks in parallel
  const availabilityChecks = allTechnicians.map(tech =>
    okayToAssign(tech, appointment)
  );

  const results = await Promise.all(availabilityChecks);

  // Step 4: Filter and return the available technicians
  const availableTechnicians = allTechnicians.filter((_, index) => results[index]);

  return availableTechnicians;
}

/**
 * Fetches all appointments for a given date and groups them by technician.
 *
 * @param {string} date - The date to fetch appointments for (e.g., 'YYYY-MM-DD').
 * @returns {Promise<Array<object>>} A promise that resolves with an array of
 * technician objects, each containing their list of appointments for the day.
 * @throws {Error} If a database error occurs.
 */
export async function getDailyCalendarByTechnician(date) {
  // Step 1: Fetch all appointments for the day with related data
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      date,
      start_service_time,
      customer:customers (id, name),
      technicians (id, name),
      services (id, name, time)
    `)
    .eq('date', date)
    .or('note.is.null,note.neq.deleted');

  if (error) {
    throw error; // Let the handler catch this
  }

  if (!appointments) {
    return []; // No appointments, return an empty calendar
  }

  // Step 2: Group the flat list by technician
  const groupedByTechnician = appointments.reduce((acc, appointment) => {
    // Skip if no technicians are assigned
    if (!appointment.technicians || appointment.technicians.length === 0) {
      return acc;
    }

    // Separate the technicians list from the rest of the appointment details
    const { technicians, ...apptDetails } = appointment;

    // Add this appointment to each assigned technician's list
    technicians.forEach((technician) => {
      if (!acc[technician.id]) {
        // Create the entry for this technician if it doesn't exist
        acc[technician.id] = {
          id: technician.id,
          name: technician.name,
          appointments: [],
        };
      }

      // Push the clean appointment details (without the redundant 'technicians' array)
      acc[technician.id].appointments.push(apptDetails);
    });

    return acc;
  }, {});

  // Step 3: Convert the map object into an array
  return Object.values(groupedByTechnician);
}

/**
 * Fetches and groups all non-deleted appointments for a specific customer.
 *
 * @param {string} customerId - The ID of the customer.
 * @returns {Promise<Array<object>>} A promise that resolves with the processed
 * and grouped list of appointments.
 * @throws {Error} If a database error occurs.
 */
export async function fetchCustomerHistory(customerId) {
  // Step 1: Fetch the raw appointment data
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      date,
      start_service_time,
      note,
      technicians (id, name),
      services (id, name, time, price)
    `)
    .eq('customer_id', customerId)
    .or('note.is.null,note.neq.deleted');

  if (error) {
    throw error; // Let the handler catch this
  }

  // Step 2: Process the data using the legacy helper
  // If 'data' is null or empty, groupAppointments should handle it gracefully
  return groupAppointments(data || []);
}

/**
 * Fetches all future (today or later) non-deleted appointments
 * for a specific technician.
 *
 * @param {string} technicianId - The ID of the technician.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of
 * upcoming appointment objects.
 * @throws {Error} If a database error occurs.
 */
export async function getUpcomingAppointmentsForTech(technicianId) {
  const today = DateTime.now().toISODate(); // 'YYYY-MM-DD'

  // 1. Get all appointment IDs for this technician
  const { data: techAppointments, error: techError } = await supabase
    .from('appointmenttechnician') // Your join table
    .select('appointment_id')
    .eq('technician_id', technicianId);

  if (techError) {
    throw techError;
  }

  const appointmentIds = techAppointments.map(a => a.appointment_id);

  if (appointmentIds.length === 0) {
    return []; // No appointments for this tech, return empty array
  }

  // 2. Get the full appointment details for those IDs
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      date,
      start_service_time,
      technicians (id, name),
      services (id, name, time)
    `)
    .in('id', appointmentIds)
    .gte('date', today) // date >= today
    .or('note.is.null,note.neq.deleted');

  if (error) {
    throw error;
  }

  // Return data, or an empty array if data is null
  return data || [];
}

/**
 * Searches for non-deleted appointments based on a keyword and date range.
 *
 * @param {string} [keyword] - The search term. Can be a string,
 * '*' (all future), or '**' (all future and past).
 * @returns {Promise<Array<object>>} A promise that resolves with an array
 * of matching appointment objects.
 * @throws {Error} If a database error occurs.
 */
export async function searchAppointmentsByKeyword(keyword) {
  const searchKeyword = (keyword && keyword !== '*' && keyword !== '**') ? keyword.toLowerCase() : null;
  const includePast = (keyword === '**');

  let query = supabase
    .from('appointments')
    .select(`
      id,
      date,
      start_service_time,
      note,
      customer:customers (id, name, phone, email),
      technicians (id, name),
      services (id, name, time, price)
    `)
    .or('note.is.null,note.neq.deleted');

  // Apply keyword search filter
  if (searchKeyword) {
    const k = `%${searchKeyword}%`;
    query = query.or(
      `customer.name.ilike.${k},` +
      `customer.phone.ilike.${k},` +
      `customer.email.ilike.${k},` +
      `technicians.name.ilike.${k},` +
      `services.name.ilike.${k}`
    );
  }

  // Apply date/time filter (default is future-only)
  if (!includePast) {
    const seattleNow = DateTime.now().setZone("America/Los_Angeles");
    const today = seattleNow.toISODate(); // YYYY-MM-DD
    const nowTime = seattleNow.toFormat('HH:mm:ss'); // HH:mm:ss

    // This logic finds appointments where:
    // (date is after today) OR (date is today AND start_time is after now)
    query = query.or(
      `date.gt.${today},` +
      `and(date.eq.${today},start_service_time.gte.${nowTime})`
    );
  }

  // Apply sorting
  query = query.order('date', { ascending: false })
    .order('start_service_time', { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Updates the note for a specific appointment.
 *
 * @param {string|number} appointmentId - The ID of the appointment to update.
 * @param {string|null} newNote - The new note content.
 * @returns {Promise<void>} A promise that resolves on success.
 * @throws {NotFoundError} If the appointment with the given ID is not found.
 * @throws {Error} If a database error occurs.
 */
export async function updateAppointmentNote(appointmentId, newNote) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ note: newNote })
    .eq('id', appointmentId)
    .select('id') // Request 'id' back to confirm success
    .single(); // Ensures it fails if ID doesn't exist (0 rows)

  if (error) {
    if (error.code === 'PGRST116') {
      // PostgREST code for "not found" from .single()
      throw new NotFoundError('Appointment not found.');
    }
    // Throw other database errors
    throw error;
  }

  if (!data) {
    // Fallback check, just in case .single() returns null without an error
    throw new NotFoundError('Appointment notF found.');
  }

  // If no error was thrown, the update was successful.
  return;
}

/**
 * Reassigns an appointment to a new technician after verifying availability.
 *
 * @param {string|number} appointmentId - The ID of the appointment to update.
 * @param {string|number} newTechnicianId - The ID of the new technician to assign.
 * @returns {Promise<object>} A promise that resolves with the new technician's object.
 * @throws {NotFoundError} If the appointment or technician is not found.
 * @throws {ConflictError} If the technician is not available for the appointment time.
 * @throws {Error} If a database error occurs.
 */
export async function reassignAppointmentTechnician(appointmentId, newTechnicianId) {
  // Step 1: Fetch the technician
  const { data: technician, error: techError } = await supabase
    .from('technicians')
    .select('id, name, description, unavailability')
    .eq('id', newTechnicianId)
    .single();

  if (techError || !technician) {
    throw new NotFoundError('Technician not found.');
  }

  // Step 2: Fetch the appointment
  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .select('id, date, start_service_time, services(id, time)')
    .eq('id', appointmentId)
    .single();

  if (apptError || !appointment) {
    throw new NotFoundError('Appointment not found.');
  }

  // Step 3: Check availability
  const isAvailable = await okayToAssign(technician, appointment);

  if (!isAvailable) {
    throw new ConflictError('Technician is not available.');
  }

  // Step 4: Perform the update (as a "transaction")
  // Delete all existing entries for this appointment
  const { error: deleteError } = await supabase
    .from('appointmenttechnician')
    .delete()
    .eq('appointment_id', appointmentId);

  if (deleteError) throw deleteError;

  // Insert the new entry
  const { error: insertError } = await supabase
    .from('appointmenttechnician')
    .insert({
      appointment_id: appointmentId,
      technician_id: newTechnicianId
    });

  if (insertError) throw insertError;

  // Step 5: Return the newly assigned technician object
  return technician;
}