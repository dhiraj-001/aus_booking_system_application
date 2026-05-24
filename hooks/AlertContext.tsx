import React, { createContext, useContext, useState, ReactNode } from 'react';
import CustomAlert, { AlertButton } from '../components/CustomAlert';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (title: string, message: string, buttons?: AlertButton[], type?: AlertType) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (title: string, message: string, buttons?: AlertButton[], type?: AlertType) => {
    // Attempt to guess type based on title if not provided
    let guessedType: AlertType = type || 'info';
    if (!type) {
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('success')) guessedType = 'success';
      else if (lowerTitle.includes('error') || lowerTitle.includes('failed') || lowerTitle.includes('invalid')) guessedType = 'error';
      else if (lowerTitle.includes('warning') || lowerTitle.includes('discard') || lowerTitle.includes('notice')) guessedType = 'warning';
    }

    setAlertState({
      visible: true,
      title,
      message,
      type: guessedType,
      buttons,
    });
  };

  const hideAlert = () => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
