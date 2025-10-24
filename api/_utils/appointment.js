import { supabase } from './supabaseClient.js';
import { DateTime } from 'luxon';
import { overlap } from './legacy/helper.js';
import { ClientError, OverlapError } from './errors.js';

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