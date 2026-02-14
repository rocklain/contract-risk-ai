import React from 'react';
import ReactDOM from 'react-dom/client';
import '@mantine/core/styles.css';
// 1. 通知用のCSSをインポート
import '@mantine/notifications/styles.css';

import { MantineProvider } from '@mantine/core';
// 2. Notificationsコンポーネントをインポート
import { Notifications } from '@mantine/notifications';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider>
      {/* 3. MantineProviderの中に配置 */}
      <Notifications position="top-right" zIndex={1000} />
      <App />
    </MantineProvider>
  </React.StrictMode>
);