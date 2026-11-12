import { HomePage } from '@/pages/home';
import { StoreProvider } from './providers/StoreProvider.jsx';
import './styles/index.scss';

export function App() {
  return (
    <StoreProvider>
      <HomePage />
    </StoreProvider>
  );
}
