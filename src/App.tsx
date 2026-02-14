import Header from '@/components/layout/Header';
import Home from '@/pages/Home';
import ClickSpark from './components/react-bits/click-spark/ClickSpark';
import { ThemeProvider } from './components/theme/ThemeProvider';

export default function App() {
  return (
    <ThemeProvider>
      <ClickSpark
        sparkColor="#cdd6f4"
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
        <div className="container py-4 sm:py-6 lg:py-8">
          <Header />
          <Home />
        </div>
      </ClickSpark>
    </ThemeProvider>
  );
}
