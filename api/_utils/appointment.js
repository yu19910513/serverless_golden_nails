import { supabase } from './supabaseClient.js';
import { DateTime } from 'luxon';
import { overlap, okayToAssign, groupAppointments } from './legacy/helper.js';
import { ClientError, OverlapError, NotFoundError, ConflictError } from './errors.js';

/**
 * Creates a new appointment with associated technicians and services.
 * Performs input validation, time conflict detection, and relational inserts.
 *
 * @param {object} options - Appointment creation options.
 * @param {number} options.customer_id - Customer ID.
 * @param {string} options.date - Appointment date (YYYY-MM-DD).
 * @param {string} options.start_service_time - Start time (HH:mm).
 * @param {number|number[]} options.technician_id - One or more technician IDs.
 * @param {number[]} options.service_ids - Service IDs associated with the appointment.
 * @returns {Promise<object>} Newly created appointment record.
 * @throws {ClientError} If validation fails or required fields are missing.
 * @throws {OverlapError} If a scheduling conflict is detected.
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
      .from('appointmentservice')
      .insert(serviceLinks);

    if (serviceLinkError) throw serviceLinkError;
  }

  return newAppointment;
}

/**
 * Retrieves all active technicians available for a specific appointment’s time slot.
 *
 * @param {string|number} appointmentId - Appointment ID to check against.
 * @returns {Promise<object[]>} List of available technician records.
 * @throws {NotFoundError} If the appointment does not exist or is deleted.
 * @throws {Error} If a Supabase query fails.
 */
export async function getAlternativeTechs(appointmentId) {
  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .select(`
      id, 
      date, 
      start_service_time, 
      note, 
      Services:services (id, time)
    `)
    .eq('id', appointmentId)
    .or('note.is.null,note.neq.deleted')
    .single();

  if (apptError || !appointment) {
    throw new NotFoundError('Appointment not found.');
  }

  const { data: allTechnicians, error: techError } = await supabase
    .from('technicians')
    .select('id, name, description, unavailability')
    .eq('status', 1);

  if (techError) throw techError;

  const availabilityChecks = allTechnicians.map(tech =>
    okayToAssign(tech, appointment)
  );

  const results = await Promise.all(availabilityChecks);

  return allTechnicians.filter((_, index) => results[index]);
}

/**
 * Fetches all appointments for a given date and groups them by technician.
 *
 * @param {string} date - Target date (YYYY-MM-DD).
 * @returns {Promise<object[]>} Technicians with their corresponding daily appointments.
 * @throws {Error} If a Supabase query fails.
 */
export async function getDailyCalendarByTechnician(date) {
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      date,
      start_service_time,
      Customer:customers (id, name),
      Technicians:technicians (id, name),
      Services:services (id, name, time)
    `)
    .eq('date', date)
    .or('note.is.null,note.neq.deleted');

  if (error) throw error;
  if (!appointments) return [];

  const groupedByTechnician = appointments.reduce((acc, appointment) => {
    if (!appointment.Technicians || appointment.Technicians.length === 0) {
      return acc;
    }

    const { Technicians: technicians, ...apptDetails } = appointment;
    technicians.forEach((technician) => {
      if (!acc[technician.id]) {
        acc[technician.id] = {
          id: technician.id,
          name: technician.name,
          appointments: [],
        };
      }
      acc[technician.id].appointments.push(apptDetails);
    });

    return acc;
  }, {});

  return Object.values(groupedByTechnician);
}

/**
 * Retrieves and groups all non-deleted appointments for a specified customer.
 *
 * @param {string|number} customerId - Customer ID.
 * @returns {Promise<object[]>} Grouped list of the customer’s appointments.
 * @throws {Error} If a Supabase query fails.
 */
export async function fetchCustomerHistory(customerId) {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      date,
      start_service_time,
      note,
      Technicians:technicians (id, name),
      Services:services (id, name, time, price)
    `)
    .eq('customer_id', customerId)
    .or('note.is.null,note.neq.deleted');

  if (error) throw error;
  return groupAppointments(data || []);
}

/**
 * Fetches all upcoming (today or later) non-deleted appointments for a technician.
 *
 * @param {string|number} technicianId - Technician ID.
 * @returns {Promise<object[]>} List of upcoming appointments.
 * @throws {Error} If a Supabase query fails.
 */
