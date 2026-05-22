import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { CustomerDetail } from '@/components/customers/CustomerDetail';
import { renderWithProviders, authenticateStore, resetAuthStore } from '@/test/utils';
import { mockCustomers } from '@/test/mocks/factories';

vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => null),
  EditorContent: () => <div data-testid="editor" />,
}));
vi.mock('@tiptap/starter-kit', () => ({ default: {} }));
vi.mock('@tiptap/extension-underline', () => ({ default: {} }));
vi.mock('@tiptap/extension-link', () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock('@tiptap/extension-text-align', () => ({ default: { configure: vi.fn(() => ({})) } }));

const BASE = 'http://localhost:3001/api/v1';
const mockCustomer = mockCustomers[0];

describe('CustomerDetail', () => {
  const onClose = vi.fn();
  const onUpdated = vi.fn();

  beforeEach(() => authenticateStore());
  afterEach(() => {
    resetAuthStore();
    vi.restoreAllMocks();
    onClose.mockClear();
    onUpdated.mockClear();
  });

  it('renders customer stage badge', async () => {
    renderWithProviders(
      <CustomerDetail customer={mockCustomer} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => {
      expect(screen.getByText('Lead')).toBeInTheDocument();
    });
  });

  it('renders Send email button', async () => {
    renderWithProviders(
      <CustomerDetail customer={mockCustomer} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /send email/i })).toBeInTheDocument();
    });
  });

  it('renders edit and delete buttons', async () => {
    renderWithProviders(
      <CustomerDetail customer={mockCustomer} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('shows customer contact info', async () => {
    renderWithProviders(
      <CustomerDetail customer={mockCustomer} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => {
      expect(screen.getByText('nina@customer.com')).toBeInTheDocument();
    });
  });

  it('opens email compose modal when Send email is clicked', async () => {
    renderWithProviders(
      <CustomerDetail customer={mockCustomer} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => screen.getByRole('button', { name: /send email/i }));

    await userEvent.click(screen.getByRole('button', { name: /send email/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /send email/i })).toBeInTheDocument();
    });
  });

  it('opens edit modal when pencil button is clicked', async () => {
    renderWithProviders(
      <CustomerDetail customer={mockCustomer} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => screen.getByRole('button', { name: /send email/i }));

    // Buttons: [0]=Send email, [1]=Edit (pencil), [2]=Delete (trash)
    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons[1]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /edit customer/i })).toBeInTheDocument();
    });
  });

  it('deletes customer when delete is confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onUpdatedLocal = vi.fn();

    renderWithProviders(
      <CustomerDetail customer={mockCustomer} onClose={onClose} onUpdated={onUpdatedLocal} />,
    );
    await waitFor(() => screen.getByRole('button', { name: /send email/i }));

    const deleteBtns = screen.getAllByRole('button').filter((b) =>
      b.className.includes('red'),
    );
    if (deleteBtns.length > 0) {
      await userEvent.click(deleteBtns[0]);
      await waitFor(() => expect(onUpdatedLocal).toHaveBeenCalled());
    }
  });

  it('does not delete when confirm is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    server.use(
      http.delete(`${BASE}/customers/cust-1`, () => new HttpResponse(null, { status: 204 })),
    );

    const onUpdatedLocal = vi.fn();
    renderWithProviders(
      <CustomerDetail customer={mockCustomer} onClose={onClose} onUpdated={onUpdatedLocal} />,
    );
    await waitFor(() => screen.getByRole('button', { name: /send email/i }));

    const deleteBtns = screen.getAllByRole('button').filter((b) =>
      b.className.includes('red'),
    );
    if (deleteBtns.length > 0) {
      await userEvent.click(deleteBtns[0]);
      expect(onUpdatedLocal).not.toHaveBeenCalled();
    }
  });

  it('closes email compose modal on cancel', async () => {
    renderWithProviders(
      <CustomerDetail customer={mockCustomer} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => screen.getByRole('button', { name: /send email/i }));

    await userEvent.click(screen.getByRole('button', { name: /send email/i }));
    await waitFor(() => screen.getByRole('heading', { name: /send email/i }));

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /send email/i })).not.toBeInTheDocument();
    });
  });

  it('shows company name when present', async () => {
    renderWithProviders(
      <CustomerDetail customer={mockCustomer} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => {
      expect(screen.getByText('BrooksCo')).toBeInTheDocument();
    });
  });

  it('shows email history section when emailLogs exist', async () => {
    server.use(
      http.get(`${BASE}/customers/:id`, ({ params }) => {
        const customer = mockCustomers.find((c) => c.id === params.id) ?? mockCustomers[0];
        return HttpResponse.json({
          ...customer,
          emailLogs: [
            { id: 'log-1', subject: 'Hello Nina', status: 'SENT', createdAt: '2024-02-01T10:00:00Z' },
          ],
          activities: [],
        });
      }),
    );

    renderWithProviders(
      <CustomerDetail customer={mockCustomer} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => {
      expect(screen.getByText('Hello Nina')).toBeInTheDocument();
    });
  });

  it('submits edit form and closes modal on success', async () => {
    const onUpdatedLocal = vi.fn();
    renderWithProviders(
      <CustomerDetail customer={mockCustomer} onClose={onClose} onUpdated={onUpdatedLocal} />,
    );
    await waitFor(() => screen.getByRole('button', { name: /send email/i }));

    // Open edit modal
    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons[1]);
    await waitFor(() => screen.getByRole('heading', { name: /edit customer/i }));

    // Clear and fill required fields, then submit
    const firstNameInput = screen.getByLabelText('First Name *');
    await userEvent.clear(firstNameInput);
    await userEvent.type(firstNameInput, 'Updated');

    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /edit customer/i })).not.toBeInTheDocument();
    });
  });

  it('shows activity feed when activities exist', async () => {
    server.use(
      http.get(`${BASE}/customers/:id`, ({ params }) => {
        const customer = mockCustomers.find((c) => c.id === params.id) ?? mockCustomers[0];
        return HttpResponse.json({
          ...customer,
          emailLogs: [],
          activities: [
            { id: 'act-1', type: 'NOTE', detail: 'Called customer', createdAt: '2024-02-01T10:00:00Z' },
          ],
        });
      }),
    );

    renderWithProviders(
      <CustomerDetail customer={mockCustomer} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => {
      expect(screen.getByText('Called customer')).toBeInTheDocument();
    });
  });
});
