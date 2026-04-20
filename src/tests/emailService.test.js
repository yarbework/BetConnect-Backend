import { describe, it, expect, vi, beforeEach } from 'vitest';



const mockSendMail = vi.fn();

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({ sendMail: mockSendMail }),
  },
}));

const { sendApprovalEmail } = await import('../services/emailService.js');

describe('sendApprovalEmail service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls sendMail with the correct recipient email', async () => {
    mockSendMail.mockResolvedValueOnce({ messageId: 'msg1' });
    await sendApprovalEmail('agent@example.com', 'Agent Name');
    const args = mockSendMail.mock.calls[0][0];
    expect(args.to).toBe('agent@example.com');
  });

  it('calls sendMail with the correct subject', async () => {
    mockSendMail.mockResolvedValueOnce({ messageId: 'msg1' });
    await sendApprovalEmail('agent@example.com', 'Agent Name');
    const args = mockSendMail.mock.calls[0][0];
    expect(args.subject).toBe('Your Account has been Approved!');
  });

  it('includes the agent name in the email body', async () => {
    mockSendMail.mockResolvedValueOnce({ messageId: 'msg1' });
    await sendApprovalEmail('agent@example.com', 'Yohannes Desalegn');
    const args = mockSendMail.mock.calls[0][0];
    expect(args.html).toContain('Yohannes Desalegn');
  });

  it('includes a link to the frontend login page', async () => {
    mockSendMail.mockResolvedValueOnce({});
    await sendApprovalEmail('a@b.com', 'Test');
    const args = mockSendMail.mock.calls[0][0];
    expect(args.html).toContain('/login');
  });

  it('sets the from field to the expected sender address', async () => {
    mockSendMail.mockResolvedValueOnce({});
    await sendApprovalEmail('a@b.com', 'Test');
    const args = mockSendMail.mock.calls[0][0];
    expect(args.from).toContain('betconnect.com');
  });

  it('returns the result from sendMail', async () => {
    const mockResult = { messageId: 'abc123' };
    mockSendMail.mockResolvedValueOnce(mockResult);
    const result = await sendApprovalEmail('a@b.com', 'Test');
    expect(result).toEqual(mockResult);
  });

  it('propagates sendMail errors', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('SMTP failure'));
    await expect(sendApprovalEmail('a@b.com', 'Test')).rejects.toThrow('SMTP failure');
  });

  it('calls sendMail exactly once per invocation', async () => {
    mockSendMail.mockResolvedValue({});
    await sendApprovalEmail('a@b.com', 'Name');
    expect(mockSendMail).toHaveBeenCalledOnce();
  });
});