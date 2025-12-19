/**
 * Tests for DeleteProjectConfirmationModal component
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { DeleteProjectConfirmationModal } from '@/src/components/DeleteProjectConfirmationModal';
import { ColorsProvider } from '@/src/context/ColorsContext';
import { FocusManagerProvider } from '@/src/hooks/useFocusManager';

// Mock the KeyboardToolbar component
jest.mock('react-native-keyboard-controller', () => ({
  KeyboardToolbar: () => null,
}));

describe('DeleteProjectConfirmationModal', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirmDelete = jest.fn();
  const testProjectName = 'Test Project';

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <FocusManagerProvider>
      <ColorsProvider>{children}</ColorsProvider>
    </FocusManagerProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal when visible', () => {
    const { getByText, getByPlaceholderText } = render(
      <DeleteProjectConfirmationModal
        isVisible={true}
        onClose={mockOnClose}
        onConfirmDelete={mockOnConfirmDelete}
        projectName={testProjectName}
      />,
      { wrapper },
    );

    expect(getByText('Confirm Project Deletion')).toBeTruthy();
    expect(getByText(/cannot undo a project deletion/i)).toBeTruthy();
    expect(getByText(`Project: ${testProjectName}`)).toBeTruthy();
    expect(getByPlaceholderText(/Type "delete" to confirm/i)).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <DeleteProjectConfirmationModal
        isVisible={false}
        onClose={mockOnClose}
        onConfirmDelete={mockOnConfirmDelete}
        projectName={testProjectName}
      />,
      { wrapper },
    );

    expect(queryByText('Confirm Project Deletion')).toBeNull();
  });

  it('should call onConfirmDelete and onClose when Delete is pressed with correct input', async () => {
    const { getByPlaceholderText, getByText } = render(
      <DeleteProjectConfirmationModal
        isVisible={true}
        onClose={mockOnClose}
        onConfirmDelete={mockOnConfirmDelete}
        projectName={testProjectName}
      />,
      { wrapper },
    );

    const input = getByPlaceholderText(/Type "delete" to confirm/i);
    fireEvent.changeText(input, 'delete');

    const deleteButton = getByText('Delete');
    fireEvent.press(deleteButton);

    await waitFor(() => {
      expect(mockOnConfirmDelete).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should not call onConfirmDelete when Delete is pressed with incorrect input', () => {
    const { getByPlaceholderText, getByText } = render(
      <DeleteProjectConfirmationModal
        isVisible={true}
        onClose={mockOnClose}
        onConfirmDelete={mockOnConfirmDelete}
        projectName={testProjectName}
      />,
      { wrapper },
    );

    const input = getByPlaceholderText(/Type "delete" to confirm/i);
    fireEvent.changeText(input, 'wrong text');

    const deleteButton = getByText('Delete');
    fireEvent.press(deleteButton);

    expect(mockOnConfirmDelete).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should call onClose when Cancel is pressed', async () => {
    const { getByText } = render(
      <DeleteProjectConfirmationModal
        isVisible={true}
        onClose={mockOnClose}
        onConfirmDelete={mockOnConfirmDelete}
        projectName={testProjectName}
      />,
      { wrapper },
    );

    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnConfirmDelete).not.toHaveBeenCalled();
    });
  });
});
