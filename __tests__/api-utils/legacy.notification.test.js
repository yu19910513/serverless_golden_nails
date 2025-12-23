// Tests for legacy notification utilities: SMS and Email flows

// Mock Twilio client
jest.mock('twilio', () => {
  const createSpy = jest.fn().mockResolvedValue({ sid: 'SM123' });
  const TwilioCtor = jest.fn(() => ({
    messages: { create: createSpy },
  }));
  // Expose spy for assertions
  TwilioCtor.__createSpy = createSpy;
  return TwilioCtor;
});

// Mock Nodemailer
jest.mock('nodemailer', () => {
  const sendMailSpy = jest.fn().mockResolvedValue({ response: '250 OK' });
  return {
    createTransport: jest.fn(() => ({ sendMail: sendMailSpy })),
  };
});

// Mock HTML template generator (helper)
jest.mock('../../api/_utils/legacy/helper.js', () => ({
  generateHtmlFromTemplate: jest.fn(() => '<HTML/>'),
}));

// Mock text template builder
// Important: mock the path as required within legacy/notification.js
jest.mock(
  '../../api/_utils/legacy/templates/templates',
  () => ({ appointmentMessage: jest.fn(() => 'TEXT MESSAGE') }),
  { virtual: true }
);

import twilio from 'twilio';
import nodemailer from 'nodemailer';
// Access the mocked templates module for assertions
const { appointmentMessage } = jest.requireMock('../../api/_utils/legacy/templates/templates');
import { generateHtmlFromTemplate } from '../../api/_utils/legacy/helper.js';
import * as notification from '../../api/_utils/legacy/notification.js';

describe('legacy/notification.sendSMS', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TWILIO_SID = 'sid123';
    process.env.TWILIO_TOKEN = 'tokenABC';
    process.env.TWILIO_NUMBER = '4155550000';
  });

  test('sends SMS and normalizes US number without plus', async () => {
    const sms = await notification.sendSMS('4155551234', 'Hello');

    // Client created with creds
    expect(twilio).toHaveBeenCalledWith('sid123', 'tokenABC');
    // Message create called with normalized fields
    expect(twilio.__createSpy).toHaveBeenCalledWith({
      body: 'Hello',
      from: '+14155550000',
      to: '+14155551234',
    });
    expect(sms).toEqual({ sid: 'SM123' });
  });

  test('respects numbers with plus prefix', async () => {
    await notification.sendSMS('+14155551234', 'Hi');
    expect(twilio.__createSpy).toHaveBeenCalledWith({
      body: 'Hi',
      from: '+14155550000',
      to: '+14155551234',
    });
  });

  test('returns error object on failure', async () => {
    twilio.__createSpy.mockRejectedValueOnce(new Error('Twilio down'));
    const result = await notification.sendSMS('4155559999', 'Oops');
    expect(result).toEqual({ success: false, error: 'Twilio down' });
  });
});

describe('legacy/notification.emailApi.sendEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BUSINESS_EMAIL = 'biz@example.com';
    process.env.APP_PASSWORD = 'app-pass';
  });

  test('sends email via gmail transporter', async () => {
    const payload = {
      address: ['user@example.com'],
      subject: 'Subject Line',
      text: 'Plain text',
      html: '<p>HTML</p>',
    };

    const result = await notification.emailApi.sendEmail(payload);
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: { user: 'biz@example.com', pass: 'app-pass' },
    });
    const transporter = nodemailer.createTransport.mock.results[0].value;
    expect(transporter.sendMail).toHaveBeenCalledWith({
      from: 'biz@example.com',
      to: payload.address,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
    expect(result).toBeUndefined(); // success returns nothing
  });

  test('returns { success: false, error } on send failure', async () => {
    nodemailer.createTransport.mockImplementationOnce(() => ({
      sendMail: jest.fn().mockRejectedValue(new Error('SMTP fail')),
    }));

    const res = await notification.emailApi.sendEmail({
      address: 'user@example.com',
      subject: 'X',
      html: '<p/>',
    });
    expect(res).toEqual({ success: false, error: 'SMTP fail' });
  });
});

describe('legacy/notification.sendEmailNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('skips when recipients are empty', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    notification.sendEmailNotification([], 'New Appointment', 'customer', { foo: 'bar' });
    expect(warnSpy).toHaveBeenCalled();
    const spy = jest.spyOn(notification.emailApi, 'sendEmail');
    expect(spy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test('composes email with text and html templates', () => {
    const spy = jest.spyOn(notification.emailApi, 'sendEmail').mockResolvedValue(undefined);

    const recipients = ['a@example.com', 'b@example.com'];
    const subject = 'New Appointment';
    const role = 'owner';
    const data = { action: 'confirm', recipient_name: 'Ada' };

    notification.sendEmailNotification(recipients, subject, role, data);

    // appointmentMessage called correctly
    expect(appointmentMessage).toHaveBeenCalledWith(data, role);
    // HTML template built from subject
    expect(generateHtmlFromTemplate).toHaveBeenCalledWith({
      template: 'appointment/new_appointment.handlebars',
      content: data,
    });

    // emailApi called with composed payload
    expect(spy).toHaveBeenCalledWith({
      address: recipients,
      subject,
      text: 'TEXT MESSAGE',
      html: '<HTML/>',
    });
  });
});
