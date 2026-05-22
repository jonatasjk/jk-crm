import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { CustomersPage } from '@/pages/CustomersPage';
import { renderWithProviders, authenticateStore, resetAuthStore } from '@/test/utils';

const BASE = 'http://localhost:3001/api/v1';

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DragOverlay: ({ children }: { children?: React.ReactNode }) => <div>{children ?? null}</div>,
  PointerSensor: class {},
  KeyboardSensor: class {},
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  closestCorners: vi.fn(),
  useDroppable: vi.fn(() => ({ isOver: false, setNodeRef: vi.fn() })),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn(() => '') } },
}));

vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => null),
  EditorContent: () => <div data-testid="rich-text-editor" />,
}));
vi.mock('@tiptap/starter-kit', () => ({ default: {} }));
vi.mock('@tiptap/extension-underline', () => ({ default: {} }));
vi.mock('@tiptap/extension-link', () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock('@tiptap/extension-text-align', () => ({ default: { configure: vi.fn(() => ({})) } }));

describe('CustomersPage', () => {
  beforeEach(() => authenticateStore());
  afterEach(() => resetAuthStore());

  it('renders the Customers heading', () => {
    renderWithProviders(<CustomersPage />);
    expect(screen.getByText('Customers')).toBeInTheDocument();
  });

  it('shows customer total count after load', async () => {
    renderWithProviders(<CustomersPage />);
    await waitFor(() => {
      expect(screen.getByText(/2 total/i)).toBeInTheDocument();
    });
  });

  it('renders customers in list view', async () => {
    renderWithProviders(<CustomersPage />);
    await userEvent.click(screen.getByTitle('List view'));
    await waitFor(() => {
      expect(screen.getByText('Nina Brooks')).toBeInTheDocument();
      expect(screen.getByText('Oscar Webb')).toBeInTheDocument();
    });
  });

  it('opens Create modal when Add customer button is clicked', async () => {
    renderWithProviders(<CustomersPage />);
    await userEvent.click(screen.getByRole('button', { name: /add customer/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('opens Import modal when Import button is clicked', async () => {
    renderWithProviders(<CustomersPage />);
    await userEvent.click(screen.getByRole('button', { name: /import/i }));
    await waitFor(() => {
      expect(screen.getByText('Import customers from CSV')).toBeInTheDocument();
    });
  });

  it('shows "No customers found" in list view when empty', async () => {
    server.use(
      http.get(`${BASE}/customers`, () =>
        HttpResponse.json({ data: [], total: 0, page: 1, limit: 200, pages: 0 }),
      ),
    );

    renderWithProviders(<CustomersPage />);
    await userEvent.click(screen.getByTitle('List view'));
    await waitFor(() => {
      expect(screen.getByText('No customers found')).toBeInTheDocument();
    });
  });

  it('opens customer detail when clicking row in list view', async () => {
    renderWithProviders(<CustomersPage />);
    await userEvent.click(screen.getByTitle('List view'));
    await waitFor(() => screen.getByText('Nina Brooks'));
    await userEvent.click(screen.getByText('Nina Brooks'));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('creates a new customer when form is submitted', async () => {
    renderWithProviders(<CustomersPage />);
    await userEvent.click(screen.getByRole('button', { name: /add customer/i }));
    await waitFor(() => screen.getByRole('heading', { name: 'Add customer' }));

    await userEvent.type(screen.getByLabelText('First Name *'), 'New');
    await userEvent.type(screen.getByLabelText('Last Name *'), 'Customer');
    await userEvent.type(screen.getByLabelText('Email *'), 'new@customer.com');

    await userEvent.click(screen.getByRole('button', { name: /create customer/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('filters by stage in list view', async () => {
    server.use(
      http.get(`${BASE}/customers`, ({ request }) => {
        const url = new URL(request.url);
        const stage = url.searchParams.get('stage');
        if (stage === 'LEAD') {
          return HttpResponse.json({ data: [{ id: 'cust-1', firstName: 'Nina', lastName: 'Brooks', email: 'nina@customer.com', stage: 'LEAD', tags: [], createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-02-02T00:00:00Z' }], total: 1, page: 1, limit: 200, pages: 1 });
        }
        return HttpResponse.json({ data: [], total: 0, page: 1, limit: 200, pages: 0 });
      }),
    );

    renderWithProviders(<CustomersPage />);
    await userEvent.click(screen.getByTitle('List view'));
    await waitFor(() => screen.getByText('Nina Brooks'));
    expect(screen.queryByText('Oscar Webb')).not.toBeInTheDocument();
  });

  it('shows Add customer button', () => {
    renderWithProviders(<CustomersPage />);
    expect(screen.getByRole('button', { name: /add customer/i })).toBeInTheDocument();
  });

  it('shows kanban and list view toggle buttons', () => {
    renderWithProviders(<CustomersPage />);
    expect(screen.getByTitle('Kanban view')).toBeInTheDocument();
    expect(screen.getByTitle('List view')).toBeInTheDocument();
  });

  it('filters customers when typing in search box', async () => {
    renderWithProviders(<CustomersPage />);
    const searchInput = screen.getByPlaceholderText('Search customers...');
    await userEvent.type(searchInput, 'Nina');
    await waitFor(() => {
      expect(searchInput).toHaveValue('Nina');
    });
  });

  it('switches back to kanban view after switching to list', async () => {
    renderWithProviders(<CustomersPage />);
    await userEvent.click(screen.getByTitle('List view'));
    await userEvent.click(screen.getByTitle('Kanban view'));
    await waitFor(() => {
      expect(screen.getByTitle('Kanban view')).toBeInTheDocument();
    });
  });
});
