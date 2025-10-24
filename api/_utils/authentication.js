import { supabase } from './supabaseClient.js';
import { sendEmail, sendSMS } from './legacy/notification.js';
import { validateContactType } from './legacy/helper.js';
import { signToken } from './legacy/authentication.js';

/**
 * Finds a customer, generates/saves a passcode,
 * AND sends it via the appropriate channel.
 *
 * @param {string} identifier - The customer's email or phone number.
 * @returns {Promise<boolean>} A promise that resolves to `true` if successful,
 * or `false` if the customer was not found.
 */
export async function findCustomerAndSendPasscode(identifier) {
    // 1. Find customer
    const { data: customer, error: findError } = await supabase
        .from('customers')
        .select('id, email, phone')
        .or(`email.eq.${identifier},phone.eq.${identifier}`)
        .maybeSingle();

    if (findError) {
        console.error('Supabase error finding customer for passcode:', findError);
        throw findError;
    }
    if (!customer) {
        return false;
    }

    // 2. Generate and save passcode
    const passcode = Math.floor(100000 + Math.random() * 900000).toString();
    const { error: updateError } = await supabase
        .from('customers')
        .update({ passcode })
        .eq('id', customer.id);

    if (updateError) {
        console.error('Supabase error saving passcode:', updateError);
        throw updateError;
    }

    // 3. Send notification using your imported helpers
    const identifierType = validateContactType(identifier);
    if (identifierType === 'email') {
        await sendEmail({
            address: customer.email,
            subject: 'Your Login Code',
            text: `Your passcode is: ${passcode}`,
        });
    } else if (identifierType === 'phone') {
        await sendSMS(customer.phone, `Your passcode is: ${passcode}`);
    }

    return true;
}

/**
 * Finds a customer, verifies passcode, clears it, AND returns a signed JWT.
 *
 * @param {string} identifier - The customer's email or phone number.
 * @param {string} passcode - The 6-digit passcode to verify.
 * @returns {Promise<string|null>} A promise that resolves to the JWT token
 * if successful, or null otherwise.
 */
export async function verifyPasscodeAndSignToken(identifier, passcode) {
    // 1. Find the customer
    const { data: customer, error: findError } = await supabase
        .from('customers')
        .select('*') // Select all fields needed for the token
        .or(`email.eq.${identifier},phone.eq.${identifier}`)
        .maybeSingle();

    if (findError) {
        console.error('Supabase error verifying passcode:', findError);
        throw findError;
    }

    // 2. If customer doesn't exist or passcode doesn't match, fail
    if (!customer || customer.passcode !== passcode) {
        return null;
    }

    // 3. Verification successful, clear the passcode
    const { error: updateError } = await supabase
        .from('customers')
        .update({ passcode: null })
        .eq('id', customer.id);

    if (updateError) {
        console.error('Supabase error clearing passcode:', updateError);
        throw updateError;
    }

    // 4. Sign the token using your imported helper
    const token = signToken({
        phone: customer.phone,
        id: customer.id,
        name: customer.name,
        admin_privilege: customer.admin_privilege,
    });

    return token;
}