export async function getUpcomingAppointmentsForTech(technicianId) {
  const today = DateTime.now().toISODate();

  const { data: techAppointments, error: techError } = await supabase
    .from('appointmenttechnician')
    .select('appointment_id')
    .eq('technician_id', technicianId);

  if (techError) throw techError;

  const appointmentIds = techAppointments.map(a => a.appointment_id);
  if (appointmentIds.length === 0) return [];

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      date,
      start_service_time,
      Technicians:technicians (id, name),
      Services:services (id, name, time)
    `)
    .in('id', appointmentIds)
    .gte('date', today)
    .or('note.is.null,note.neq.deleted');

  if (error) throw error;
  return data || [];
}

/**
 * @description
 * Searches for non-deleted appointments (`note` is not 'deleted').
 *
 * This function operates in two main modes:
 * 1.  **Keyword Search:** If a `keyword` (that is not '*' or '**') is provided,
 * it performs a case-insensitive search across:
 * - `customers` (name, phone, email)
 * - `technicians` (name)
 * - `services` (name)
 * It then finds all appointments linked to any of these matching records.
 *
 * 2.  **Time-Based Fetch:**
 * - `*` (or default): Fetches all **future** appointments.
 * - `**`: Fetches **all** appointments, including past ones.
 *
 * All matching appointments are then "hydrated" with their full related data
 * (Customer, Technicians, and Services) before being returned.
 *
 * Future appointments are determined using the 'America/Los_Angeles' timezone,
 * including any appointments scheduled for today at or after the current time.
 *
 * @param {string} [keyword] - The search term or a special control flag:
 * - `'*'`: (Default) Returns all **future** non-deleted appointments.
 * - `'**'`: Returns **all** non-deleted appointments (past and future).
 * - `any other string`: Performs a keyword search.
 *
 * @returns {Promise<AppointmentWithDetails[]>} A promise that resolves to an
 * array of matching appointment objects, each populated with its related
 * customer, technicians, and services. Returns an empty array if no
 * matches are found.
 *
 * @throws {Error} If any of the Supabase database queries fail.
 */
export async function searchAppointmentsByKeyword(keyword) {
  const searchKeyword = (keyword && keyword !== '*' && keyword !== '**')
    ? keyword.toLowerCase()
    : null;
  const includePast = (keyword === '**');

  const seattleNow = DateTime.now().setZone("America/Los_Angeles");
  const today = seattleNow.toISODate();
  const nowTime = seattleNow.toFormat('HH:mm:ss');

  let appointmentIds = null;

  if (searchKeyword) {
    const k = `%${searchKeyword}%`;

    const { data: customers } = await supabase
      .from('customers')
      .select('id')
      .or(`name.ilike.${k},phone.ilike.${k},email.ilike.${k}`);
    const customerIds = customers?.map(c => c.id) || [];

    const { data: technicians } = await supabase
      .from('technicians')
      .select('id')
      .ilike('name', k);
    const technicianIds = technicians?.map(t => t.id) || [];

    const { data: services } = await supabase
      .from('services')
      .select('id')
      .ilike('name', k);
    const serviceIds = services?.map(s => s.id) || [];

    const { data: apptByCustomer } = await supabase
      .from('appointments')
      .select('id')
      .in('customer_id', customerIds);

    const { data: apptByTechnician } = await supabase
      .from('appointmenttechnician')
      .select('appointment_id')
      .in('technician_id', technicianIds);

    const { data: apptByService } = await supabase
      .from('appointmentservice')
      .select('appointment_id')
      .in('service_id', serviceIds);

    appointmentIds = [
      ...(apptByCustomer?.map(a => a.id) || []),
      ...(apptByTechnician?.map(a => a.appointment_id) || []),
      ...(apptByService?.map(a => a.appointment_id) || []),
    ];

    appointmentIds = [...new Set(appointmentIds)];
  }

  let appointmentQuery = supabase.from('appointments')
    .select('id, date, start_service_time, note, customer_id')
    .or('note.is.null,note.neq.deleted');

  if (appointmentIds) {
    if (appointmentIds.length === 0) return [];
    appointmentQuery = appointmentQuery.in('id', appointmentIds);
  }

  if (!includePast) {
    appointmentQuery = appointmentQuery.or(
      `date.gt.${today},and(date.eq.${today},start_service_time.gte.${nowTime})`
    );
  }

  appointmentQuery = appointmentQuery.order('date', { ascending: false })
    .order('start_service_time', { ascending: true });

  const { data: appointments, error } = await appointmentQuery;
  if (error) throw error;
  if (!appointments?.length) return [];

  const apptIds = appointments.map(a => a.id);
  const customerIds = [...new Set(appointments.map(a => a.customer_id))];

  const { data: customersData } = await supabase
    .from('customers')
    .select('id, name, phone, email')
    .in('id', customerIds);

  const { data: techLinks } = await supabase
    .from('appointmenttechnician')
    .select('appointment_id, technician_id')
    .in('appointment_id', apptIds);

  const techIds = [...new Set(techLinks.map(t => t.technician_id))];
  const { data: techniciansData } = await supabase
    .from('technicians')
    .select('id, name')
    .in('id', techIds);

  const { data: serviceLinks } = await supabase
    .from('appointmentservice')
    .select('appointment_id, service_id')
    .in('appointment_id', apptIds);

  const serviceIds = [...new Set(serviceLinks.map(s => s.service_id))];
  const { data: servicesData } = await supabase
    .from('services')
    .select('id, name, time, price')
    .in('id', serviceIds);

  const customerMap = Object.fromEntries(customersData.map(c => [c.id, c]));
  const technicianMap = Object.fromEntries(techniciansData.map(t => [t.id, t]));
  const serviceMap = Object.fromEntries(servicesData.map(s => [s.id, s]));

  const techByAppt = techLinks.reduce((acc, t) => {
    acc[t.appointment_id] = acc[t.appointment_id] || [];
    acc[t.appointment_id].push(technicianMap[t.technician_id]);
    return acc;
  }, {});

  const serviceByAppt = serviceLinks.reduce((acc, s) => {
    acc[s.appointment_id] = acc[s.appointment_id] || [];
    acc[s.appointment_id].push(serviceMap[s.service_id]);
    return acc;
  }, {});

  return appointments.map(a => ({
    ...a,
    Customer: customerMap[a.customer_id] || null,
    Technicians: techByAppt[a.id] || [],
    Services: serviceByAppt[a.id] || [],
  }));
}

/**
 * Updates the note associated with a specific appointment.
 *
 * @param {string|number} appointmentId - Appointment ID.
 * @param {string|null} newNote - Updated note content, or `null` to remove it.
 * @returns {Promise<void>} Resolves when the update succeeds.
 * @throws {NotFoundError} If the appointment cannot be found.
 * @throws {Error} If a Supabase query fails.
 */
export async function updateAppointmentNote(appointmentId, newNote) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ note: newNote })
    .eq('id', appointmentId)
    .select('id')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Appointment not found.');
    }
    throw error;
  }

  if (!data) {
    throw new NotFoundError('Appointment not found.');
  }
}

/**
 * Reassigns an appointment to a new technician after validating availability.
 *
 * @param {string|number} appointmentId - Appointment ID.
 * @param {string|number} newTechnicianId - New technician ID.
 * @returns {Promise<object>} Newly assigned technician record.
 * @throws {NotFoundError} If the technician or appointment cannot be found.
 * @throws {ConflictError} If the technician is unavailable at the appointment time.
 * @throws {Error} If a Supabase query fails.
 */
export async function reassignAppointmentTechnician(appointmentId, newTechnicianId) {
  const { data: technician, error: techError } = await supabase
    .from('technicians')
    .select('id, name, description, unavailability')
    .eq('id', newTechnicianId)
    .single();

  if (techError || !technician) {
    throw new NotFoundError('Technician not found.');
  }

  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .select(`
      id, 
      date, 
      start_service_time, 
      Services:services(id, time)
    `)
    .eq('id', appointmentId)
    .single();

  if (apptError || !appointment) {
    throw new NotFoundError('Appointment not found.');
  }

  const isAvailable = await okayToAssign(technician, appointment);
  if (!isAvailable) {
    throw new ConflictError('Technician is not available.');
  }

  const { error: deleteError } = await supabase
    .from('appointmenttechnician')
    .delete()
    .eq('appointment_id', appointmentId);

  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase
    .from('appointmenttechnician')
    .insert({
      appointment_id: appointmentId,
      technician_id: newTechnicianId
    });

  if (insertError) throw insertError;

  return technician;
}