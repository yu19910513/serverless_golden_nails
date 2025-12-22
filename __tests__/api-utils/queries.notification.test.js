jest.mock('../../api/_utils/legacy/notification.js', () => ({
  sendEmail: jest.fn(),
  sendSMS: jest.fn(),
  sendEmailNotification: jest.fn(),
}));

import * as mod from '../../api/_utils/queries/notification.js';

describe('queries/notification re-exports', () => {
  test('exports sendEmail, sendSMS, sendEmailNotification', () => {
    expect(typeof mod.sendEmail).toBe('function');
    expect(typeof mod.sendSMS).toBe('function');
    expect(typeof mod.sendEmailNotification).toBe('function');
  });
});
